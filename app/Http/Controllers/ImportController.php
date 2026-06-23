<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\ExcelParserService;
use App\Services\StrategicExcelParserService;
use App\Services\MissionTwoExcelParserService;
use App\Services\MissionThreeExcelParserService;
use App\Services\MissionFourExcelParserService;
use App\Services\MissionFiveExcelParserService;
use App\Models\Indicator;
use App\Models\Tema;
use App\Models\Subtema;
use Illuminate\Support\Facades\DB;

class ImportController extends Controller
{
    protected $excelParser;
    protected $strategicParser;
    protected $missionTwoParser;
    protected $missionThreeParser;
    protected $missionFourParser;
    protected $missionFiveParser;

    public function __construct(
        ExcelParserService $excelParser, 
        StrategicExcelParserService $strategicParser,
        MissionTwoExcelParserService $missionTwoParser,
        MissionThreeExcelParserService $missionThreeParser,
        MissionFourExcelParserService $missionFourParser,
        MissionFiveExcelParserService $missionFiveParser
    ) {
        $this->excelParser = $excelParser;
        $this->strategicParser = $strategicParser;
        $this->missionTwoParser = $missionTwoParser;
        $this->missionThreeParser = $missionThreeParser;
        $this->missionFourParser = $missionFourParser;
        $this->missionFiveParser = $missionFiveParser;
    }

    public function index()
    {
        $uploads = Indicator::select('mision', 'año', 'is_estrella', DB::raw('count(*) as count'), DB::raw('MAX(updated_at) as last_updated'))
            ->groupBy('mision', 'año', 'is_estrella')
            ->orderBy('last_updated', 'desc')
            ->get();

        return Inertia::render('Import/Index', [
            'uploads' => $uploads
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file'        => 'required|mimes:xlsx,xls|max:10240',
            'year'        => 'required|integer',
            'mision'      => 'required|string',
            'is_estrella' => 'nullable|boolean',
        ]);

        \Illuminate\Support\Facades\Log::info('Import Request Data: ', $request->all());

        try {
            $isEstrella = filter_var($request->input('is_estrella'), FILTER_VALIDATE_BOOLEAN);
            
            if ($isEstrella) {
                if ($request->mision == '2') {
                    $strategicParser = $this->missionTwoParser;
                } elseif ($request->mision == '3') {
                    $strategicParser = $this->missionThreeParser;
                } elseif ($request->mision == '4') {
                    $strategicParser = $this->missionFourParser;
                } elseif ($request->mision == '5') {
                    $strategicParser = $this->missionFiveParser;
                } else {
                    $strategicParser = $this->strategicParser;
                }
                $results = $strategicParser->parseFile(
                    $request->file('file')->getRealPath(),
                    $request->year,
                    $request->mision
                );
            } else {
                $results = $this->excelParser->parseFile(
                    $request->file('file')->getRealPath(),
                    $request->year,
                    $request->mision
                );
            }

            DB::transaction(function () use ($results, $request, $isEstrella) {
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
                            'metadata_dinamica'=> !empty($result['metadata_dinamica']) ? $result['metadata_dinamica'] : (!empty($result['metadata_tabla_global']) ? $result['metadata_tabla_global'] : []),
                            'metadata_tabla'   => !empty($result['metadata_tabla']) ? $result['metadata_tabla'] : null,
                            'notas'            => $result['notas'],
                            'fuente'           => $result['fuente'],
                            'titulo'             => $result['titulo'],
                            'dependencia'        => $result['dependencia'],
                            'desglose_municipal' => $result['desglose_municipal'],
                            'is_estrella'        => filter_var($request->input('is_estrella'), FILTER_VALIDATE_BOOLEAN),
                        ]
                    );
                }
            });

            return redirect()->back()->with(
                'success',
                'Archivo procesado correctamente. ' . count($results) . ' indicadores guardados.'
            );

        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Error al procesar el archivo: ' . $e->getMessage());
        }
    }

    public function destroyGroup(Request $request)
    {
        $request->validate([
            'mision' => 'required|string',
            'año' => 'required|integer',
            'is_estrella' => 'required|boolean',
        ]);

        Indicator::where('mision', $request->mision)
                 ->where('año', $request->año)
                 ->where('is_estrella', $request->is_estrella)
                 ->delete();

        return redirect()->back()->with('success', 'Grupo de indicadores eliminado correctamente.');
    }
}
