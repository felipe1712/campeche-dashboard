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
                    $first = is_array($indicator->metadata_dinamica) ? reset($indicator->metadata_dinamica) : null;
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
            
            $headers = ['Misión', 'Año', 'Clave', 'Título', 'Dependencia', 'Es Estratégico', 'Fuente'];
            $col = 'A';
            foreach ($headers as $h) {
                $sheet->setCellValue($col . '1', $h);
                $col++;
            }
            
            $rowNum = 2;
            foreach ($indicators as $ind) {
                $sheet->setCellValue('A' . $rowNum, $ind->mision);
                $sheet->setCellValue('B' . $rowNum, $ind->año);
                $sheet->setCellValue('C' . $rowNum, $ind->clave);
                $sheet->setCellValue('D' . $rowNum, $ind->titulo);
                $sheet->setCellValue('E' . $rowNum, $ind->dependencia);
                $sheet->setCellValue('F' . $rowNum, $ind->is_estrella ? 'Sí' : 'No');
                $sheet->setCellValue('G' . $rowNum, $ind->fuente);
                $rowNum++;
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
