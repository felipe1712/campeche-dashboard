<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Indicator;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function index()
    {
        // Get unique years and missions for the dropdowns
        $años = Indicator::where('is_estrella', true)->select('año')->distinct()->orderBy('año', 'desc')->pluck('año');
        $misiones = Indicator::where('is_estrella', true)->select('mision')->distinct()->orderBy('mision')->pluck('mision');
        
        $indicators = Indicator::select('id', 'clave', 'titulo', 'mision', 'año')
            ->where('is_estrella', true)
            ->orderBy('clave')
            ->get();

        return Inertia::render('Admin/Exportaciones', [
            'años' => $años,
            'misiones' => $misiones,
            'indicatorsList' => $indicators
        ]);
    }

    public function getData(Request $request)
    {
        $id = $request->input('id');
        if ($id === 'all' || !$id) {
            $mision = $request->input('mision');
            $año = $request->input('año');
            
            $query = Indicator::with(['tema', 'subtema'])->where('is_estrella', true);
            if ($mision && $mision !== 'Todas') {
                $query->where('mision', $mision);
            }
            if ($año && $año !== 'Todos') {
                $query->where('año', $año);
            }
            $indicators = $query->orderBy('clave')->get();
            return response()->json($indicators);
        }
        $indicator = Indicator::with(['tema', 'subtema'])->find($id);
        return response()->json($indicator);
    }

    public function exportExcel(Request $request)
    {
        $mision = $request->input('mision');
        $año = $request->input('año');
        $indicatorId = $request->input('indicator_id'); // 'all' or specific ID

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        if ($indicatorId && $indicatorId !== 'all') {
            $indicator = Indicator::find($indicatorId);
            if (!$indicator) {
                return abort(404, 'Indicador no encontrado');
            }

            $sheet->setTitle('Exportación');
            
            // Metadata
            $sheet->setCellValue('A1', 'Misión:');
            $sheet->setCellValue('B1', $indicator->mision);
            $sheet->setCellValue('A2', 'Año:');
            $sheet->setCellValue('B2', $indicator->año);
            $sheet->setCellValue('A3', 'Clave:');
            $sheet->setCellValue('B3', $indicator->clave);
            $sheet->setCellValue('A4', 'Título:');
            $sheet->setCellValue('B4', $indicator->titulo);
            $sheet->setCellValue('A5', 'Fuente:');
            $sheet->setCellValue('B5', $indicator->fuente);

            $currentRow = 7;

            // Header
            $headers = $indicator->metadata_tabla[0]['headers'] ?? [];
            if (empty($headers)) {
                if (!empty($indicator->metadata_dinamica) && is_array($indicator->metadata_dinamica) && count($indicator->metadata_dinamica) > 0) {
                    $dinamica = $indicator->metadata_dinamica;
                    $first = is_array($dinamica) ? reset($dinamica) : null;
                    if (is_array($first)) {
                        $headers = array_keys($first);
                    }
                }
            }

            if (!empty($headers)) {
                $col = 'A';
                foreach ($headers as $header) {
                    $sheet->setCellValue($col . $currentRow, $header);
                    $col++;
                }
                $currentRow++;
                
                // Data
                if (!empty($indicator->metadata_dinamica) && is_array($indicator->metadata_dinamica)) {
                    if (isset($indicator->metadata_dinamica[0]) && is_array($indicator->metadata_dinamica[0])) {
                        foreach ($indicator->metadata_dinamica as $row) {
                            $col = 'A';
                            foreach ($headers as $header) {
                                $val = $row[$header] ?? '';
                                $sheet->setCellValue($col . $currentRow, $val);
                                $col++;
                            }
                            $currentRow++;
                        }
                    } else {
                        foreach ($indicator->metadata_dinamica as $year => $yearData) {
                            if (isset($yearData['tabla']) && is_array($yearData['tabla'])) {
                                $sheet->setCellValue('A' . $currentRow, 'Año: ' . $year);
                                $currentRow++;
                                foreach ($yearData['tabla'] as $rowArray) {
                                    $col = 'A';
                                    if (is_array($rowArray)) {
                                        foreach ($rowArray as $cell) {
                                            $sheet->setCellValue($col . $currentRow, $cell);
                                            $col++;
                                        }
                                        $currentRow++;
                                    }
                                }
                                $currentRow++;
                            }
                        }
                    }
                }
            } else {
                $sheet->setCellValue('A' . $currentRow, 'No hay datos estructurados disponibles para este indicador.');
            }

            $filename = 'Exportacion_' . $indicator->clave . '_' . date('Ymd_His') . '.xlsx';
            
        } else {
            // EXPORT ALL
            $query = Indicator::query()->where('is_estrella', true);
            if ($mision && $mision !== 'Todas') {
                $query->where('mision', $mision);
            }
            if ($año && $año !== 'Todos') {
                $query->where('año', $año);
            }
            
            $indicators = $query->orderBy('clave')->get();
            $sheet->setTitle('Consolidado');
            
            $currentRow = 1;
            foreach ($indicators as $ind) {
                // Metadata
                $sheet->setCellValue('A' . $currentRow, 'Misión:');
                $sheet->setCellValue('B' . $currentRow, $ind->mision);
                $currentRow++;
                $sheet->setCellValue('A' . $currentRow, 'Año:');
                $sheet->setCellValue('B' . $currentRow, $ind->año);
                $currentRow++;
                $sheet->setCellValue('A' . $currentRow, 'Clave:');
                $sheet->setCellValue('B' . $currentRow, $ind->clave);
                $currentRow++;
                $sheet->setCellValue('A' . $currentRow, 'Título:');
                $sheet->setCellValue('B' . $currentRow, $ind->titulo);
                $currentRow++;
                $sheet->setCellValue('A' . $currentRow, 'Fuente:');
                $sheet->setCellValue('B' . $currentRow, $ind->fuente);
                $currentRow += 2;

                // Tablas
                if (!empty($ind->metadata_tabla) && is_array($ind->metadata_tabla)) {
                    foreach ($ind->metadata_tabla as $tablaData) {
                        if (isset($tablaData['year'])) {
                            $sheet->setCellValue('A' . $currentRow, 'Año/Periodo: ' . $tablaData['year']);
                            $currentRow++;
                        }
                        
                        // Headers
                        $headers = $tablaData['headers'] ?? [];
                        if (!empty($headers)) {
                            $col = 'A';
                            foreach ($headers as $header) {
                                $sheet->setCellValue($col . $currentRow, $header);
                                $col++;
                            }
                            $currentRow++;
                        }
                        
                        // Rows
                        $rows = $tablaData['rows'] ?? [];
                        if (!empty($rows)) {
                            foreach ($rows as $rowArray) {
                                $col = 'A';
                                if (is_array($rowArray)) {
                                    foreach ($rowArray as $cell) {
                                        $sheet->setCellValue($col . $currentRow, $cell);
                                        $col++;
                                    }
                                    $currentRow++;
                                }
                            }
                        }
                        $currentRow++; // Espacio entre tablas del mismo indicador
                    }
                } elseif (!empty($ind->metadata_dinamica) && is_array($ind->metadata_dinamica)) {
                    // Fallback to metadata_dinamica (for standard simple tables)
                    $dinamica = $ind->metadata_dinamica;
                    $first = reset($dinamica);
                    $headers = is_array($first) ? array_keys($first) : [];
                    
                    if (!empty($headers)) {
                        $col = 'A';
                        foreach ($headers as $header) {
                            $sheet->setCellValue($col . $currentRow, $header);
                            $col++;
                        }
                        $currentRow++;
                        
                        foreach ($ind->metadata_dinamica as $row) {
                            $col = 'A';
                            if (is_array($row)) {
                                foreach ($headers as $header) {
                                    $val = $row[$header] ?? '';
                                    $sheet->setCellValue($col . $currentRow, $val);
                                    $col++;
                                }
                                $currentRow++;
                            }
                        }
                    } else {
                        $sheet->setCellValue('A' . $currentRow, 'No hay datos tabulares estructurados.');
                        $currentRow++;
                    }
                } else {
                    $sheet->setCellValue('A' . $currentRow, 'No hay datos tabulares estructurados.');
                    $currentRow++;
                }

                $currentRow += 3; // Espacio gigante entre indicadores
            }
            
            $filename = 'Exportacion_Global_' . date('Ymd_His') . '.xlsx';
        }

        $writer = new Xlsx($spreadsheet);
        
        $response = new StreamedResponse(function() use ($writer) {
            $writer->save('php://output');
        });
        
        $response->headers->set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $response->headers->set('Content-Disposition', 'attachment;filename="'.$filename.'"');
        $response->headers->set('Cache-Control', 'max-age=0');
        
        return $response;
    }
}
