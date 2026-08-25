<?php
$baseDir = dirname(__DIR__);
require $baseDir.'/vendor/autoload.php';

use App\Services\MissionFourExcelParserService;

$parser = new MissionFourExcelParserService();
$filePath = $baseDir.'/Data_xls/Indicadores/anexo 4 (8 tablas) VF.xlsx';

$results = $parser->parseFile($filePath, 2025, '4');
foreach ($results as $res) {
    echo $res['clave'] . " - " . $res['titulo'] . "\n";
}
