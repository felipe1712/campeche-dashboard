<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$data = [
    ["ORGANISMO","2021","2022","2023","2024","2025","Notas"],
    ["INFONAVIT","105","76","69","81","104",""],
    ["CODESVI","0","0","0","0","0",""],
    ["FOVISSSTE","53","47","35","35","20",""],
    ["BANCA","350","185","100","109","69",""],
    ["CONAVI","286","180","1","54","837",""],
    ["BANJERCITO","0","1","1","0","0",""],
    ["TOTALES","794","489","206","279","1030",""]
];

App\Models\Indicator::where('clave', 'M3-065')->update(['metadata_dinamica' => $data]);
echo "Done!\n";
