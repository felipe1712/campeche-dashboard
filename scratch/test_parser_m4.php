<?php
require dirname(__DIR__).'/vendor/autoload.php';
$app = require_once dirname(__DIR__).'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$parser = new \App\Services\MissionFourExcelParserService();
$filePath = dirname(__DIR__).'/Data_xls/Indicadores/anexo 4 (8 tablas) VF.xlsx';

try {
    $results = $parser->parseFile($filePath, 2024, '4');
    echo "Parsed " . count($results) . " indicators successfully.\n";
    foreach ($results as $res) {
        if ($res['clave'] === 'M4-050' || $res['clave'] === 'M4-014') {
            echo "--- " . $res['clave'] . " ---\n";
            echo "Titulo: " . $res['titulo'] . "\n";
            echo "Dinamica length: " . count($res['metadata_dinamica']) . "\n";
            if ($res['metadata_tabla']) {
                echo "Tabla length: " . count($res['metadata_tabla']) . "\n";
                if (!empty($res['metadata_tabla'])) {
                    echo "Headers: " . implode(", ", $res['metadata_tabla'][0]['headers']) . "\n";
                }
            } else {
                echo "Tabla: null\n";
            }
        }
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
