<?php
require 'vendor/autoload.php';
$filePath = 'C:/Users/DELL/Desktop/Campeche/Data_xls/Indicadores/anexo 3 (8 tablas) VF.xlsx';

if (!file_exists($filePath)) {
    echo "File not found: " . $filePath . "\n";
    exit(1);
}

try {
    $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($filePath);
    $sheets = $spreadsheet->getSheetNames();
    $output = [];
    foreach ($sheets as $sheetName) {
        $sheet = $spreadsheet->getSheetByName($sheetName);
        $data = $sheet->toArray(null, true, true, true);
        $output[$sheetName] = array_slice($data, 0, 20); // Top 20 rows
    }
    file_put_contents('m3_structure.json', json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo "Done. Output saved to m3_structure.json\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
