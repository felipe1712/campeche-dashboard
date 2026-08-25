<?php
require 'vendor/autoload.php';
$spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load('C:/Users/DELL/Desktop/Campeche/Data_xls/Indicadores/anexo 2 (8 tablas) VF.xlsx');
$sheet = $spreadsheet->getSheetByName('M2-038');
if (!$sheet) die("Sheet not found");
foreach ($sheet->getRowIterator() as $row) {
    $r = [];
    foreach ($row->getCellIterator() as $cell) {
        $r[] = $cell->getCalculatedValue() ?? '';
    }
    echo implode('|', $r) . "\n";
}
