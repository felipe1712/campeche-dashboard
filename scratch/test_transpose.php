<?php
$baseDir = dirname(__DIR__);
require $baseDir.'/vendor/autoload.php';

$app = require_once $baseDir.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$parser = app(\App\Services\MissionFourExcelParserService::class);
$file = new \Illuminate\Http\UploadedFile('C:\\Users\\DELL\\Desktop\\Campeche\\Data_xls\\Indicadores\\anexo 4 (8 tablas) VF.xlsx', 'anexo 4 (8 tablas) VF.xlsx', null, null, true);

function isMunicipalHeaders($headers) {
    $municipios = ['calakmul', 'calkini', 'calkiní', 'campeche', 'candelaria', 'carmen', 'champoton', 'champotón', 'dzitbalche', 'dzitbalché', 'escarcega', 'escárcega', 'hecelchakan', 'hecelchakán', 'hopelchen', 'hopelchén', 'palizada', 'seybaplaya', 'tenabo'];
    $matchCount = 0;
    foreach ($headers as $header) {
        if (in_array(strtolower(trim($header)), $municipios)) {
            $matchCount++;
        }
    }
    return $matchCount >= 3; // If at least 3 municipalities are found in the headers
}

try {
    $sheetData = $parser->parseDetailSheetForYear(
        \PhpOffice\PhpSpreadsheet\IOFactory::load('C:\\Users\\DELL\\Desktop\\Campeche\\Data_xls\\Indicadores\\anexo 4 (8 tablas) VF.xlsx')->getSheetByName('Servicios turísticos de apoyo '),
        2025,
        'M4-049'
    );
    $table = $sheetData['tables'][0];
    $headers = $table['headers'];
    $rows = $table['rows'];

    echo "Original Headers:\n";
    print_r($headers);

    if (isMunicipalHeaders($headers)) {
        echo "Headers match municipalities! Transposing...\n";
        $newHeaders = ['MUNICIPIO'];
        foreach ($rows as $row) {
            $newHeaders[] = $row[0]; // The first column is the "action"
        }

        $newRows = [];
        // Start from index 1 to skip the first column which is now headers
        for ($colIdx = 1; $colIdx < count($headers); $colIdx++) {
            $newRow = [$headers[$colIdx]];
            foreach ($rows as $row) {
                $newRow[] = $row[$colIdx] ?? null;
            }
            $newRows[] = $newRow;
        }

        echo "New Headers:\n";
        print_r($newHeaders);
        echo "New Rows (first 2):\n";
        print_r(array_slice($newRows, 0, 2));
    }

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
