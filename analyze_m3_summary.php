<?php
$json = json_decode(file_get_contents('m3_structure.json'), true);
$output = "";
foreach ($json as $sheet => $rows) {
    if (strpos(strtolower($sheet), 'ndice') !== false) continue;
    $output .= "=== $sheet ===\n";
    foreach ($rows as $idx => $row) {
        $non_empty = [];
        if (!is_array($row)) continue;
        foreach ($row as $col => $val) {
            if ($val !== null && trim((string)$val) !== '') {
                $non_empty[] = "$col: " . trim(preg_replace('/\s+/', ' ', $val));
            }
        }
        if (!empty($non_empty)) {
            $output .= "Row $idx: " . implode(" | ", $non_empty) . "\n";
        }
    }
    $output .= "\n";
}
file_put_contents('m3_summary.txt', $output);
echo "Done.";
