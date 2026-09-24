<?php
$c = file_get_contents('app/Services/StrategicExcelParserService.php');
// Replace ISO-8859-1 'ñ' (\xf1) with UTF-8 'ñ' (\xc3\xb1) ONLY in the keys
// Or simply replace the entire string using hex
$c = preg_replace("/'A\xf1o'/", "'A\xc3\xb1o'", $c);
$c = preg_replace("/'a\xf1o'/", "'a\xc3\xb1o'", $c);

file_put_contents('app/Services/StrategicExcelParserService.php', $c);
echo "Done\n";
