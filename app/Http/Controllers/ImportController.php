<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\ExcelParserService;
use App\Models\Indicator;
use App\Models\Tema;
use App\Models\Subtema;
use Illuminate\Support\Facades\DB;

class ImportController extends Controller
{
    public function index()
    {
        return Inertia::render('Import/Index');
    }

    public function store(Request $request, ExcelParserService $parser)
    {
        $request->validate([
            'file'   => 'required|mimes:xlsx,xls|max:10240',
            'year'   => 'required|integer',
            'mision' => 'required|string',
        ]);

        try {
            $results = $parser->parseFile(
                $request->file('file')->getRealPath(),
                $request->year,
                $request->mision
            );

            DB::transaction(function () use ($results) {
                foreach ($results as $result) {

                    // ── Crear / recuperar Tema ─────────────────────────────────
                    $temaId = null;
                    if (!empty($result['tema_nombre']) && $result['tema_nombre'] !== 'Sin Tema') {
                        $tema = Tema::firstOrCreate([
                            'año'    => $result['año'],
                            'nombre' => trim($result['tema_nombre']),
                        ]);
                        $temaId = $tema->id;
                    }

                    // ── Crear / recuperar Subtema ──────────────────────────────
                    $subtemaId = null;
                    if ($temaId && !empty($result['subtema_nombre']) && $result['subtema_nombre'] !== 'Sin Subtema') {
                        $subtema = Subtema::firstOrCreate([
                            'tema_id' => $temaId,
                            'nombre'  => trim($result['subtema_nombre']),
                        ]);
                        $subtemaId = $subtema->id;
                    }

                    // ── Crear / actualizar Indicador ───────────────────────────
                    Indicator::updateOrCreate(
                        [
                            'clave' => $result['clave'],
                            'año'   => $result['año'],
                        ],
                        [
                            'mision'           => $result['mision'],
                            'tema_id'          => $temaId,
                            'subtema_id'       => $subtemaId,
                            'metadata_dinamica'=> $result['metadata_dinamica'],
                            'notas'            => $result['notas'],
                            'fuente'           => $result['fuente'],
                            'titulo'           => $result['titulo'],
                            'dependencia'      => $result['dependencia'],
                            'desglose_municipal' => $result['desglose_municipal'],
                        ]
                    );
                }
            });

            return redirect()->back()->with(
                'success',
                'Archivo procesado correctamente. ' . count($results) . ' indicadores guardados.'
            );

        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error al procesar el archivo: ' . $e->getMessage());
        }
    }
}
