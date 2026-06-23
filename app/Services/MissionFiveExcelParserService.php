<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Models\Indicator;

class MissionFiveExcelParserService
{
    public function parseFile($filePath, $year, $mision)
    {
        $spreadsheet = IOFactory::load($filePath);
        $sheets = $spreadsheet->getAllSheets();

        $metadataMap = [];
        $indexSheet = null;
        
        // 1. Process Index sheet
        foreach ($sheets as $sheet) {
            $sheetTitle = mb_strtolower($sheet->getTitle(), 'UTF-8');
            if (str_contains($sheetTitle, 'indice') || str_contains($sheetTitle, 'índice')) {
                $indexSheet = $sheet;
                \Illuminate\Support\Facades\Log::info("=== PROCESANDO HOJA ÍNDICE (M5): $sheetTitle ===");
                
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
                    if (array_search('código', $tempHeaders) !== false || array_search('codigo', $tempHeaders) !== false || array_search('clave', $tempHeaders) !== false) {
                        $headers = $tempHeaders;
                        $headerRowIndex = $row;
                        break;
                    }
                }

                if ($headerRowIndex !== -1) {
                    $colClave = false; $colTema = false; $colSubtema = false; $colTitulo = false; $colDependencia = false;
                    foreach ($headers as $col => $header) {
                        if (str_contains($header, 'código') || str_contains($header, 'codigo') || str_contains($header, 'clave')) $colClave = $colClave ?: $col;
                        elseif ($header === 'tema') $colSubtema = $colSubtema ?: $col; // En M4, la columna "TEMA" contiene el subtema
                        elseif (str_contains($header, 'tema')) $colTema = $colTema ?: $col; // TEMA_indice
                        elseif (str_contains($header, 'título') || str_contains($header, 'titulo')) $colTitulo = $colTitulo ?: $col;
                        elseif (str_contains($header, 'dependencia')) $colDependencia = $colDependencia ?: $col;
                    }
                    
                    if ($colClave) {
                        for ($row = $headerRowIndex + 1; $row <= $highestRow; $row++) {
                            $clave = trim((string)$sheet->getCell([$colClave, $row])->getCalculatedValue());
                            if ($clave) {
                                // Extract totals for investments (assuming columns are right after SEMAFORO)
                                // Semáforo is at col 5, so 2023 is 6, 2024 is 7, 2025 is 8
                                $val2023 = trim((string)$sheet->getCell([7, $row])->getCalculatedValue()); // 7 = G (2023)
                                $val2024 = trim((string)$sheet->getCell([8, $row])->getCalculatedValue()); // 8 = H (2024)
                                $val2025 = trim((string)$sheet->getCell([9, $row])->getCalculatedValue()); // 9 = I (2025)
                                
                                $cleanNum = function($v) {
                                    $v = preg_replace('/[^0-9\.]/', '', $v);
                                    return is_numeric($v) ? (float)$v : 0;
                                };

                                $metadataMap[$clave] = [
                                    'tema'       => $colTema      ? trim((string)$sheet->getCell([$colTema, $row])->getCalculatedValue())      : 'Sin Tema',
                                    'subtema'    => $colSubtema   ? trim((string)$sheet->getCell([$colSubtema, $row])->getCalculatedValue())   : '',
                                    'titulo'     => $colTitulo    ? trim((string)$sheet->getCell([$colTitulo, $row])->getCalculatedValue())    : 'Indicador ' . $clave,
                                    'dependencia'=> $colDependencia ? trim((string)$sheet->getCell([$colDependencia, $row])->getCalculatedValue()) : 'No Especificada',
                                    'v2023'      => $cleanNum($val2023),
                                    'v2024'      => $cleanNum($val2024),
                                    'v2025'      => $cleanNum($val2025),
                                ];
                            }
                        }
                    }
                }
                break;
            }
        }

        $results = [];

        // 2. Process Data Sheets
        foreach ($sheets as $sheet) {
            $sheetTitle = trim($sheet->getTitle());
            if (str_contains(strtolower($sheetTitle), 'ndice') || str_contains(mb_strtolower($sheetTitle, 'UTF-8'), 'ndice') || str_starts_with($sheetTitle, 'Coyuntura')) {
                continue;
            }

            preg_match('/M\d-\d+/', $sheetTitle, $matches);
            $clave = $matches[0] ?? $sheetTitle;
            
            if (!isset($metadataMap[$clave])) {
                continue;
            }

            $meta = $metadataMap[$clave];

            $isInversion = stripos($meta['titulo'], 'inversión') !== false || stripos($meta['titulo'], 'inversiones') !== false || $clave === 'M5-007';
            $metadataDinamica = [];
            $desgloseMunicipal = false;
            $metadataTablaGlobal = null;

            if ($clave === 'M5-020') {
                $highestRow = min(500, $sheet->getHighestRow());
                $highestCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($sheet->getHighestColumn());
                $grid = [];
                for ($r = 1; $r <= $highestRow; $r++) {
                    for ($c = 1; $c <= $highestCol; $c++) {
                        $grid[$r][$c] = trim((string)$sheet->getCell([$c, $r])->getCalculatedValue());
                    }
                }
                
                $foundRow = -1;
                $foundCol = -1;
                for ($r = 1; $r <= $highestRow; $r++) {
                    for ($c = 1; $c <= $highestCol; $c++) {
                        if (stripos($grid[$r][$c], 'cobertura') !== false) {
                            $rowString = implode(' ', $grid[$r]);
                            if (strpos($rowString, '2021') !== false && strpos($rowString, '2025') !== false) {
                                $foundRow = $r;
                                $foundCol = $c;
                                break 2;
                            }
                        }
                    }
                }
                
                if ($foundRow !== -1) {
                    $headers = [];
                    for ($c = $foundCol; $c <= $foundCol + 5; $c++) {
                        $headers[] = $grid[$foundRow][$c];
                    }
                    
                    $tableRows = [];
                    for ($r = $foundRow + 1; $r <= $highestRow; $r++) {
                        $firstVal = strtolower(trim($grid[$r][$foundCol]));
                        if (str_starts_with($firstVal, 'nota') || str_starts_with($firstVal, 'fuente')) {
                            break;
                        }
                        if (empty($firstVal)) {
                            continue;
                        }
                        $rowCells = [];
                        for ($c = $foundCol; $c <= $foundCol + 5; $c++) {
                            $rowCells[] = $grid[$r][$c];
                        }
                        $tableRows[] = $rowCells;
                    }
                    
                    $metadataTablaGlobal = [[
                        'year' => 'Todos',
                        'headers' => $headers,
                        'rows' => $tableRows
                    ]];
                    
                    $estatalRow = null;
                    $nacionalRow = null;
                    foreach ($tableRows as $tr) {
                        if (stripos($tr[0], 'estatal') !== false) $estatalRow = $tr;
                        if (stripos($tr[0], 'nacional') !== false) $nacionalRow = $tr;
                    }
                    
                    if ($estatalRow && $nacionalRow) {
                        for ($i = 1; $i <= 5; $i++) {
                            $year = $headers[$i];
                            $metadataDinamica[] = [
                                'Año' => $year,
                                'Estatal' => (float)str_replace(['%', ','], '', $estatalRow[$i]),
                                'Nacional' => (float)str_replace(['%', ','], '', $nacionalRow[$i]),
                            ];
                        }
                    }
                    
                    \Illuminate\Support\Facades\Log::info("M5-020 extraido: ", ['dinamica' => $metadataDinamica]);
                }
                
                $results[] = [
                    'clave'              => $clave,
                    'año'                => $year,
                    'mision'             => $mision,
                    'metadata_dinamica'  => $metadataDinamica,
                    'metadata_tabla'     => $metadataTablaGlobal ?? [],
                    'notas'              => $meta['notas'] ?? '',
                    'fuente'             => $meta['fuente'] ?? '',
                    'titulo'             => $meta['titulo'],
                    'dependencia'        => $meta['dependencia'],
                    'tema_nombre'        => $meta['tema'],
                    'subtema_nombre'     => $meta['subtema'],
                    'desglose_municipal' => false,
                    'is_estrella'        => true,
                ];
                continue;
            }

            if ($isInversion) {
                // Inversión: Gráfica desde el índice
                $metadataDinamica = [
                    ["Año" => "2023", "Monto" => $meta['v2023']],
                    ["Año" => "2024", "Monto" => $meta['v2024']],
                    ["Año" => "2025", "Monto" => $meta['v2025']]
                ];
                
                $metadataTablaGlobal = [];
                foreach (['2023', '2024', '2025'] as $targetYear) {
                    $sheetData = $this->parseDetailSheetForYear($sheet, $targetYear, $clave);
                    if (!empty($sheetData['tables'])) {
                        $metadataTablaGlobal = array_merge($metadataTablaGlobal, $sheetData['tables']);
                    }
                }

            } else {
                foreach (['2023', '2024', '2025'] as $targetYear) {
                    $sheetData = $this->parseDetailSheetForYear($sheet, $targetYear, $clave);
                    
                    if (!empty($sheetData['tables'])) {
                        $table = $sheetData['tables'][0];
                        $headers = $table['headers'];
                        $rows = $table['rows'];
                        
                        if ($metadataTablaGlobal === null) {
                            $metadataTablaGlobal = $sheetData['tables'];
                        } else {
                            $metadataTablaGlobal = array_merge($metadataTablaGlobal, $sheetData['tables']);
                        }

                        // Check if headers are municipalities
                        $municipios = ['calakmul', 'calkini', 'calkiní', 'campeche', 'candelaria', 'carmen', 'champoton', 'champotón', 'dzitbalche', 'dzitbalché', 'escarcega', 'escárcega', 'hecelchakan', 'hecelchakán', 'hopelchen', 'hopelchén', 'palizada', 'seybaplaya', 'tenabo'];
                        $matchCount = 0;
                        foreach ($headers as $header) {
                            if (in_array(strtolower(trim($header)), $municipios)) {
                                $matchCount++;
                            }
                        }

                        if ($matchCount >= 3) {
                            // Transpose table
                            $newHeaders = ['MUNICIPIO'];
                            foreach ($rows as $row) {
                                $val = $row[0] ?? '';
                                if (!empty(trim($val))) {
                                    $newHeaders[] = $val;
                                }
                            }

                            $newRows = [];
                            for ($colIdx = 1; $colIdx < count($headers); $colIdx++) {
                                $headerName = $headers[$colIdx] ?? '';
                                if (preg_match('/^(total|registro)/i', trim($headerName))) continue;
                                
                                $newRow = [$headerName];
                                $rowCounter = 1;
                                foreach ($rows as $row) {
                                    $val = $row[0] ?? '';
                                    if (!empty(trim($val))) {
                                        $newRow[$rowCounter] = $row[$colIdx] ?? null;
                                        $rowCounter++;
                                    }
                                }
                                $newRows[] = $newRow;
                            }

                            $headers = $newHeaders;
                            $rows = $newRows;
                        }
                        
                        if (count($headers) > 0 && strtolower(trim($headers[0])) === 'municipio') {
                            $desgloseMunicipal = true;
                        }

                        $yearData = [];
                        foreach ($rows as $tableRow) {
                            $rowKey = (string)($tableRow[0] ?? '');
                            if (empty(trim($rowKey))) continue;

                            $lowerKey = strtolower(trim($rowKey));
                            if (str_starts_with($lowerKey, 'nota') || str_starts_with($lowerKey, 'fuente') || preg_match('/^[a-z]\//', $lowerKey)) {
                                continue;
                            }
                            
                            $rowData = [$headers[0] => $rowKey];
                            for ($idx = 1; $idx < count($headers); $idx++) {
                                $rowData[$headers[$idx]] = $tableRow[$idx] ?? null;
                            }
                            $yearData[] = $rowData;
                        }

                        if ($clave === 'M5-015') {
                            $carey = ['ESPECIE' => 'CAREY'];
                            $blanca = ['ESPECIE' => 'BLANCA'];
                            $lora = ['ESPECIE' => 'LORA'];
                            
                            $lastRowData = end($yearData);
                            $hasCarey = false;
                            $hasBlanca = false;
                            $hasLora = false;
                            
                            foreach ($lastRowData as $k => $v) {
                                $cleanV = (float)str_replace(',', '', (string)$v);
                                if (stripos($k, 'carey') !== false) {
                                    if (stripos($k, 'nidos') !== false) $carey['NIDOS'] = $cleanV;
                                    if (stripos($k, 'huevos') !== false) $carey['HUEVOS'] = $cleanV;
                                    if (stripos($k, 'crias') !== false || stripos($k, 'crías') !== false) $carey['CRIAS'] = $cleanV;
                                    if ($cleanV > 0) $hasCarey = true;
                                }
                                if (stripos($k, 'blanca') !== false) {
                                    if (stripos($k, 'nidos') !== false) $blanca['NIDOS'] = $cleanV;
                                    if (stripos($k, 'huevos') !== false) $blanca['HUEVOS'] = $cleanV;
                                    if (stripos($k, 'crias') !== false || stripos($k, 'crías') !== false) $blanca['CRIAS'] = $cleanV;
                                    if ($cleanV > 0) $hasBlanca = true;
                                }
                                if (stripos($k, 'lora') !== false) {
                                    if (stripos($k, 'nidos') !== false) $lora['NIDOS'] = $cleanV;
                                    if (stripos($k, 'huevos') !== false) $lora['HUEVOS'] = $cleanV;
                                    if (stripos($k, 'crias') !== false || stripos($k, 'crías') !== false) $lora['CRIAS'] = $cleanV;
                                    if ($cleanV > 0) $hasLora = true;
                                }
                            }
                            
                            $yearData = [];
                            // Ensure NIDOS is at least set to 0 if the species exists in the table header
                            if ($hasCarey || isset($carey['NIDOS'])) {
                                $carey['NIDOS'] = $carey['NIDOS'] ?? 0;
                                $carey['HUEVOS'] = $carey['HUEVOS'] ?? 0;
                                $carey['CRIAS'] = $carey['CRIAS'] ?? 0;
                                $yearData[] = $carey;
                            }
                            if ($hasBlanca || isset($blanca['NIDOS'])) {
                                $blanca['NIDOS'] = $blanca['NIDOS'] ?? 0;
                                $blanca['HUEVOS'] = $blanca['HUEVOS'] ?? 0;
                                $blanca['CRIAS'] = $blanca['CRIAS'] ?? 0;
                                $yearData[] = $blanca;
                            }
                            if ($hasLora || isset($lora['NIDOS'])) {
                                $lora['NIDOS'] = $lora['NIDOS'] ?? 0;
                                $lora['HUEVOS'] = $lora['HUEVOS'] ?? 0;
                                $lora['CRIAS'] = $lora['CRIAS'] ?? 0;
                                $yearData[] = $lora;
                            }
                            
                            $desgloseMunicipal = false;
                        }

                        if ($clave === 'M5-017') {
                            $yearData = array_filter($yearData, function($r) use ($headers) {
                                return stripos((string)$r[$headers[0]], 'total') !== false;
                            });
                            // Re-index array
                            $yearData = array_values($yearData);
                        }

                        if ($desgloseMunicipal && count($yearData) > 0) {
                            $lastRow = end($yearData);
                            $firstHeader = array_keys($yearData[0])[0];
                            $lastVal = strtolower(trim((string)($lastRow[$firstHeader] ?? '')));
                            if (stripos($lastVal, 'estado') === false && stripos($lastVal, 'total') === false) {
                                $sumRow = [$firstHeader => 'ESTADO'];
                                foreach ($yearData as $row) {
                                    $municipioName = strtolower(trim((string)($row[$firstHeader] ?? '')));
                                    if (strpos($municipioName, 'total de') === 0 || $municipioName === 'notas' || $municipioName === 'fuente') continue;
                                    
                                    foreach ($row as $k => $v) {
                                        $cleanV = str_replace(',', '', $v);
                                        if ($k !== $firstHeader && is_numeric($cleanV)) {
                                            $sumRow[$k] = ($sumRow[$k] ?? 0) + (float)$cleanV;
                                        } elseif ($k !== $firstHeader && !isset($sumRow[$k])) {
                                            $sumRow[$k] = null;
                                        }
                                    }
                                }
                                $yearData[] = $sumRow;
                            } else {
                                // Rename the total row key to 'ESTADO' for consistency
                                $yearData[count($yearData) - 1][$firstHeader] = 'ESTADO';
                            }
                        }

                        // Add Año to all rows
                        foreach ($yearData as &$r) {
                            $r['Año'] = $targetYear;
                        }
                        unset($r);

                        $metadataDinamica = array_merge($metadataDinamica, $yearData);
                    }
                }
            }

            $results[] = [
                'clave'              => $clave,
                'año'                => $year,
                'mision'             => $mision,
                'metadata_dinamica'  => $metadataDinamica,
                'metadata_tabla'     => $metadataTablaGlobal ?? [],
                'notas'              => $meta['notas'] ?? '',
                'fuente'             => $meta['fuente'] ?? '',
                'titulo'             => $meta['titulo'],
                'dependencia'        => $meta['dependencia'],
                'tema_nombre'        => $meta['tema'],
                'subtema_nombre'     => $meta['subtema'],
                'desglose_municipal' => $desgloseMunicipal,
                'is_estrella'        => true,
            ];
        }

        return $results;
    }

    private function parseDetailSheetForYear($sheet, $targetYear, $clave)
    {
        $highestRow = min(500, $sheet->getHighestRow());
        $highestCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($sheet->getHighestColumn());

        // Read the entire sheet into memory
        $grid = [];
        for ($r = 1; $r <= $highestRow; $r++) {
            $grid[$r] = [];
            for ($c = 1; $c <= $highestCol; $c++) {
                $grid[$r][$c] = trim((string)$sheet->getCell([$c, $r])->getCalculatedValue());
            }
        }

        $notasArr = [];
        $fuenteStr = '';

        // Extract global notas/fuentes (usually at the very bottom of the blocks)
        for ($r = 1; $r <= $highestRow; $r++) {
            $val = strtolower($grid[$r][1]);
            if (str_starts_with($val, 'nota')) {
                $notasArr[] = $grid[$r][1];
            }
            if (str_starts_with($val, 'fuente') || str_starts_with($val, '*')) {
                $fuenteStr = $grid[$r][1];
            }
        }

        // Find the title cell that contains the target year
        $titleRow = -1;
        $titleCol = -1;
        $titleText = '';

        for ($r = 1; $r <= $highestRow; $r++) {
            for ($c = 1; $c <= $highestCol; $c++) {
                $val = $grid[$r][$c];
                $valLower = strtolower($val);
                if (!empty($val) && preg_match('/\b' . $targetYear . '\b/', $val) && !str_starts_with($valLower, 'fuente') && !str_starts_with($valLower, 'nota')) {
                    // Check if it's a title row (usually the row below it has headers like OBRA, MUNICIPIO, etc.)
                    $titleRow = $r;
                    $titleCol = $c;
                    $titleText = $val;
                    break 2;
                }
            }
        }

        if ($titleRow === -1) {
            return ['tables' => null, 'notas' => '', 'fuente' => ''];
        }

        // The headers are usually on the next row
        $headerRow = $titleRow + 1;
        
        if ($headerRow > $highestRow) {
            return ['tables' => null, 'notas' => '', 'fuente' => ''];
        }

        // Find how far the headers go and handle potential two-level headers
        $rawHeaders1 = [];
        $lastH1 = '';
        $numCols = 0;
        for ($c = $titleCol; $c <= $highestCol; $c++) {
            $h1 = trim($grid[$headerRow][$c] ?? '');
            if ($h1 === '') {
                // If it's empty, it might be the end of the table or a merged cell. 
                $next1 = trim($grid[$headerRow][$c + 1] ?? '');
                $h2 = trim($grid[$headerRow + 1][$c] ?? '');
                $next2 = trim($grid[$headerRow + 1][$c + 1] ?? '');
                if ($next1 === '' && $h2 === '' && $next2 === '') {
                    break; // Truly the end
                }
            }
            
            if ($h1 !== '') {
                $lastH1 = $h1;
            } else {
                $h1 = $lastH1; // Carry over merged header
            }
            $rawHeaders1[$c] = $h1;
            $numCols++;
        }

        if (empty($rawHeaders1)) {
            return ['tables' => null, 'notas' => '', 'fuente' => ''];
        }

        // Check for two-level header
        $isTwoLevel = false;
        $firstColValNext = trim($grid[$headerRow + 1][$titleCol] ?? '');
        if ($firstColValNext === '') {
            for ($c = $titleCol + 1; $c < $titleCol + $numCols; $c++) {
                $h2 = trim($grid[$headerRow + 1][$c] ?? '');
                if ($h2 !== '' && !is_numeric(str_replace([',', '$', '%'], '', $h2))) {
                    $isTwoLevel = true;
                    break;
                }
            }
        }

        $headers = [];
        if ($isTwoLevel) {
            for ($c = $titleCol; $c < $titleCol + $numCols; $c++) {
                $h1 = $rawHeaders1[$c];
                $h2 = trim($grid[$headerRow + 1][$c] ?? '');
                if ($h1 !== '' && $h2 !== '' && $h1 !== $h2) {
                    $headers[] = $h1 . ' - ' . $h2;
                } else if ($h1 !== '') {
                    $headers[] = $h1;
                } else if ($h2 !== '') {
                    $headers[] = $h2;
                } else {
                    $headers[] = 'Col_' . $c;
                }
            }
            $dataStartRow = $headerRow + 2;
        } else {
            for ($c = $titleCol; $c < $titleCol + $numCols; $c++) {
                $h1 = trim($grid[$headerRow][$c] ?? '');
                $headers[] = $h1 !== '' ? $h1 : 'Col_' . $c;
            }
            $dataStartRow = $headerRow + 1;
        }

        // Clean headers (remove "BENEFICIARIOS" and "ACTIVIDAD ECONÓMICA" prefixes)
        foreach ($headers as &$h) {
            $h = preg_replace('/^BENEFICIARIOS[\s\-\(]+(MUJERES|HOMBRES)\)?$/iu', '$1', $h);
            $h = preg_replace('/^ACTIVIDAD ECON[OÓ]MICA[\s\-\(]+(COMERCIO|SERVICIOS)\)?$/iu', '$1', $h);
        }
        unset($h);

        if ($clave === 'M5-009' && $targetYear === '2023') {
            for ($r = $dataStartRow; $r <= $highestRow; $r++) {
                if (stripos(trim((string)$grid[$r][$titleCol]), 'inventariado') !== false) {
                    $dataStartRow = $r;
                    break;
                }
            }
        }

        $rows = [];
        for ($r = $dataStartRow; $r <= $highestRow; $r++) {
            $firstColVal = strtolower(trim((string)$grid[$r][$titleCol]));
            
            if (str_starts_with($firstColVal, 'nota') || str_starts_with($firstColVal, 'fuente') || preg_match('/^[a-z]\//', $firstColVal) || str_starts_with($firstColVal, 'total de m') || str_starts_with($firstColVal, 'total de s') || str_starts_with($firstColVal, 'total de i')) {
                // We hit the end of the table
                if (str_starts_with($firstColVal, 'nota') || str_starts_with($firstColVal, 'fuente') || preg_match('/^[a-z]\//', $firstColVal)) {
                    break;
                }
            }

            // Check if the row is completely empty
            $isEmpty = true;
            $rowCells = [];
            for ($i = 0; $i < count($headers); $i++) {
                $c = $titleCol + $i;
                $val = $grid[$r][$c];
                $rowCells[] = $val;
                if (!empty($val)) $isEmpty = false;
            }

            if ($isEmpty) {
                // Blank row might mean end of table for vertically stacked tables
                break;
            }

            if (empty(trim($rowCells[0])) && !empty($rows)) {
                $prevRow = end($rows);
                if (stripos(trim($prevRow[0]), 'total') === 0) {
                    break; // Already passed total
                }
            }

            $rows[] = $rowCells;
        }

        $tables = [
            [
                'year'    => $targetYear,
                'title'   => preg_replace('/,?\s*20\d{2}\.?\s*$/', '', trim($titleText)),
                'headers' => $headers,
                'rows'    => $rows
            ]
        ];

        return [
            'tables' => $tables,
            'notas'  => implode("\n", array_unique($notasArr)),
            'fuente' => $fuenteStr
        ];
    }
}
