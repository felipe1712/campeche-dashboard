<?php
$indicator = App\Models\Indicator::find(46); // M1-004 year 2025
if ($indicator) {
    $data = $indicator->metadata_dinamica;
    $newData = [];
    foreach ($data as $row) {
        $row = (array)$row;
        
        // Check if the weird key exists
        $weirdKey = "Junta Local de Conciliación y Arbitraje y Juntas Especiales";
        
        if (array_key_exists($weirdKey, $row)) {
            $val = $row[$weirdKey];
            
            // Rename key to ORGANISMO
            unset($row[$weirdKey]);
            
            // If it's null, it's the Junta Local
            if ($val === null) {
                $row['ORGANISMO'] = $weirdKey;
            } else {
                $row['ORGANISMO'] = $val;
            }
        }
        
        // Also trim all string values to fix duplicate categories
        foreach ($row as $k => $v) {
            if (is_string($v)) {
                $row[$k] = trim($v);
            }
        }
        
        $newData[] = $row;
    }
    
    $indicator->metadata_dinamica = $newData;
    $indicator->save();
    echo "Fixed M1-004 (ID: 46)\n";
}

// Let's also trim all strings in all indicators just to be safe, so we don't have this issue again for other indicators.
$indicators = App\Models\Indicator::all();
$trimmedCount = 0;
foreach ($indicators as $ind) {
    $data = $ind->metadata_dinamica;
    if (!$data || !is_array($data)) continue;
    
    $changed = false;
    $newData = [];
    foreach ($data as $row) {
        $r = (array)$row;
        foreach ($r as $k => $v) {
            if (is_string($v)) {
                $trimmed = trim($v);
                if ($trimmed !== $v) {
                    $r[$k] = $trimmed;
                    $changed = true;
                }
            }
        }
        $newData[] = $r;
    }
    
    if ($changed) {
        $ind->metadata_dinamica = $newData;
        $ind->save();
        $trimmedCount++;
    }
}
echo "Trimmed string values in $trimmedCount indicators.\n";
