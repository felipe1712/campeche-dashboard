<?php
$baseDir = dirname(__DIR__);
require $baseDir.'/vendor/autoload.php';

$app = require_once $baseDir.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$count = \Illuminate\Support\Facades\DB::table('indicators')->where('mision', 4)->count();
echo "Total M4 indicators: " . $count . "\n";

$countMun = \Illuminate\Support\Facades\DB::table('indicators')->where('mision', 4)->where('desglose_municipal', 1)->count();
echo "Total M4 indicators with desglose_municipal = 1: " . $countMun . "\n";

$inds = \Illuminate\Support\Facades\DB::table('indicators')
    ->where('mision', 4)
    ->where('desglose_municipal', 1)
    ->get();

foreach ($inds as $ind) {
    echo "Processing " . $ind->clave . "\n";
    $data = json_decode($ind->metadata_dinamica, true);
    if (!empty($data)) {
        $lastRow = end($data);
        $hasTotal = false;
        foreach ($lastRow as $k => $v) {
            if (is_string($v) && preg_match('/^(TOTAL|ESTADO|TOTAL ESTATAL)$/i', trim($v))) {
                $hasTotal = true;
                break;
            }
        }
        echo "Indicator " . $ind->clave . " has total: " . ($hasTotal ? "YES" : "NO") . "\n";
    }
}
