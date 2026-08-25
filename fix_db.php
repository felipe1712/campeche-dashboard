<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

foreach (\App\Models\Indicator::all() as $ind) {
    $changed = false;
    
    // Some of them might actually be arrays already in PHP space if cast correctly, 
    // but their underlying JSON string might be a stringified string.
    // Let's grab the raw attributes to check.
    $rawDinamica = $ind->getAttributes()['metadata_dinamica'] ?? null;
    $rawTabla = $ind->getAttributes()['metadata_tabla'] ?? null;
    
    if ($rawDinamica) {
        $decodedOnce = json_decode($rawDinamica, true);
        if (is_string($decodedOnce)) {
            // It was double encoded!
            $ind->metadata_dinamica = json_decode($decodedOnce, true);
            $changed = true;
        }
    }
    
    if ($rawTabla) {
        $decodedOnce = json_decode($rawTabla, true);
        if (is_string($decodedOnce)) {
            $ind->metadata_tabla = json_decode($decodedOnce, true);
            $changed = true;
        }
    }
    
    if ($changed) {
        $ind->save();
        echo "Fixed indicator {$ind->clave}\n";
    }
}
echo "Done.\n";
