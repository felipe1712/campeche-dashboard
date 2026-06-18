<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\IOFactory;

class MissionTwoExcelParserService
{
    public function parseFile($filePath, $year, $mision)
    {
        $spreadsheet = IOFactory::load($filePath);
        $sheets = $spreadsheet->getAllSheets();

        $indexSheet = null;
        foreach ($sheets as $sheet) {
            $title = mb_strtolower($sheet->getTitle(), 'UTF-8');
            if (str_contains($title, 'indice') || str_contains($title, 'índice')) {
                $indexSheet = $sheet;
                break;
            }
        }

        if (!$indexSheet) {
            throw new \Exception("No se encontró la hoja índice para la Misión 2.");
        }

        $highestRow = min(500, $indexSheet->getHighestRow());
        $results = [];

        // 1. Parsear el índice
        for ($row = 2; $row <= $highestRow; $row++) {
            $rowValues = [];
            $isInversion = false;
            $temaFound = '';
            
            for ($c = 1; $c <= 20; $c++) {
                $colStr = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($c);
                $cell = $indexSheet->getCell($colStr . $row);
                $val = trim((string)$cell->getCalculatedValue());
                $rowValues[$c] = $val;
                
                if (stripos($val, 'inversi') !== false) {
                    $isInversion = true;
                    $temaFound = $val;
                }
            }

            // Clave: Buscar en col 5 (E) o col 2 (B)
            $clave = $rowValues[5] ?? '';
            if (empty($clave) || $clave == '-') {
                $clave = $rowValues[2] ?? '';
            }
            if (empty($clave) || $clave == '-') {
                continue; // No valid clave
            }

            $titulo = $rowValues[8] ?? ''; // H (8)
            if (empty($titulo) || strlen($titulo) < 10) {
                // Fallback: the longest text in the row is likely the title
                $longest = '';
                foreach ([3, 6, 7, 8] as $idx) {
                    if (isset($rowValues[$idx]) && strlen($rowValues[$idx]) > strlen($longest)) {
                        $longest = $rowValues[$idx];
                    }
                }
                $titulo = $longest;
            }
            // Limpiar años o rangos de fechas al final del título (ej. ", 2024", " 2025.", ", Julio 2024 a junio 2025.")
            $titulo = preg_replace('/,?\s*(?:[a-zA-Z]+\s+)?20\d{2}\s*(?:a|al|y|-)\s*(?:[a-zA-Z]+\s+)?20\d{2}\.?\s*$/i', '', trim($titulo));
            $titulo = preg_replace('/,?\s*20\d{2}\.?\s*$/', '', trim($titulo));

            $dependencia = $rowValues[9] ?? ''; // I (9)
            if (empty($dependencia) || strlen($dependencia) > 20) {
                $dependencia = 'No especificada';
            }
            
            // L (12), M (13), N (14)
            $cleanNum = function($v) {
                $v = str_replace([',', '$', ' '], '', $v);
                return is_numeric($v) ? (float)$v : 0;
            };

            $val2023 = $cleanNum($rowValues[12] ?? 0);
            $val2024 = $cleanNum($rowValues[13] ?? 0);
            $val2025 = $cleanNum($rowValues[14] ?? 0);

            if ($isInversion) {
                // Inversión: Generamos gráfica directa y no buscamos su hoja
                $metadataDinamica = [
                    [
                        "Año" => "2023",
                        "Monto" => $val2023
                    ],
                    [
                        "Año" => "2024",
                        "Monto" => $val2024
                    ],
                    [
                        "Año" => "2025",
                        "Monto" => $val2025
                    ]
                ];

                $sheetData = $this->parseDetailSheet($spreadsheet, $clave);
                
                $results[] = [
                    'clave'              => $clave,
                    'año'                => $year,
                    'mision'             => $mision,
                    'metadata_dinamica'  => $metadataDinamica,
                    'metadata_tabla'     => $sheetData['tables'],
                    'notas'              => $sheetData['notas'],
                    'fuente'             => $sheetData['fuente'],
                    'titulo'             => $titulo ?: 'Inversión ' . $clave,
                    'dependencia'        => $dependencia,
                    'tema_nombre'        => $temaFound ?: 'Inversión',
                    'subtema_nombre'     => '',
                    'desglose_municipal' => false,
                    'is_estrella'        => true,
                ];
            } else {
                $sheetData = $this->parseDetailSheet($spreadsheet, $clave);
                
                $metadataDinamicaFromTable = [];
                if (!empty($sheetData['tables'])) {
                    $mergedRows = [];
                    foreach ($sheetData['tables'] as $table) {
                        $yearTitle = $table['title'] ?? '';
                        if (preg_match('/\d{4}-\d{4}|\d{4}/', $yearTitle, $m)) {
                            $yearLabel = $m[0];
                        } else {
                            $yearLabel = $table['year'] !== 'Todos' ? $table['year'] : '';
                        }
                        
                        $headers = $table['headers'] ?? [];
                        if (empty($headers)) continue;
                        $firstHeader = $headers[0];
                        
                        foreach ($table['rows'] as $tableRow) {
                            $rowKey = $tableRow[0] ?? '';
                            if (empty($rowKey) || strtolower(trim($rowKey)) === 'total') continue;
                            
                            if (!isset($mergedRows[$rowKey])) {
                                $mergedRows[$rowKey] = [$firstHeader => $rowKey];
                            }
                            
                            for ($idx = 1; $idx < count($headers); $idx++) {
                                $h = $headers[$idx] ?? '';
                                $keyName = count($sheetData['tables']) > 1 && $yearLabel 
                                    ? $h . ' - ' . $yearLabel 
                                    : $h;
                                $mergedRows[$rowKey][$keyName] = $tableRow[$idx] ?? null;
                            }
                        }
                    }
                    $metadataDinamicaFromTable = array_values($mergedRows);
                }
                
                $results[] = [
                    'clave'              => $clave,
                    'año'                => $year,
                    'mision'             => $mision,
                    'metadata_dinamica'  => $metadataDinamicaFromTable,
                    'metadata_tabla'     => $sheetData['tables'],
                    'notas'              => $sheetData['notas'],
                    'fuente'             => $sheetData['fuente'],
                    'titulo'             => $titulo ?: 'Indicador ' . $clave,
                    'dependencia'        => $dependencia,
                    'tema_nombre'        => trim($rowValues[10] ?? ''),
                    'subtema_nombre'     => '',
                    'desglose_municipal' => false,
                    'is_estrella'        => true,
                ];
            }
        }

        return $results;
    }

    private function parseDetailSheet($spreadsheet, $sheetName)
    {
        $sheet = $spreadsheet->getSheetByName($sheetName);
        if (!$sheet) {
            // Intentar buscar por sufijo/prefijo si no es exacto
            foreach ($spreadsheet->getAllSheets() as $s) {
                if (stripos($s->getTitle(), $sheetName) !== false) {
                    $sheet = $s;
                    break;
                }
            }
        }

        if (!$sheet) {
            return ['tables' => null, 'notas' => '', 'fuente' => ''];
        }

        $highestRow = min(500, $sheet->getHighestRow());
        $highestCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($sheet->getHighestColumn());

        // Leer todo en memoria
        $grid = [];
        for ($r = 1; $r <= $highestRow; $r++) {
            $grid[$r] = [];
            for ($c = 1; $c <= $highestCol; $c++) {
                $grid[$r][$c] = trim((string)$sheet->getCell([$c, $r])->getCalculatedValue());
            }
        }

        // Encontrar la fila de cabeceras
        // Buscamos en las primeras 10 filas la fila con la mayor cantidad de celdas con texto
        $bestHeaderRow = 1;
        $maxTextCells = 0;
        $bestBlockStarts = [1];
        
        for ($r = 1; $r <= min(10, $highestRow); $r++) {
            $textCells = 0;
            $hasKeyword = false;
            for ($c = 1; $c <= $highestCol; $c++) {
                $val = $grid[$r][$c];
                if (!empty($val)) {
                    $textCells++;
                    if (preg_match('/\b(CONCEPTO|MUNICIPIO|INSTITUCIÓN|INSTITUCION|PROGRAMA)\b/i', $val)) {
                        $hasKeyword = true;
                    }
                }
            }
            if ($hasKeyword) {
                $textCells += 100;
            }
            if ($textCells > $maxTextCells) {
                $maxTextCells = $textCells;
                $bestHeaderRow = $r;
            }
        }

        $inBlock = false;
        $bestBlockStarts = [];
        for ($c = 1; $c <= $highestCol; $c++) {
            $hasText = !empty($grid[$bestHeaderRow][$c]) || !empty($grid[$bestHeaderRow-1][$c]);
            if ($hasText) {
                if (!$inBlock) {
                    $bestBlockStarts[] = $c;
                    $inBlock = true;
                }
            } else {
                $inBlock = false;
            }
        }
        $blockStarts = $bestBlockStarts;
        $tables = [];
        $notasArr = [];
        $fuenteStr = '';

        // Determinar si realmente son tablas lado a lado
        // Si hay una columna vacía por formato (ej. M2-037), no debemos separarlo.
        // Un buen indicador de tablas separadas es si la palabra "CONCEPTO", "MUNICIPIO" o "INSTITUCIÓN" se repite.
        $headerRowString = strtoupper(implode(' ', $grid[$bestHeaderRow]));
        $isSideBySide = count($blockStarts) > 1 && (
            substr_count($headerRowString, 'CONCEPTO') > 1 || 
            substr_count($headerRowString, 'MUNICIPIO') > 1 || 
            substr_count($headerRowString, 'INSTITUCIÓN') > 1 ||
            substr_count($headerRowString, 'INSTITUCION') > 1
        );

        if ($isSideBySide) {
            // Es lado a lado
            foreach ($blockStarts as $idx => $startCol) {
                $endCol = isset($blockStarts[$idx + 1]) ? $blockStarts[$idx + 1] - 1 : $highestCol;
                
                $headerRow = $bestHeaderRow;
                
                // Buscar título arriba de los headers en cualquier columna del bloque
                $title = '';
                $yearMatch = '';
                for ($r = $headerRow - 1; $r >= 1; $r--) {
                    for ($c = $startCol; $c <= $endCol; $c++) {
                        if (!empty($grid[$r][$c])) {
                            $potentialTitle = $grid[$r][$c];
                            if (preg_match('/\b(20\d{2}-20\d{2}|20\d{2})\b/', $potentialTitle, $m)) {
                                $yearMatch = $m[1];
                                $title = preg_replace('/,?\s*julio\s+20\d{2}\s+a\s+junio\s+20\d{2}\.?/i', '', $potentialTitle);
                                break 2;
                            }
                            if (empty($title)) {
                                $title = $potentialTitle;
                            }
                        }
                    }
                }
                
                $title = trim($title, '., ');

                $headers = [];
                for ($c = $startCol; $c <= $endCol; $c++) {
                    $h1 = $grid[$headerRow - 1][$c] ?? '';
                    $h2 = $grid[$headerRow][$c] ?? '';
                    $h = trim("$h1 $h2");
                    if (!empty($h)) {
                        $headers[] = $h;
                    }
                }

                if (empty($headers)) {
                    continue;
                }

                $rows = [];
                for ($r = $headerRow + 1; $r <= $highestRow; $r++) {
                    $firstColVal = strtolower($grid[$r][$startCol]);
                    if (str_starts_with($firstColVal, 'nota')) {
                        $notasArr[] = $grid[$r][$startCol];
                        break; // Termina la tabla
                    }
                    if (str_starts_with($firstColVal, 'fuente') || str_starts_with($firstColVal, '*')) {
                        $fuenteStr = $grid[$r][$startCol];
                        break;
                    }

                    $isEmpty = true;
                    $rowCells = [];
                    for ($c = $startCol; $c < $startCol + count($headers); $c++) {
                        $val = $grid[$r][$c];
                        $rowCells[] = $val;
                        if (!empty($val)) $isEmpty = false;
                    }

                    if (!$isEmpty) {
                        if (empty(trim($rowCells[0])) && !empty($rows)) {
                            $prevRow = end($rows);
                            if (stripos(trim($prevRow[0]), 'total') === 0) {
                                break; // Ya pasamos el total, ignoramos sumatorias extra al final
                            }
                        }
                        $rows[] = $rowCells;
                    } elseif (empty($rows)) {
                        // Skip empty rows before table starts
                    } else {
                        // Hueco en la tabla? Continuamos por si acaso
                    }
                }

                if (count($rows) > 0) {
                    $tables[] = [
                        'year'    => $yearMatch ?: 'Tabla ' . ($idx + 1),
                        'title'   => $title,
                        'headers' => $headers,
                        'rows'    => $rows
                    ];
                } else {
                    if ($sheet->getTitle() === 'M2-038') echo "Table $idx has no rows!\n";
                }
            }
        } else {
            // Tabla única, top-down (ej. M2-001)
            $headerRow = $bestHeaderRow;
            
            // Buscar título arriba de los headers
            $title = 'Tabla Única';
            for ($r = $headerRow - 1; $r >= 1; $r--) {
                if (!empty($grid[$r][1])) {
                    $title = $grid[$r][1];
                    break;
                }
            }
            
            // Usar bestHeaderRow como la fila de cabeceras.
            while ($headerRow < $highestRow) {
                $hasMultipleHeaders = 0;
                for ($c = 1; $c <= $highestCol; $c++) {
                    if (!empty($grid[$headerRow][$c])) $hasMultipleHeaders++;
                }
                if ($hasMultipleHeaders >= 1) break; // Encontramos la cabecera real
                $headerRow++;
            }

            // Encontrar todas las filas de cabecera (incluyendo sub-cabeceras)
            $headerRows = [$headerRow];
            $nextRow = $headerRow + 1;
            while ($nextRow <= $highestRow && empty(trim($grid[$nextRow][1]))) {
                $hasText = false;
                for ($c = 2; $c <= $highestCol; $c++) {
                    if (!empty(trim($grid[$nextRow][$c]))) {
                        $hasText = true;
                        break;
                    }
                }
                if ($hasText) {
                    $headerRows[] = $nextRow;
                    $headerRow = $nextRow;
                } else {
                    break;
                }
                $nextRow++;
            }

            // Construir cabeceras combinando texto de todas las filas de cabecera
            $headers = [];
            $headerCols = [];
            for ($c = 1; $c <= $highestCol; $c++) {
                $hTexts = [];
                foreach ($headerRows as $hr) {
                    $val = trim($grid[$hr][$c] ?? '');
                    if (!empty($val)) {
                        $hTexts[] = $val;
                    }
                }
                $h = implode(' ', $hTexts);
                if (!empty($h)) {
                    $headers[] = $h;
                    $headerCols[] = $c;
                }
            }

            $rows = [];
            for ($r = $headerRow + 1; $r <= $highestRow; $r++) {
                $firstColVal = strtolower($grid[$r][1]);
                if (str_starts_with($firstColVal, 'nota')) {
                    $notasArr[] = $grid[$r][1];
                    continue;
                }
                if (str_starts_with($firstColVal, 'fuente') || str_starts_with($firstColVal, '*')) {
                    $fuenteStr = $grid[$r][1];
                    break;
                }

                $isEmpty = true;
                $rowCells = [];
                foreach ($headerCols as $c) {
                    $val = $grid[$r][$c];
                    $rowCells[] = $val;
                    if (!empty($val)) $isEmpty = false;
                }

                if (!$isEmpty) {
                    if (empty(trim($rowCells[0])) && !empty($rows)) {
                        $prevRow = end($rows);
                        if (stripos(trim($prevRow[0]), 'total') === 0) {
                            break; // Ya pasamos el total, ignoramos sumatorias extra al final
                        }
                    }
                    $rows[] = $rowCells;
                }
            }

            if (count($rows) > 0) {
                $tables[] = [
                    'year'    => 'Todos',
                    'title'   => $title,
                    'headers' => $headers,
                    'rows'    => $rows
                ];
            }
        }

        return [
            'tables' => count($tables) > 0 ? $tables : null,
            'notas'  => implode("\n", array_unique($notasArr)),
            'fuente' => $fuenteStr
        ];
    }
}
