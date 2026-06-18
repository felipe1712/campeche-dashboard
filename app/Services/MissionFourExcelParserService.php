<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Models\Indicator;

class MissionFourExcelParserService
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
                \Illuminate\Support\Facades\Log::info("=== PROCESANDO HOJA ÍNDICE (M4): $sheetTitle ===");
                
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

            $isInversion = stripos($meta['titulo'], 'inversión') !== false || stripos($meta['titulo'], 'inversiones') !== false;

            $sheetData = $this->parseDetailSheetForYear($sheet, $year, $clave);
            
            $metadataDinamica = [];
            $desgloseMunicipal = false;

            if ($isInversion) {
                // Inversión: Gráfica desde el índice
                $metadataDinamica = [
                    ["Año" => "2023", "Monto" => $meta['v2023']],
                    ["Año" => "2024", "Monto" => $meta['v2024']],
                    ["Año" => "2025", "Monto" => $meta['v2025']]
                ];
            } else {
                // Normal: Gráfica desde la tabla
                if (!empty($sheetData['tables'])) {
                    $table = $sheetData['tables'][0];
                    $headers = $table['headers'];
                    
                    if (count($headers) > 0 && strtolower(trim($headers[0])) === 'municipio') {
                        $desgloseMunicipal = true;
                    }

                    foreach ($table['rows'] as $tableRow) {
                        $rowKey = $tableRow[0] ?? '';
                        if (empty($rowKey) || strtolower(trim($rowKey)) === 'total') continue;
                        
                        $rowData = [$headers[0] => $rowKey];
                        for ($idx = 1; $idx < count($headers); $idx++) {
                            $rowData[$headers[$idx]] = $tableRow[$idx] ?? null;
                        }
                        $metadataDinamica[] = $rowData;
                    }
                }
            }

            $results[] = [
                'clave'              => $clave,
                'año'                => $year,
                'mision'             => $mision,
                'metadata_dinamica'  => $metadataDinamica,
                'metadata_tabla'     => $sheetData['tables'],
                'notas'              => $sheetData['notas'],
                'fuente'             => $sheetData['fuente'],
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

        // Find how far the headers go
        $headers = [];
        for ($c = $titleCol; $c <= $highestCol; $c++) {
            $h = $grid[$headerRow][$c];
            if ($h === '') {
                // If it's empty, it might be the end of the table. 
                // Let's check if the NEXT column is also empty to confirm.
                if (($c + 1) > $highestCol || $grid[$headerRow][$c + 1] === '') {
                    break;
                }
            }
            $headers[] = $h ?: 'Col_' . $c;
        }

        if (empty($headers)) {
            return ['tables' => null, 'notas' => '', 'fuente' => ''];
        }

        $rows = [];
        for ($r = $headerRow + 1; $r <= $highestRow; $r++) {
            $firstColVal = strtolower($grid[$r][$titleCol]);
            
            if (str_starts_with($firstColVal, 'nota') || str_starts_with($firstColVal, 'fuente') || str_starts_with($firstColVal, 'total de m') || str_starts_with($firstColVal, 'total de s') || str_starts_with($firstColVal, 'total de i')) {
                // We hit the end of the table
                // For M4-051, there are multiple "Total de..." rows, we should capture them as data rows if they are numeric
                if (str_starts_with($firstColVal, 'nota') || str_starts_with($firstColVal, 'fuente')) {
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
