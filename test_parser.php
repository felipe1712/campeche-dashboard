<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$filePath = 'C:/Users/DELL/Desktop/Campeche/Data_xls/Indicadores/anexo 2 (8 tablas) VF.xlsx';

$parser = new \App\Services\MissionTwoExcelParserService();
$result = $parser->parseFile($filePath, "2025", "2");

foreach ($result as $res) {
    \App\Models\Indicator::updateOrCreate(
        [
            'clave' => $res['clave'],
            'año' => $res['año']
        ],
        [
            'mision' => $res['mision'],
            'metadata_dinamica' => !empty($res['metadata_dinamica']) ? $res['metadata_dinamica'] : [],
            'metadata_tabla' => !empty($res['metadata_tabla']) ? $res['metadata_tabla'] : null,
            'fuente' => $res['fuente'] ?? '',
            'notas' => $res['notas'] ?? '',
            'titulo' => $res['titulo'] ?? '',
            'dependencia' => $res['dependencia'] ?? '',
            'tema_id' => null, // Simplified for test
            'subtema_id' => null, // Simplified for test
            'desglose_municipal' => $res['desglose_municipal'] ?? false,
            'is_estrella' => $res['is_estrella'] ?? true,
        ]
    );
}
echo "Imported " . count($result) . " indicators successfully to the database.\n";
