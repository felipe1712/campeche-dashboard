<?php
$baseDir = dirname(__DIR__);
require $baseDir.'/vendor/autoload.php';

$app = require_once $baseDir.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$ind = \Illuminate\Support\Facades\DB::table('indicators')->where('clave', 'M4-014')->first();
if ($ind) {
    echo "Clave: " . $ind->clave . "\n";
    echo "Desglose Municipal: " . $ind->desglose_municipal . "\n";
    
    $data = json_decode($ind->metadata_dinamica, true);
    if (!empty($data)) {
        echo "Total rows: " . count($data) . "\n";
        $lastRow = end($data);
        echo "Last row keys: " . implode(', ', array_keys($lastRow)) . "\n";
        echo "Last row values: " . implode(', ', array_values($lastRow)) . "\n";
    } else {
        echo "No data\n";
    }
} else {
    echo "Not found\n";
}
