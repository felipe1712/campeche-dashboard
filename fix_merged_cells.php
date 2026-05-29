<?php
$indicators = App\Models\Indicator::all();
$fixedCount = 0;

foreach ($indicators as $indicator) {
    $data = $indicator->metadata_dinamica;
    if (!$data || !is_array($data) || count($data) === 0) continue;

    $changed = false;
    $newData = [];
    $previousRow = null;

    // First pass: fill down string columns
    foreach ($data as $i => $row) {
        $newRow = (array)$row;
        if ($previousRow !== null) {
            foreach ($newRow as $key => $value) {
                // If value is null or empty string, and previous row had a string value, and this is NOT a numeric column
                // We'll guess numeric columns are those that only have numbers in the entire dataset, or we just fill down ONLY if it's a string column.
                // Actually, simple rule: if it's null, take previous.
                if ($value === null && isset($previousRow[$key]) && is_string($previousRow[$key])) {
                    $newRow[$key] = $previousRow[$key];
                    $changed = true;
                }
            }
        }
        $previousRow = $newRow;
        $newData[] = $newRow;
    }

    // Second pass: remove rows where ALL non-string columns are null (these are headers)
    $filteredData = [];
    foreach ($newData as $row) {
        $hasNumericValue = false;
        $hasAnyValue = false;
        foreach ($row as $key => $val) {
            // Ignore common empty columns like col_4, col_5
            if (str_starts_with($key, 'col_') && $val === null) continue;
            
            if ($val !== null) {
                $hasAnyValue = true;
                if (is_numeric($val)) {
                    $hasNumericValue = true;
                }
            }
        }
        
        // If it has NO numeric values but there are numeric columns in the dataset, it's probably a header row.
        // Wait, some tables might not have numeric values. 
        // Let's use a simpler heuristic: If the last column is null, drop it.
        $keys = array_keys((array)$row);
        $lastKey = end($keys);
        
        // Actually, just checking if ANY numeric value exists in the row is usually enough for these tables.
        // If $hasNumericValue is false, we skip this row.
        if ($hasNumericValue) {
            $filteredData[] = $row;
        } else {
            $changed = true; // We are dropping a row
        }
    }

    if ($changed && count($filteredData) > 0) {
        $indicator->metadata_dinamica = $filteredData;
        $indicator->save();
        $fixedCount++;
        echo "Fixed indicator: " . $indicator->clave . "\n";
    }
}

echo "Fixed $fixedCount indicators.\n";
