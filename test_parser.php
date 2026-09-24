<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $p = new App\Services\StrategicExcelParserService();
    $res = $p->parseFile('Data_xls/Indicadores/anexo 1 (8 tablas) VF.xlsx', '2023', '1');
    echo 'SUCCESS: ' . count($res) . ' indicators parsed.';
} catch (\Exception $e) {
    echo 'ERROR: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine();
}
