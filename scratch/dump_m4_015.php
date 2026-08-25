<?php
$baseDir = dirname(__DIR__);
require $baseDir.'/vendor/autoload.php';

$app = require_once $baseDir.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$ind = \Illuminate\Support\Facades\DB::table('indicators')->where('clave', 'M4-015')->first();
if ($ind) {
    file_put_contents($baseDir.'/scratch/m4_015_data.json', $ind->metadata_dinamica);
    echo "Dumped M4-015\n";
} else {
    echo "Not found\n";
}
