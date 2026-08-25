<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$ind = \App\Models\Indicator::where('clave', 'M3-089')->first();
if ($ind) {
    file_put_contents('out089.json', json_encode($ind->metadata_dinamica, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo "Saved to out089.json";
} else {
    echo "Not found";
}
