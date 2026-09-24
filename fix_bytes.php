<?php
$c = file_get_contents('app/Services/StrategicExcelParserService.php');

$search1 = "'" . chr(0x41) . chr(0xf1) . chr(0x6f) . "'";
$c = str_replace($search1, "'Año'", $c);

$search2 = "'" . chr(0x61) . chr(0xf1) . chr(0x6f) . "'";
$c = str_replace($search2, "'año'", $c);

// Just in case it actually IS \xef\xbf\xbd now (since I might have saved it differently)
$search3 = "'A\xef\xbf\xbdo'";
$c = str_replace($search3, "'Año'", $c);

$search4 = "'a\xef\xbf\xbdo'";
$c = str_replace($search4, "'año'", $c);

file_put_contents('app/Services/StrategicExcelParserService.php', $c);
echo "Done\n";
