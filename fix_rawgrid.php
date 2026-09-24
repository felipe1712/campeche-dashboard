<?php
$c = file_get_contents('app/Services/StrategicExcelParserService.php');
$search1 = "            if (\$clave === 'M1-018') {\n                \$results[] = \$this->parseM1_018(\$rawGrid, \$highestRow, \$highestColumnIndex, \$year, \$mision, \$clave, \$metadataMap[\$clave]);\n                continue;\n            }\n";
// Sometimes the line endings are CRLF, sometimes LF
$c = preg_replace('/\s*if \(\$clave === \'M1-018\'\) \{.*?\s*continue;\s*\}/s', '', $c);

$search2 = "            for (\$row = 1; \$row <= \$highestRow; \$row++) {\n                \$rawGrid[\$row] = [];\n                for (\$col = 1; \$col <= \$highestColumnIndex; \$col++) {\n                    \$rawGrid[\$row][\$col] = trim((string)\$sheet->getCell([\$col, \$row])->getCalculatedValue());\n                }\n            }";

$c = str_replace($search2, $search2 . "\n\n            if (\$clave === 'M1-018') {\n                \$results[] = \$this->parseM1_018(\$rawGrid, \$highestRow, \$highestColumnIndex, \$year, \$mision, \$clave, \$metadataMap[\$clave]);\n                continue;\n            }", $c);

// Also try CRLF for search2
$search2_crlf = "            for (\$row = 1; \$row <= \$highestRow; \$row++) {\r\n                \$rawGrid[\$row] = [];\r\n                for (\$col = 1; \$col <= \$highestColumnIndex; \$col++) {\r\n                    \$rawGrid[\$row][\$col] = trim((string)\$sheet->getCell([\$col, \$row])->getCalculatedValue());\r\n                }\r\n            }";
$c = str_replace($search2_crlf, $search2_crlf . "\r\n\r\n            if (\$clave === 'M1-018') {\r\n                \$results[] = \$this->parseM1_018(\$rawGrid, \$highestRow, \$highestColumnIndex, \$year, \$mision, \$clave, \$metadataMap[\$clave]);\r\n                continue;\r\n            }", $c);

file_put_contents('app/Services/StrategicExcelParserService.php', $c);
echo "Done\n";
