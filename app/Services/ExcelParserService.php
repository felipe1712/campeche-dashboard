<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Models\Indicator;

class ExcelParserService
{
    /**
     * Parse the given Excel file path using Heuristic rules.
     */
    public function parseFile($filePath, $year, $mision)
    {
        $spreadsheet = IOFactory::load($filePath);
        $sheets = $spreadsheet->getAllSheets();

        $metadataMap = [];
        
        // 1. Buscar y procesar hoja de Índice primero
        foreach ($sheets as $sheet) {
            $sheetTitle = $sheet->getTitle();
            if (str_contains(strtolower($sheetTitle), 'ndice') || str_contains(mb_strtolower($sheetTitle, 'UTF-8'), 'ndice')) {
                \Illuminate\Support\Facades\Log::info("=== PROCESANDO HOJA ÍNDICE: $sheetTitle ===");
                
                $highestRow = min(200, $sheet->getHighestRow());
                $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($sheet->getHighestColumn());
                
                $headers = [];
                $headerRowIndex = -1;
                // Buscar la fila de cabeceras en las primeras 15 filas
                for ($row = 1; $row <= 15; $row++) {
                    $tempHeaders = [];
                    for ($col = 1; $col <= $highestColumnIndex; $col++) {
                        $val = trim((string)$sheet->getCell([$col, $row])->getCalculatedValue());
                        $tempHeaders[$col] = mb_strtolower($val, 'UTF-8');
                    }
                    if (array_search('clave', $tempHeaders) !== false || array_search('codigo', $tempHeaders) !== false || array_search('código', $tempHeaders) !== false || array_search('tema vinculado', $tempHeaders) !== false || array_search('tema', $tempHeaders) !== false) {
                        $headers = $tempHeaders;
                        $headerRowIndex = $row;
                        \Illuminate\Support\Facades\Log::info("Cabeceras encontradas en fila $row:", $headers);
                        break;
                    }
                }

                if ($headerRowIndex === -1) {
                    \Illuminate\Support\Facades\Log::info("NO SE ENCONTRARON CABECERAS en hoja: $sheetTitle");
                    continue; // No se encontraron cabeceras en esta hoja de índice
                }

                $colClave = false;
                $colTema = false;
                $colSubtema = false;
                $colTitulo = false;
                $colDependencia = false;

                foreach ($headers as $col => $header) {
                    if (str_contains($header, 'clave') || str_contains($header, 'codigo') || str_contains($header, 'código')) {
                        $colClave = $colClave ?: $col;
                    } elseif (str_contains($header, 'subtema')) {
                        $colSubtema = $colSubtema ?: $col;
                    } elseif (str_contains($header, 'tema')) {
                        $colTema = $colTema ?: $col;
                    } elseif (str_contains($header, 'título') || str_contains($header, 'titulo')) {
                        $colTitulo = $colTitulo ?: $col;
                    } elseif (str_contains($header, 'dependencia')) {
                        $colDependencia = $colDependencia ?: $col;
                    }
                }
                
                \Illuminate\Support\Facades\Log::info("Columnas mapeadas:", [
                    'clave' => $colClave,
                    'tema' => $colTema,
                    'subtema' => $colSubtema,
                    'titulo' => $colTitulo,
                    'dependencia' => $colDependencia,
                ]);

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

        \Illuminate\Support\Facades\Log::info("=== METADATA MAP FINAL ===", $metadataMap);
        $results = [];

        // 2. Procesar las hojas de datos
        foreach ($sheets as $sheet) {
            $sheetTitle = trim($sheet->getTitle());
            
            // Ignorar las hojas de índice
            if (str_contains(strtolower($sheetTitle), 'ndice') || str_contains(mb_strtolower($sheetTitle, 'UTF-8'), 'ndice')) {
                continue;
            }

            // A veces el título de la hoja tiene espacios extra o terminaciones, extraemos la clave (ej. M3-001)
            preg_match('/M\d-\d+/', $sheetTitle, $matches);
            $clave = $matches[0] ?? $sheetTitle;

            if (!isset($metadataMap[$clave])) {
                continue;
            }

            $highestRow = $sheet->getHighestRow();
            $highestColumn = $sheet->getHighestColumn();
            $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);

            $headerRowIndex = -1;
            $headerNames = [];

            // ── Detección de encabezados ─────────────────────────────────────────
            // Estrategia: encontrar la primera fila con valores numéricos (datos
            // reales) y usar la fila inmediatamente anterior como encabezado.
            // Esto maneja correctamente encabezados de 1, 2 o 3 niveles, p.ej.:
            //   Fila 1: CATEGORÍA | PARTICIPANTES        ← título de grupo (ignorado)
            //   Fila 2:           | NIÑAS    | NIÑOS     ← encabezado de columnas ✓
            //   Fila 3: Preescolar | 200     | 182       ← primer dato
            $firstDataRow = -1;
            for ($row = 1; $row <= min(25, $highestRow); $row++) {
                for ($col = 1; $col <= $highestColumnIndex; $col++) {
                    $val = $sheet->getCell([$col, $row])->getCalculatedValue();
                    $valStr = trim((string)$val);
                    if ($valStr !== '' && is_numeric($valStr)) {
                        $firstDataRow = $row;
                        break 2;
                    }
                }
            }

            // Sin datos numéricos o datos en la fila 1 sin espacio para encabezado
            if ($firstDataRow <= 1) {
                continue;
            }

            $headerRowIndex = $firstDataRow - 1;
            for ($col = 1; $col <= $highestColumnIndex; $col++) {
                $val = trim((string)$sheet->getCell([$col, $headerRowIndex])->getCalculatedValue());
                $headerNames[] = $val ?: 'col_' . $col;
            }

            // ── Augmentar nombres vacíos desde la fila de título superior ─────────
            // Si el encabezado real tiene celdas vacías (porque el nombre está en la
            // fila de grupo arriba, p.ej. "TOTAL", "AÑO"), los rescatamos desde
            // $headerRowIndex - 1 para no perder esos nombres en las series.
            if ($headerRowIndex > 1) {
                $titleRowIndex = $headerRowIndex - 1;
                for ($col = 1; $col <= count($headerNames); $col++) {
                    if (str_starts_with($headerNames[$col - 1], 'col_')) {
                        $titleVal = trim((string)$sheet->getCell([$col, $titleRowIndex])->getCalculatedValue());
                        if ($titleVal !== '') {
                            $headerNames[$col - 1] = $titleVal;
                        }
                    }
                }
            }

            $data = [];
            $notas = [];
            $fuente = null;

            // Extraer datos
            for ($row = $headerRowIndex + 1; $row <= $highestRow; $row++) {
                $firstCell = trim((string)$sheet->getCell([1, $row])->getCalculatedValue());
                $firstCellLower = strtolower($firstCell);

                // Only break on nota/fuente rows — TOTAL rows are now kept as data
                // so the frontend can render them as a footer strip
                if (
                    str_starts_with($firstCellLower, 'nota') || 
                    str_starts_with($firstCellLower, 'fuente')
                ) {
                    for ($r = $row; $r <= min($row + 15, $highestRow); $r++) {
                        $cellVal = trim((string)$sheet->getCell([1, $r])->getCalculatedValue());
                        if ($cellVal) {
                            if (stripos($cellVal, 'fuente') !== false) {
                                $fuente = $cellVal;
                            } else {
                                $notas[] = $cellVal;
                            }
                        }
                    }
                    break;
                }

                $rowData = [];
                $isEmptyRow = true;
                for ($col = 1; $col <= count($headerNames); $col++) {
                    $val = $sheet->getCell([$col, $row])->getCalculatedValue();
                    if ($val !== null && trim((string)$val) !== '') {
                        $isEmptyRow = false;
                    }
                    $headerKey = $headerNames[$col - 1];
                    $rowData[$headerKey] = $val;
                }

                if (!$isEmptyRow) {
                    $data[] = $rowData;
                }
            }

            // ── Fill-down: propagar celdas combinadas hacia las filas vacías ───
            // En Excel, una celda combinada solo guarda el valor en la primera fila.
            // Para tablas jerárquicas (Organismo → Acciones) necesitamos que cada
            // fila hija tenga el valor del grupo padre, p.ej.:
            //   ["Junta Local...", "", ""]    → ["Junta Local...", "Audiencias", 2314]
            //   ["",              "", ""]     → ["Junta Local...", "Convenios", 210]
            if (!empty($data) && count($headerNames) >= 1) {
                $firstKey = $headerNames[0];
                $lastGroupValue = null;
                foreach ($data as &$rowRef) {
                    $val = trim((string)($rowRef[$firstKey] ?? ''));
                    if ($val !== '') {
                        $lastGroupValue = $rowRef[$firstKey];
                    } elseif ($lastGroupValue !== null) {
                        $rowRef[$firstKey] = $lastGroupValue;
                    }
                }
                unset($rowRef);
            }
            $meta = $metadataMap[$clave];

            $desgloseMunicipal = false;
            if (count($headerNames) > 0 && strtolower(trim($headerNames[0])) === 'municipio') {
                $desgloseMunicipal = true;
                if (count($data) > 0) {
                    $lastRow = end($data);
                    $firstHeader = array_keys($data[0])[0];
                    $lastVal = strtolower(trim($lastRow[$firstHeader] ?? ''));
                    if (!in_array($lastVal, ['estado', 'total', 'total estatal'])) {
                        $sumRow = [$firstHeader => 'ESTADO'];
                        foreach ($data as $row) {
                            $municipioName = strtolower(trim($row[$firstHeader] ?? ''));
                            // Skip garbage summary rows that some tables append at the bottom
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
                        $data[] = $sumRow;
                    }
                }
            }

            $results[] = [
                'clave'            => $clave,
                'año'              => $year,
                'mision'           => $mision,
                'metadata_dinamica'=> $data,
                'notas'            => implode("\n", $notas),
                'fuente'           => $fuente,
                'titulo'           => $meta['titulo'],
                'dependencia'      => $meta['dependencia'],
                'tema_nombre'      => $meta['tema'],
                'subtema_nombre'   => $meta['subtema'],
                'desglose_municipal' => $desgloseMunicipal,
            ];
        }

        return $results;
    }
}
