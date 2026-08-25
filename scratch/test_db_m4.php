<?php
$baseDir = dirname(__DIR__);
require $baseDir.'/vendor/autoload.php';
$app = require_once $baseDir.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\MissionFourExcelParserService;
use App\Models\Indicator;
use App\Models\Tema;
use App\Models\Subtema;
use Illuminate\Support\Facades\DB;

$parser = new MissionFourExcelParserService();
$filePath = $baseDir.'/Data_xls/Indicadores/anexo 4 (8 tablas) VF.xlsx';

try {
    $results = $parser->parseFile($filePath, 2025, '4');
    
    DB::transaction(function () use ($results) {
        foreach ($results as $result) {
            $temaId = null;
            if (!empty($result['tema_nombre']) && $result['tema_nombre'] !== 'Sin Tema') {
                $tema = Tema::firstOrCreate([
                    'año'    => clone(date_create()), // fake
                    'nombre' => trim($result['tema_nombre']),
                ], ['año' => $result['año']]);
                $temaId = $tema->id;
            }

            $subtemaId = null;
            if ($temaId && !empty($result['subtema_nombre']) && $result['subtema_nombre'] !== 'Sin Subtema') {
                $subtema = Subtema::firstOrCreate([
                    'tema_id' => $temaId,
                    'nombre'  => trim($result['subtema_nombre']),
                ]);
                $subtemaId = $subtema->id;
            }

            Indicator::updateOrCreate(
                [
                    'clave' => $result['clave'],
                    'año'   => $result['año'],
                ],
                [
                    'mision'           => $result['mision'],
                    'tema_id'          => $temaId,
                    'subtema_id'       => $subtemaId,
                    'metadata_dinamica'=> !empty($result['metadata_dinamica']) ? $result['metadata_dinamica'] : [],
                    'metadata_tabla'   => !empty($result['metadata_tabla']) ? $result['metadata_tabla'] : null,
                    'notas'            => $result['notas'],
                    'fuente'           => $result['fuente'],
                    'titulo'             => $result['titulo'],
                    'dependencia'        => $result['dependencia'],
                    'desglose_municipal' => $result['desglose_municipal'],
                    'is_estrella'        => true,
                ]
            );
        }
    });

    echo "Saved " . count($results) . " indicators to DB successfully.\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
