<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Models\Tema;
use App\Models\Subtema;
use Illuminate\Support\Facades\DB;

class CatalogController extends Controller
{
    public function index()
    {
        $temas = Tema::with('subtemas')->orderBy('año', 'desc')->get();
        return Inertia::render('Catalog/Index', [
            'temas' => $temas
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls|max:5120',
            'year' => 'required|integer',
        ]);

        try {
            $spreadsheet = IOFactory::load($request->file('file')->getRealPath());
            // Tomamos la primera hoja del Excel del catálogo
            $sheet = $spreadsheet->getActiveSheet();
            
            $highestRow = $sheet->getHighestRow();
            $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($sheet->getHighestColumn());

            $headers = [];
            for ($col = 1; $col <= $highestColumnIndex; $col++) {
                $headers[$col] = strtolower(trim((string)$sheet->getCell([$col, 1])->getCalculatedValue()));
            }

            $colTema = array_search('tema', $headers);
            $colSubtema = array_search('subtema', $headers);

            if (!$colTema) {
                return redirect()->back()->with('error', 'El archivo debe contener una columna llamada "Tema".');
            }

            DB::transaction(function () use ($sheet, $highestRow, $colTema, $colSubtema, $request) {
                for ($row = 2; $row <= $highestRow; $row++) {
                    $temaStr = trim((string)$sheet->getCell([$colTema, $row])->getCalculatedValue());
                    $subtemaStr = $colSubtema ? trim((string)$sheet->getCell([$colSubtema, $row])->getCalculatedValue()) : null;

                    if ($temaStr) {
                        $tema = Tema::firstOrCreate([
                            'año' => $request->year,
                            'nombre' => $temaStr,
                        ]);

                        if ($subtemaStr) {
                            Subtema::firstOrCreate([
                                'tema_id' => $tema->id,
                                'nombre' => $subtemaStr,
                            ]);
                        }
                    }
                }
            });

            return redirect()->back()->with('success', 'Catálogo importado correctamente.');

        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error procesando el archivo: ' . $e->getMessage());
        }
    }
}
