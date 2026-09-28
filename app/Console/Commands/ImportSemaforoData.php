<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Models\Indicator;

class ImportSemaforoData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'indicadores:semaforizar {path}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Importa la semaforizacion de los indicadores desde un archivo Excel';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $path = $this->argument('path');

        if (!file_exists($path)) {
            $this->error("El archivo no existe: {$path}");
            return 1;
        }

        $this->info("Cargando archivo Excel...");
        
        try {
            $spreadsheet = IOFactory::load($path);
        } catch (\Exception $e) {
            $this->error("Error al leer el archivo Excel: " . $e->getMessage());
            return 1;
        }

        $updatedCount = 0;
        $notFoundCount = 0;

        foreach ($spreadsheet->getSheetNames() as $sheetName) {
            $this->info("Procesando hoja: {$sheetName}");
            $sheet = $spreadsheet->getSheetByName($sheetName);
            
            $highestRow = $sheet->getHighestRow();
            
            // Fila 2 contiene la regla, ej: Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable
            $ruleDescription = $sheet->getCell('A2')->getValue();
            if (!$ruleDescription) {
                $ruleDescription = "Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable";
            }

            // A partir de la fila 5 están los datos (Fila 4 son encabezados)
            for ($row = 5; $row <= $highestRow; $row++) {
                $codigo = $sheet->getCell('A' . $row)->getValue();
                
                if (empty($codigo)) {
                    continue;
                }

                $semaforoColor = $sheet->getCell('I' . $row)->getValue();
                $porcentajeAvance = $sheet->getCell('H' . $row)->getValue();
                
                // Si el porcentaje es numérico, formatearlo como porcentaje
                if (is_numeric($porcentajeAvance)) {
                    $porcentajeAvance = round($porcentajeAvance * 100, 2);
                }

                $indicator = Indicator::where('clave', trim($codigo))->first();

                if ($indicator) {
                    $metadata = [
                        'color' => trim($semaforoColor),
                        'porcentaje_variacion' => $porcentajeAvance,
                        'descripcion_regla' => trim($ruleDescription)
                    ];
                    
                    $indicator->metadata_semaforo = $metadata;
                    $indicator->save();
                    
                    $this->line("Actualizado: {$codigo} -> {$semaforoColor} ({$porcentajeAvance}%)");
                    $updatedCount++;
                } else {
                    $notFoundCount++;
                }
            }
        }

        $this->info("¡Proceso completado!");
        $this->info("Indicadores actualizados: {$updatedCount}");
        $this->info("Indicadores omitidos (no encontrados en BD): {$notFoundCount}");

        return 0;
    }
}
