<?php

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$filePath = "C:/Users/DELL/.gemini/antigravity/brain/fe29fcde-9a8a-4173-a374-8f62342bcaf2/scratch/test_excel.xlsx"; // I need to know the actual path of the excel file.
