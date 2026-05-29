<?php
$indicator = App\Models\Indicator::where('clave', 'M1-001')->first();
if ($indicator) {
    $data = $indicator->metadata_dinamica;
    $newData = [];
    
    $mapping = [
        'TARJETONES' => 'CONDUCTOR CERTIFICADO (NUEVO INGRESO)',
        'col_6' => 'CONDUCTOR CERTIFICADO (RENOVACIÓN)',
        'col_7' => 'CONDUCTOR CERTIFICADO (RESELLO)',
        'BENEFICIARIOS' => 'TARJETONES (BENEFICIARIOS)',
        'col_10' => 'PRÓRROGA DE CONCESIONES'
    ];
    
    foreach ($data as $row) {
        $row = (array)$row;
        $newRow = [];
        
        foreach ($row as $key => $val) {
            // Drop spacer columns
            if ($key === 'col_8' || $key === 'col_11') {
                continue;
            }
            
            // Rename keys according to mapping
            if (array_key_exists($key, $mapping)) {
                $newRow[$mapping[$key]] = $val;
            } else {
                $newRow[$key] = $val;
            }
        }
        
        $newData[] = $newRow;
    }
    
    $indicator->metadata_dinamica = $newData;
    $indicator->save();
    echo "Fixed keys for M1-001!\n";
} else {
    echo "Indicator M1-001 not found.\n";
}
