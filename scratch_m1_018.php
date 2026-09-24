<?php
    private function parseM1_018($rawGrid, $highestRow, $highestColIndex, $year, $mision, $clave, $meta)
    {
        $metadata_dinamica = [];
        $metadata_tabla = [];
        $fuente = null;
        $currentYear = '2023';
        
        $r = 1;
        while ($r <= $highestRow) {
            $val1 = trim($rawGrid[$r][1] ?? '');
            
            if (str_starts_with(strtolower($val1), 'fuente:')) {
                $fuente = $val1;
            }
            
            if (preg_match('/\b(20\d{2})\b/', $val1, $m)) {
                $currentYear = $m[1];
            }
            
            if (strtoupper($val1) === 'PODER Y/U ORGANISMO') {
                $tableRows = [];
                $tableTotal = 0;
                
                $r++; // move to data
                while ($r <= $highestRow) {
                    $rowVal1 = trim($rawGrid[$r][1] ?? '');
                    $rowVal2 = trim($rawGrid[$r][2] ?? '');
                    
                    if ($rowVal1 === '' && $rowVal2 === '') {
                        $r++; continue;
                    }
                    
                    if (str_starts_with(strtolower($rowVal1), 'fuente:') || preg_match('/\b(20\d{2})\b/', $rowVal1) || strtoupper($rowVal1) === 'PODER Y/U ORGANISMO') {
                        $r--; break;
                    }
                    
                    $valNum = str_replace(',', '', $rowVal2);
                    $tableRows[] = [$rowVal1, is_numeric($valNum) ? (float)$valNum : $rowVal2];
                    
                    if (str_starts_with(strtoupper($rowVal1), 'TOTAL')) {
                        $tableTotal = is_numeric($valNum) ? (float)$valNum : 0;
                        break;
                    }
                    
                    $r++;
                }
                
                $metadata_dinamica[] = [
                    'Ao' => $currentYear,
                    'PETICIONES' => $tableTotal
                ];
                
                $metadata_tabla[] = [
                    'year' => $currentYear,
                    'headers' => ['PODER Y/U ORGANISMO', 'PETICIONES'],
                    'rows' => $tableRows
                ];
                
                $currentYear = (string)((int)$currentYear + 1);
            }
            $r++;
        }
        
        return [
            'clave'            => $clave,
            'ao'              => $year,
            'mision'           => $mision,
            'metadata_dinamica'=> $metadata_dinamica,
            'metadata_tabla'   => $metadata_tabla,
            'notas'            => '',
            'fuente'           => $fuente,
            'titulo'           => $meta['titulo'],
            'dependencia'      => $meta['dependencia'],
            'tema_nombre'      => $meta['tema'],
            'subtema_nombre'   => $meta['subtema'],
            'tipo_grafica'     => 'bar'
        ];
    }
?>
