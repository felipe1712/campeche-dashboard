<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$record = App\Models\Indicator::where('clave', 'M3-089')->first();
echo json_encode($record->toArray(), JSON_PRETTY_PRINT);
