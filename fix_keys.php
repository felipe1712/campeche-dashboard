<?php
$c = file_get_contents('app/Services/StrategicExcelParserService.php');
$c = str_replace("'A\xef\xbf\xbdo' => \$currentYear,", "'Año' => \$currentYear,", $c);
$c = str_replace("'a\xef\xbf\xbdo'              => \$year,", "'año'              => \$year,", $c);

// Also try raw replacement if my terminal encoded it differently
$c = str_replace("'Ao' => \$currentYear,", "'Año' => \$currentYear,", $c);
$c = str_replace("'ao'              => \$year,", "'año'              => \$year,", $c);

file_put_contents('app/Services/StrategicExcelParserService.php', $c);
echo "Done\n";
