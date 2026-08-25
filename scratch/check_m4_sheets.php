<?php
$baseDir = dirname(__DIR__);
require $baseDir.'/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

$filePath = $baseDir.'/Data_xls/Indicadores/anexo 4 (8 tablas) VF.xlsx';
$spreadsheet = IOFactory::load($filePath);

echo "M4-009 Exists? " . ($spreadsheet->sheetNameExists('M4-009') ? "Yes\n" : "No\n");
echo "M4-011 Exists? " . ($spreadsheet->sheetNameExists('M4-011') ? "Yes\n" : "No\n");
echo "M4-017 Exists? " . ($spreadsheet->sheetNameExists('M4-017') ? "Yes\n" : "No\n");

foreach (['M4-009', 'M4-017'] as $sheetName) {
    if ($spreadsheet->sheetNameExists($sheetName)) {
        $sheet = $spreadsheet->getSheetByName($sheetName);
        $highestRow = $sheet->getHighestDataRow();
        echo "\n--- $sheetName ---\n";
        for ($r = 1; $r <= min($highestRow, 30); $r++) {
            $row = [];
            for ($c = 1; $c <= 10; $c++) {
                $val = $sheet->getCell([$c, $r])->getCalculatedValue();
                $row[] = trim((string)$val);
            }
            $filtered = array_filter($row, fn($v) => $v !== null && $v !== '');
            if (!empty($filtered)) {
                echo json_encode($row) . "\n";
            }
        }
    }
}
