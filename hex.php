<?php
$c = file_get_contents('app/Services/StrategicExcelParserService.php');
// Search for PETICIONES and look behind it
$pos = strpos($c, 'PETICIONES');
$sub = substr($c, $pos - 50, 50);
echo bin2hex($sub) . "\n";
echo $sub . "\n";
