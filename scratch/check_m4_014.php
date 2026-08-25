<?php
$baseDir = dirname(__DIR__);
require $baseDir.'/vendor/autoload.php';

$app = require_once $baseDir.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$parser = app(\App\Services\MissionFourExcelParserService::class);
// load M4 excel
$spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load('C:\Users\DELL\Desktop\Campeche\Data_xls\Indicadores\anexo 4 (8 tablas) VF.xlsx');
$sheet = $spreadsheet->getSheetByName('M4-014');

$reflection = new \ReflectionClass(\App\Services\MissionFourExcelParserService::class);
$method = $reflection->getMethod('parseDetailSheetForYear');
$method->setAccessible(true);
$sheetData = $method->invoke($parser, $sheet, 'General', 'M4-014');
echo "Number of tables found: " . count($sheetData['tables']) . "\n";
foreach ($sheetData['tables'] as $idx => $table) {
    echo "Table $idx:\n";
    echo "Headers: " . implode(", ", $table['headers']) . "\n";
    echo "Rows: " . count($table['rows']) . "\n";
}
