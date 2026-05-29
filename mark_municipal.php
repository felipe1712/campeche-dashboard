<?php
$indicators = App\Models\Indicator::all();
$count = 0;
foreach($indicators as $i) {
    if(isset($i->metadata_dinamica[0])) {
        $keys = array_keys($i->metadata_dinamica[0]);
        if(count($keys) > 0 && strtolower(trim($keys[0])) === 'municipio') {
            $i->desglose_municipal = true;
            $i->save();
            echo "Marcado como municipal: " . $i->clave . "\n";
            $count++;
        }
    }
}
echo "Total marcados: " . $count . "\n";
