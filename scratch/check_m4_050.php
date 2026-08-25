<?php
$baseDir = dirname(__DIR__);
require $baseDir.'/vendor/autoload.php';

$app = require_once $baseDir.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$parser = app(\App\Services\MissionFourExcelParserService::class);
$spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load('C:\Users\DELL\Desktop\Campeche\Data_xls\Indicadores\anexo 4 (8 tablas) VF.xlsx');

$sheet = $spreadsheet->getSheetByName('M4-050');
if (!$sheet) {
    echo "Sheet M4-050 not found\n";
    exit;
}

$reflection = new \ReflectionClass(\App\Services\MissionFourExcelParserService::class);
$method = $reflection->getMethod('parseDetailSheetForYear');
$method->setAccessible(true);

$sheetData = $method->invoke($parser, $sheet, '2025', 'M4-050');
print_r($sheetData['tables'] ?? []);
