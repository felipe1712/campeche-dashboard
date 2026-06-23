<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Models\Indicator;

class MissionThreeExcelParserService
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
                \Illuminate\Support\Facades\Log::info("=== PROCESANDO HOJA ÍNDICE (M3): $sheetTitle ===");
                
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
                        elseif ($header === 'tema') $colSubtema = $colSubtema ?: $col; 
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
                                    'v2023'      => 0,
                                    'v2024'      => 0,
                                    'v2025'      => 0,
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

            $metadataDinamica = [];
            $desgloseMunicipal = false;
            $metadataTablaGlobal = null;

            $highestRow = min(500, $sheet->getHighestRow());
            $highestCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($sheet->getHighestColumn());
            $grid = [];
            for ($r = 1; $r <= $highestRow; $r++) {
                for ($c = 1; $c <= $highestCol; $c++) {
                    $grid[$r][$c] = trim((string)$sheet->getCell([$c, $r])->getCalculatedValue());
                }
            }

            $cleanText = function($text) {
                return trim(preg_replace('/\s+/', ' ', $text));
            };

            // Generic function to find the first cell containing a specific keyword
            $findCell = function($keyword) use ($grid, $highestRow, $highestCol) {
                for ($r = 1; $r <= $highestRow; $r++) {
                    for ($c = 1; $c <= $highestCol; $c++) {
                        if (stripos((string)$grid[$r][$c], $keyword) !== false) {
                            return ['r' => $r, 'c' => $c];
                        }
                    }
                }
                return null;
            };

            // Generic function to extract a table block given a starting header row and col
            $extractTable = function($startRow, $startCol, $numCols) use ($grid, $highestRow, $cleanText) {
                $table = [];
                $headers = [];
                $startCol = max(1, $startCol);
                for ($c = 0; $c < $numCols; $c++) {
                    $headers[] = $cleanText($grid[$startRow][$startCol + $c] ?? '');
                }
                $table[] = $headers;

                for ($r = $startRow + 1; $r <= $highestRow; $r++) {
                    $firstVal = strtolower($cleanText($grid[$r][$startCol] ?? ''));
                    if (str_starts_with($firstVal, 'nota') || str_starts_with($firstVal, 'fuente') || str_starts_with($firstVal, 'a/')) {
                        break;
                    }
                    if (empty($firstVal) && empty($cleanText($grid[$r][$startCol+1] ?? ''))) {
                        continue;
                    }
                    $rowCells = [];
                    for ($c = 0; $c < $numCols; $c++) {
                        $rowCells[] = $cleanText($grid[$r][$startCol + $c] ?? '');
                    }
                    if (count(array_filter($rowCells)) === 0) continue;
                    $table[] = $rowCells;
                }
                return $table;
            };

            // Switch on indicator clave
            if ($clave === 'M3-045') {
                $cells = [];
                for ($r = 1; $r <= $highestRow; $r++) {
                    for ($c = 1; $c <= $highestCol; $c++) {
                        if (stripos($grid[$r][$c], 'CARRERAS') !== false) {
                            $cells[] = ['r' => $r, 'c' => $c];
                        }
                    }
                }
                
                foreach ($cells as $cell) {
                    $rStart = $cell['r'];
                    $cStart = $cell['c'];
                    
                    // Look around for year
                    $yearStr = 'Ciclo';
                    for ($y = max(1, $rStart - 5); $y < $rStart + 2; $y++) {
                        for ($x = max(1, $cStart - 2); $x <= $cStart + 4; $x++) {
                            if (isset($grid[$y][$x]) && preg_match('/20\d{2}\s*[-_]\s*20\d{2}|20\d{2}\s*\/\s*20\d{2}/', $grid[$y][$x], $m)) {
                                $yearStr = $m[0];
                                break 2;
                            }
                        }
                    }
                    
                    $table = [];
                    $table[] = ['CARRERAS', 'ALUMNOS INSCRITOS', 'ALUMNOS EGRESADOS', 'ALUMNOS TITULADOS'];
                    for ($r = $rStart + 1; $r <= $highestRow; $r++) {
                        $first = strtolower($cleanText($grid[$r][$cStart]));
                        if (str_starts_with($first, 'nota') || str_starts_with($first, 'fuente') || str_starts_with($first, 'a/')) break;
                        if (empty($first) && empty($cleanText($grid[$r][$cStart+1]))) continue;
                        if ($first === 'carreras' || $first === 'alumnos') continue;
                        $table[] = [
                            $cleanText($grid[$r][$cStart]),
                            $cleanText($grid[$r][$cStart+1]),
                            $cleanText($grid[$r][$cStart+2]),
                            $cleanText($grid[$r][$cStart+3])
                        ];
                        if ($first === 'total' || $first === 'estado') {
                            break;
                        }
                    }
                    $metadataDinamica[$yearStr] = ['tabla' => $table];
                }

            } elseif ($clave === 'M3-058') {
                $desgloseMunicipal = true;
                // Dual table side-by-side
                // Left 2024: MUNICIPIO, LOCALIDADES, ESCUELAS, BENEFICIARIOS NIÑAS, BENEFICIARIOS NIÑOS
                $cells = [];
                for ($r = 1; $r <= $highestRow; $r++) {
                    for ($c = 1; $c <= $highestCol; $c++) {
                        if (strtoupper(trim($grid[$r][$c] ?? '')) === 'MUNICIPIO') {
                            $cells[] = ['r' => $r, 'c' => $c];
                        }
                    }
                }
                
                $process058Table = function($startR, $startC) use ($grid, $highestRow, $cleanText) {
                    $table = [];
                    $table[] = ['MUNICIPIO', 'LOCALIDADES', 'ESCUELAS', 'BENEFICIARIOS NIÑAS', 'BENEFICIARIOS NIÑOS'];
                    for ($r = $startR + 2; $r <= $highestRow; $r++) {
                        $first = strtolower($cleanText($grid[$r][$startC]));
                        if (str_starts_with($first, 'nota') || str_starts_with($first, 'fuente') || str_starts_with($first, 'a/')) break;
                        if (empty($first)) continue;
                        $table[] = [
                            $cleanText($grid[$r][$startC]),
                            $cleanText($grid[$r][$startC+1]),
                            $cleanText($grid[$r][$startC+2]),
                            $cleanText($grid[$r][$startC+3]),
                            $cleanText($grid[$r][$startC+4]),
                        ];
                    }
                    return $table;
                };

                foreach ($cells as $cell) {
                    $yearText = null;
                    for($yrRow = $cell['r'] - 1; $yrRow >= max(1, $cell['r'] - 3); $yrRow--) {
                        $txt = strtolower($cleanText($grid[$yrRow][$cell['c']] ?? '') . ' ' . $cleanText($grid[$yrRow][$cell['c']+1] ?? ''));
                        if (strpos($txt, '2023') !== false) $yearText = '2023';
                        elseif (strpos($txt, '2024') !== false) $yearText = '2024';
                        elseif (strpos($txt, '2025') !== false) $yearText = '2025';
                        if ($yearText) break;
                    }
                    
                    if (!$yearText) {
                        static $fallbackIdx058 = 0;
                        $fallbackYears = ['2024', '2025', '2023'];
                        $yearText = $fallbackYears[$fallbackIdx058 % 3];
                        $fallbackIdx058++;
                    }
                    
                    $metadataDinamica[$yearText] = ['tabla' => $process058Table($cell['r'], $cell['c'])];
                }

            } elseif ($clave === 'M3-065') {
                // Multi-year column table
                $pos = $findCell('ORGANISMO');
                if ($pos) {
                    $metadataTablaGlobal = $extractTable($pos['r'], $pos['c'], 6); // ORGANISMO, 2021, 2022, 2023, 2024, 2025
                }

            } elseif ($clave === 'M3-068') {
                // 2023, 2024 and 2025 left, middle, right or vertically stacked
                $cells = [];
                for ($r = 1; $r <= $highestRow; $r++) {
                    for ($c = 1; $c <= $highestCol; $c++) {
                        if (trim(strtoupper($grid[$r][$c])) === 'ORO') {
                            $cells[] = ['r' => $r, 'c' => $c];
                        }
                    }
                }

                $process068Table = function($startR, $oroC) use ($grid, $highestRow, $cleanText) {
                    $table = [];
                    $table[] = ['CATEGORIA', 'DEPORTE', 'ORO', 'PLATA', 'BRONCE', 'TOTAL'];
                    for ($r = $startR + 1; $r <= $highestRow; $r++) { // Data starts usually 1 or 2 rows after ORO
                        $cat = $cleanText($grid[$r][$oroC-2] ?? '');
                        $dep = $cleanText($grid[$r][$oroC-1] ?? '');
                        if (str_starts_with(strtolower($cat), 'nota') || str_starts_with(strtolower($cat), 'fuente') || str_starts_with(strtolower($dep), 'fuente')) break;
                        
                        $oro = $cleanText($grid[$r][$oroC] ?? '');
                        $plata = $cleanText($grid[$r][$oroC+1] ?? '');
                        $bronce = $cleanText($grid[$r][$oroC+2] ?? '');
                        
                        // Stop if we hit empty rows that have no categories and no numbers
                        if (empty($cat) && empty($dep) && empty($oro) && empty($plata) && empty($bronce)) continue;

                        $table[] = [
                            $cat,
                            $dep,
                            $oro,
                            $plata,
                            $bronce,
                            $cleanText($grid[$r][$oroC+3] ?? '')
                        ];
                        
                        $first = strtoupper($cat);
                        $second = strtoupper($dep);
                        if (str_contains($first, 'TOTAL') || str_contains($second, 'TOTAL')) {
                            break;
                        }
                    }
                    return $table;
                };

                // The tables are usually ordered by year. If there are 3, they correspond to 2023, 2024, 2025.
                $yearsMap = ['2023', '2024', '2025'];
                foreach ($cells as $index => $cell) {
                    if (isset($yearsMap[$index])) {
                        $metadataDinamica[$yearsMap[$index]] = ['tabla' => $process068Table($cell['r'], $cell['c'])];
                    }
                }

            } elseif ($clave === 'M3-089') {
                $desgloseMunicipal = true;
                $cells = [];
                for ($r = 1; $r <= $highestRow; $r++) {
                    for ($c = 1; $c <= $highestCol; $c++) {
                        if (strtoupper(trim($grid[$r][$c] ?? '')) === 'MUNICIPIO') {
                            $cells[] = ['r' => $r, 'c' => $c];
                        }
                    }
                }
                // The tables are ordered: 2024, 2023, 2025
                $yearsMap = ['2024', '2023', '2025'];
                foreach ($cells as $index => $cell) {
                    if (isset($yearsMap[$index])) {
                        $metadataDinamica[$yearsMap[$index]] = ['tabla' => $extractTable($cell['r'], $cell['c'], 4)];
                    }
                }

            } elseif ($clave === 'M3-095') {
                // Find occurrences of 'TEMAS'
                $cells = [];
                for ($r = 1; $r <= $highestRow; $r++) {
                    for ($c = 1; $c <= $highestCol; $c++) {
                        if (strtoupper(trim($grid[$r][$c] ?? '')) === 'TEMAS') {
                            $cells[] = ['r' => $r, 'c' => $c];
                        }
                    }
                }
                // Order: 2024, 2023, 2025... wait.
                // Looking at m3_summary.txt: 
                // Row 2: A=TEMAS (2024), H=TEMAS (2023)
                // Row 16: A=TEMAS (2025)
                foreach ($cells as $cell) {
                    // figure out year from row above or just assign heuristically based on position
                    $r = $cell['r'];
                    $c = $cell['c'];
                    $table = $extractTable($r, $c, 3); // TEMAS, ACCIONES, BENEFICIARIOS
                    
                    // We look at row above to find year
                    $yearText = '';
                    for($yrRow=$r-1; $yrRow>=max(1, $r-2); $yrRow--) {
                        $txt = strtolower($cleanText($grid[$yrRow][$c]) . ' ' . $cleanText($grid[$yrRow][1]));
                        if (strpos($txt, '2023') !== false) $yearText = '2023';
                        elseif (strpos($txt, '2024') !== false) $yearText = '2024';
                        elseif (strpos($txt, '2025') !== false) $yearText = '2025';
                        if ($yearText) break;
                    }
                    
                    if (!$yearText) {
                        // fallback based on position
                        if ($r < 10 && $c < 5) $yearText = '2024';
                        elseif ($r < 10 && $c > 5) $yearText = '2023';
                        else $yearText = '2025';
                    }
                    $metadataDinamica[$yearText] = ['tabla' => $table];
                }

            } elseif ($clave === 'M3-100') {
                $cells = [];
                for ($r = 1; $r <= $highestRow; $r++) {
                    for ($c = 1; $c <= $highestCol; $c++) {
                        $clean = strtoupper(preg_replace('/[^A-Z]/', '', $grid[$r][$c] ?? ''));
                        if ($clean === 'PROGRAMASCENTROS' || $clean === 'PROGRAMACENTRO') {
                            $cells[] = ['r' => $r, 'c' => $c];
                        }
                    }
                }
                
                // Sort geometrically: top-to-bottom, then left-to-right
                usort($cells, function($a, $b) {
                    if ($a['r'] === $b['r']) return $a['c'] <=> $b['c'];
                    return $a['r'] <=> $b['r'];
                });

                $fixedYears = ['2024', '2023', '2025']; // Top-Left, Top-Right, Bottom

                foreach ($cells as $index => $cell) {
                    $table = $extractTable($cell['r'], $cell['c'], 2);
                    $yearText = $fixedYears[$index] ?? '2025';
                    $metadataDinamica[$yearText] = ['tabla' => $table];
                }
            } elseif ($clave === 'M3-104') {
                $cells = [];
                for ($r = 1; $r <= $highestRow; $r++) {
                    for ($c = 1; $c <= $highestCol; $c++) {
                        $clean = strtoupper(preg_replace('/[^A-Z]/', '', $grid[$r][$c] ?? ''));
                        if ($clean === 'CONVENIOS') {
                            $cells[] = ['r' => $r, 'c' => $c];
                        }
                    }
                }
                
                // Sort geometrically: top-to-bottom, then left-to-right
                usort($cells, function($a, $b) {
                    if ($a['r'] === $b['r']) return $a['c'] <=> $b['c'];
                    return $a['r'] <=> $b['r'];
                });
                
                $process104Table = function($startR, $startC) use ($grid, $highestRow, $cleanText) {
                    $table = [];
                    $table[] = ['CONVENIOS', 'ESTATAL', 'FEDERAL', 'TOTAL'];
                    for ($r = $startR + 2; $r <= $highestRow; $r++) { 
                        $conv = $cleanText($grid[$r][$startC]);
                        if (str_starts_with(strtolower($conv), 'nota') || str_starts_with(strtolower($conv), 'fuente') || str_starts_with(strtolower($conv), 'a/')) break;
                        if (empty($conv)) continue;
                        $table[] = [
                            $conv,
                            $cleanText($grid[$r][$startC+1]),
                            $cleanText($grid[$r][$startC+2]),
                            $cleanText($grid[$r][$startC+3]),
                        ];
                    }
                    return $table;
                };

                $fixedYears104 = ['2024', '2023', '2025']; // Top-Left, Top-Right, Bottom

                foreach ($cells as $index => $cell) {
                    $table = $process104Table($cell['r'], $cell['c']);
                    $yearText = $fixedYears104[$index] ?? '2025';
                    $metadataDinamica[$yearText] = ['tabla' => $table];
                }
            }

            $results[] = [
                'clave' => $clave,
                'tema_nombre' => $meta['tema'],
                'subtema_nombre' => $meta['subtema'],
                'titulo' => $meta['titulo'],
                'dependencia' => $meta['dependencia'],
                'año' => $year,
                'mision' => $mision,
                'metadata_dinamica' => !empty($metadataDinamica) ? $metadataDinamica : null,
                'metadata_tabla_global' => $metadataTablaGlobal,
                'metadata_tabla' => null,
                'notas' => null,
                'fuente' => null,
                'desglose_municipal' => $desgloseMunicipal,
                'is_inversion' => false,
                'v2023' => $meta['v2023'],
                'v2024' => $meta['v2024'],
                'v2025' => $meta['v2025'],
            ];

            \Illuminate\Support\Facades\Log::info("M3 Parser completado para: $clave");
        }

        return $results;
    }
}
