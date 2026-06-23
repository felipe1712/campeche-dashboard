<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\IOFactory;

class StrategicExcelParserService
{
    /**
     * Parse Excel files specifically for Strategic Indicators, handling complex 
     * multi-table layouts, historical data spans, and vertical table stacking.
     */
    public function parseFile($filePath, $year, $mision)
    {
        $spreadsheet = IOFactory::load($filePath);
        $sheets = $spreadsheet->getAllSheets();

        $metadataMap = [];
        
        // 1. Process Index sheet
        foreach ($sheets as $sheet) {
            $sheetTitle = $sheet->getTitle();
            if (str_contains(strtolower($sheetTitle), 'ndice') || str_contains(mb_strtolower($sheetTitle, 'UTF-8'), 'ndice')) {
                \Illuminate\Support\Facades\Log::info("=== PROCESANDO HOJA ÍNDICE (ESTRATÉGICO): $sheetTitle ===");
                
                $highestRow = min(200, $sheet->getHighestRow());
                $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($sheet->getHighestColumn());
                
                $headers = [];
                $headerRowIndex = -1;
                for ($row = 1; $row <= 15; $row++) {
                    $tempHeaders = [];
                    for ($col = 1; $col <= $highestColumnIndex; $col++) {
                        $val = trim((string)$sheet->getCell([$col, $row])->getCalculatedValue());
                        $tempHeaders[$col] = mb_strtolower($val, 'UTF-8');
                    }
                    if (array_search('clave', $tempHeaders) !== false || array_search('codigo', $tempHeaders) !== false || array_search('código', $tempHeaders) !== false) {
                        $headers = $tempHeaders;
                        $headerRowIndex = $row;
                        break;
                    }
                }

                if ($headerRowIndex !== -1) {
                    $colClave = false; $colTema = false; $colSubtema = false; $colTitulo = false; $colDependencia = false;
                    foreach ($headers as $col => $header) {
                        if (str_contains($header, 'clave') || str_contains($header, 'codigo')) $colClave = $colClave ?: $col;
                        elseif (str_contains($header, 'subtema')) $colSubtema = $colSubtema ?: $col;
                        elseif (str_contains($header, 'tema')) $colTema = $colTema ?: $col;
                        elseif (str_contains($header, 'título') || str_contains($header, 'titulo')) $colTitulo = $colTitulo ?: $col;
                        elseif (str_contains($header, 'dependencia')) $colDependencia = $colDependencia ?: $col;
                    }
                    
                    if ($colClave) {
                        for ($row = $headerRowIndex + 1; $row <= $highestRow; $row++) {
                            $clave = trim((string)$sheet->getCell([$colClave, $row])->getCalculatedValue());
                            if ($clave) {
                                $metadataMap[$clave] = [
                                    'tema'       => $colTema      ? trim((string)$sheet->getCell([$colTema, $row])->getCalculatedValue())      : 'Sin Tema',
                                    'subtema'    => $colSubtema   ? trim((string)$sheet->getCell([$colSubtema, $row])->getCalculatedValue())   : '',
                                    'titulo'     => $colTitulo    ? trim((string)$sheet->getCell([$colTitulo, $row])->getCalculatedValue())    : 'Indicador ' . $clave,
                                    'dependencia'=> $colDependencia ? trim((string)$sheet->getCell([$colDependencia, $row])->getCalculatedValue()) : 'No Especificada',
                                ];
                            }
                        }
                    }
                }
            }
        }

        $results = [];

        // 2. Process Data Sheets
        foreach ($sheets as $sheet) {
            $sheetTitle = trim($sheet->getTitle());
            if (str_contains(strtolower($sheetTitle), 'ndice') || str_contains(mb_strtolower($sheetTitle, 'UTF-8'), 'ndice')) {
                continue;
            }

            preg_match('/M\d-\d+/', $sheetTitle, $matches);
            $clave = $matches[0] ?? $sheetTitle;

            if (!isset($metadataMap[$clave])) {
                continue;
            }

            $highestRow = $sheet->getHighestRow();
            $highestColumn = $sheet->getHighestColumn();
            $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);

            // Read the entire sheet into memory for block analysis
            $rawGrid = [];
            for ($row = 1; $row <= $highestRow; $row++) {
                $rawGrid[$row] = [];
                for ($col = 1; $col <= $highestColumnIndex; $col++) {
                    $rawGrid[$row][$col] = trim((string)$sheet->getCell([$col, $row])->getCalculatedValue());
                }
            }

            $mergedData = []; // Keyed by col_1 value (e.g. "El Código de ética")
            $notas = [];
            $fuente = null;
            $currentGlobalTitle = '';
            
            $r = 1;
            while ($r <= $highestRow) {
                // Check if row is empty
                $isEmpty = true;
                $nonEmptyCols = 0;
                $firstNonEmpty = '';
                for ($c = 1; $c <= $highestColumnIndex; $c++) {
                    if ($rawGrid[$r][$c] !== '') {
                        $isEmpty = false;
                        $nonEmptyCols++;
                        if ($firstNonEmpty === '') $firstNonEmpty = strtolower($rawGrid[$r][$c]);
                    }
                }

                if ($isEmpty) {
                    $r++;
                    continue;
                }

                // Check for notas/fuentes
                if (str_starts_with($firstNonEmpty, 'nota') || str_starts_with($firstNonEmpty, 'fuente')) {
                    if (str_starts_with($firstNonEmpty, 'fuente')) $fuente = $rawGrid[$r][1];
                    else $notas[] = $rawGrid[$r][1];
                    $r++;
                    continue;
                }

                // Check if it's a lone title row (like "Sesiones de capacitación... 2024")
                if ($nonEmptyCols === 1 && $rawGrid[$r][1] !== '') {
                    $currentGlobalTitle = $rawGrid[$r][1];
                    $r++;
                    continue;
                }

                // We hit a dense block (a table). Let's find its end.
                $startRow = $r;
                $endRow = $r;
                while ($endRow <= $highestRow) {
                    $nextRowEmpty = true;
                    $nextFirstLower = '';
                    if ($endRow + 1 <= $highestRow) {
                        for ($c = 1; $c <= $highestColumnIndex; $c++) {
                            if ($rawGrid[$endRow + 1][$c] !== '') {
                                $nextRowEmpty = false;
                                if ($nextFirstLower === '') $nextFirstLower = strtolower($rawGrid[$endRow + 1][$c]);
                            }
                        }
                    }
                    if ($nextRowEmpty || str_starts_with($nextFirstLower, 'nota') || str_starts_with($nextFirstLower, 'fuente')) {
                        break;
                    }
                    $endRow++;
                }

                // Parse the table block [$startRow, $endRow]
                // Determine how many rows are headers.
                $dataStartRow = $startRow;
                for ($row = $startRow; $row <= $endRow; $row++) {
                    $isHeader = false;
                    $firstColLower = strtolower($rawGrid[$row][1]);
                    
                    // Known header keywords that protect against numbers-as-headers (M1-025)
                    $headerKeywords = ['municipio', 'tema', 'tipo', 'acciones', 'medios', 'sede', 'total'];
                    $hasKeyword = false;
                    foreach ($headerKeywords as $kw) {
                        if (str_starts_with($firstColLower, $kw)) $hasKeyword = true;
                    }

                    if ($hasKeyword) {
                        $isHeader = true;
                    } else {
                        // Check if row has text in other columns
                        $hasText = false;
                        for ($c = 2; $c <= $highestColumnIndex; $c++) {
                            $val = $rawGrid[$row][$c];
                            if ($val !== '' && !is_numeric($val) && $val !== 'o' && $val !== 'O') {
                                // sometimes zero is typed as 'o'
                                $hasText = true;
                            }
                        }
                        if ($hasText) $isHeader = true;
                    }

                    if (!$isHeader && $row > $startRow) {
                        $dataStartRow = $row;
                        break;
                    }
                }

                // If no clear data row found, assume the last row is data
                if ($dataStartRow == $startRow) $dataStartRow = $startRow + 1;
                if ($dataStartRow > $endRow) $dataStartRow = $endRow;

                // Determine max column for this specific block
                $blockMaxCol = 1;
                for ($row = $startRow; $row <= $endRow; $row++) {
                    for ($col = $highestColumnIndex; $col >= 1; $col--) {
                        if ($rawGrid[$row][$col] !== '') {
                            if ($col > $blockMaxCol) $blockMaxCol = $col;
                            break;
                        }
                    }
                }

                // Flatten headers
                $flattenedHeaders = [];
                for ($c = 1; $c <= $blockMaxCol; $c++) {
                    $colHeaderParts = [];
                    for ($row = $startRow; $row < $dataStartRow; $row++) {
                        $val = $rawGrid[$row][$c];
                        // Fill-right for horizontal spans
                        if ($val === '' && $c > 1) {
                            // Look left in the same row
                            for ($left = $c - 1; $left >= 1; $left--) {
                                if ($rawGrid[$row][$left] !== '') {
                                    $val = $rawGrid[$row][$left];
                                    break;
                                }
                            }
                        }
                        if ($val !== '') {
                            $colHeaderParts[] = $val;
                        }
                    }
                    $headerStr = implode(' - ', array_unique($colHeaderParts));
                    $flattenedHeaders[$c] = $headerStr ?: "col_$c";
                }

                // Determine if we need to prefix a year from $currentGlobalTitle (for Vertical tables like M1-012)
                $prefixYear = '';
                if (preg_match('/\b(20\d{2})\b/', $currentGlobalTitle, $m)) {
                    $prefixYear = $m[1];
                }

                // Ensure the first column header doesn't get year prefixes
                $firstColHeader = $flattenedHeaders[1];

                // Map data rows
                for ($row = $dataStartRow; $row <= $endRow; $row++) {
                    $rowKey = $rawGrid[$row][1]; // e.g., "Calakmul" or "El Código de ética"
                    if ($rowKey === '') continue; // Skip empty labels
                    
                    if (!isset($mergedData[$rowKey])) {
                        $mergedData[$rowKey] = [$firstColHeader => $rowKey];
                    }

                    for ($c = 2; $c <= $blockMaxCol; $c++) {
                        $val = $rawGrid[$row][$c];
                        if ($val === '') continue;

                        $headerKey = $flattenedHeaders[$c];
                        if ($prefixYear !== '' && !preg_match('/\b20\d{2}\b/', $headerKey)) {
                            $headerKey = $prefixYear . ' - ' . $headerKey;
                        }
                        $mergedData[$rowKey][$headerKey] = is_numeric($val) ? (float)$val : $val;
                    }
                }

                $r = $endRow + 1;
            }

            // Clean up fill-down for first column if there are empty groups
            $lastRowKey = null;
            $cleanData = [];
            $meta = $metadataMap[$clave];
            foreach ($mergedData as $key => $rowData) {
                $cleanData[] = $rowData;
            }

            $desgloseMunicipal = false;
            if (count($cleanData) > 0) {
                $firstHeader = array_keys($cleanData[0])[0];
                if (strtolower(trim($firstHeader)) === 'municipio') {
                    $desgloseMunicipal = true;
                    $lastRow = end($cleanData);
                    $lastVal = strtolower(trim($lastRow[$firstHeader] ?? ''));
                    if (!in_array($lastVal, ['estado', 'total', 'total estatal'])) {
                        $sumRow = [$firstHeader => 'ESTADO'];
                        foreach ($cleanData as $row) {
                            $municipioName = strtolower(trim($row[$firstHeader] ?? ''));
                            // Skip garbage summary rows that some tables append at the bottom
                            if (strpos($municipioName, 'total de') === 0 || $municipioName === 'notas' || $municipioName === 'fuente') continue;

                            foreach ($row as $k => $v) {
                                $cleanV = str_replace(',', '', (string)$v);
                                if ($k !== $firstHeader && is_numeric($cleanV)) {
                                    $sumRow[$k] = ($sumRow[$k] ?? 0) + (float)$cleanV;
                                } elseif ($k !== $firstHeader && !isset($sumRow[$k])) {
                                    $sumRow[$k] = null;
                                }
                            }
                        }
                        $cleanData[] = $sumRow;
                    }
                }
            }

            $meta = $metadataMap[$clave];
            $results[] = [
                'clave'            => $clave,
                'año'              => $year,
                'mision'           => $mision,
                'metadata_dinamica'=> $cleanData,
                'notas'            => implode("\n", $notas),
                'fuente'           => $fuente,
                'titulo'           => $meta['titulo'],
                'dependencia'      => $meta['dependencia'],
                'tema_nombre'      => $meta['tema'],
                'subtema_nombre'   => $meta['subtema'],
                'desglose_municipal' => $desgloseMunicipal,
                'is_estrella'      => true, // Force true since this is the strategic parser
            ];
        }

        return $results;
    }
}
