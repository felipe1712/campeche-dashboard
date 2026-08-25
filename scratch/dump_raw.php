<?php
$baseDir = dirname(__DIR__);
require $baseDir.'/vendor/autoload.php';

$app = require_once $baseDir.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$ind = \Illuminate\Support\Facades\DB::table('indicators')
    ->where('clave', 'M4-014')
    ->first();

if ($ind) {
    echo $ind->metadata_dinamica;
}
