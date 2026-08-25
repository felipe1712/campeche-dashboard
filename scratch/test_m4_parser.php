<?php
$baseDir = dirname(__DIR__);
require $baseDir.'/vendor/autoload.php';

$app = require_once $baseDir.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$parser = app(\App\Services\MissionFourExcelParserService::class);
$file = new \Illuminate\Http\UploadedFile('C:\\Users\\DELL\\Desktop\\Campeche\\Data_xls\\Indicadores\\anexo 4 (8 tablas) VF.xlsx', 'anexo 4 (8 tablas) VF.xlsx', null, null, true);

try {
    $results = $parser->parseFile($file, 2025, 'M4');
    foreach ($results as $res) {
        if ($res['clave'] === 'M4-014') {
            echo json_encode($res['metadata_dinamica'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
