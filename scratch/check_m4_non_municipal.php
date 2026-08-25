<?php
$baseDir = dirname(__DIR__);
require $baseDir.'/vendor/autoload.php';

$app = require_once $baseDir.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$inds = \Illuminate\Support\Facades\DB::table('indicators')
    ->where('mision', 4)
    ->where('desglose_municipal', 0)
    ->get();

foreach ($inds as $ind) {
    echo "Indicator " . $ind->clave . " has desglose_municipal = 0\n";
    $data = json_decode($ind->metadata_dinamica, true);
    if (!empty($data)) {
        $keys = array_keys($data[0]);
        echo "  First key in JS: " . $keys[0] . "\n";
        echo "  First header in table: " . json_decode($ind->metadata_tabla, true)[0]['headers'][0] . "\n";
    }
}
