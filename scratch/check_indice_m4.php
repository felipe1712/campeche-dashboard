<?php
$baseDir = dirname(__DIR__);
require $baseDir.'/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

$filePath = $baseDir.'/Data_xls/Indicadores/anexo 4 (8 tablas) VF.xlsx';
$spreadsheet = IOFactory::load($filePath);
$sheet = $spreadsheet->getSheetByName('INDICE');

$highestRow = $sheet->getHighestDataRow();
$highestCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($sheet->getHighestDataColumn());

for ($r = 1; $r <= $highestRow; $r++) {
    $row = [];
    for ($c = 1; $c <= $highestCol; $c++) {
        $val = $sheet->getCell([$c, $r])->getCalculatedValue();
        $row[] = trim((string)$val);
    }
    // Check if the row contains M4-009, M4-011, or M4-017
    $joined = implode(' ', $row);
    if (strpos($joined, 'M4-009') !== false || strpos($joined, 'M4-011') !== false || strpos($joined, 'M4-017') !== false) {
        echo json_encode($row) . "\n";
    }
}
