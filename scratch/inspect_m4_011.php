<?php
$baseDir = dirname(__DIR__);
require $baseDir.'/vendor/autoload.php';
$app = require_once $baseDir.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use PhpOffice\PhpSpreadsheet\IOFactory;

$filePath = $baseDir.'/Data_xls/Indicadores/anexo 4 (8 tablas) VF.xlsx';
$spreadsheet = IOFactory::load($filePath);

$sheet = $spreadsheet->getSheetByName('M4-011');
if (!$sheet) {
    echo "Sheet M4-011 not found.\n";
    exit;
}
foreach ($sheet->getRowIterator(1, 30) as $row) {
    $cellIterator = $row->getCellIterator();
    $cellIterator->setIterateOnlyExistingCells(false);
    $rowData = [];
    foreach ($cellIterator as $cell) {
        $val = $cell->getCalculatedValue();
        $rowData[] = $val !== null ? trim($val) : null;
    }
    $filtered = array_filter($rowData, fn($v) => $v !== null && $v !== '');
    if (!empty($filtered)) {
        echo json_encode($rowData) . "\n";
    }
}
