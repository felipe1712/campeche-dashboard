<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$filePath = 'C:/Users/DELL/Desktop/Campeche/Data_xls/Indicadores/anexo 3 (8 tablas) VF.xlsx';

$parser = app(App\Services\MissionThreeExcelParserService::class);
$results = $parser->parseFile($filePath, 2025, '3');

$output = [];
foreach ($results as $res) {
    if (in_array($res['clave'], ['M3-065', 'M3-068', 'M3-089', 'M3-095', 'M3-100', 'M3-104'])) {
        $output[$res['clave']] = [
            'meta' => $res['metadata_dinamica'],
            'global' => $res['metadata_tabla_global'],
        ];
    }
}
file_put_contents('test_m3_out.json', json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
echo "Done. Check test_m3_out.json";
