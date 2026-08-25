<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use PhpOffice\PhpSpreadsheet\IOFactory;

$filePath = __DIR__.'/Data_xls/Indicadores/anexo 4 (8 tablas) VF.xlsx';
$spreadsheet = IOFactory::load($filePath);

$testSheets = ['M4-050', 'M4-051']; 
foreach ($testSheets as $s) {
    echo "\n--- $s ---\n";
    $sheet = $spreadsheet->getSheetByName($s);
    if (!$sheet) {
        echo "Sheet $s not found.\n";
        continue;
    }
    foreach ($sheet->getRowIterator(1, 25) as $row) {
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
}
