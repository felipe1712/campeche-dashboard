<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $data = [
        'M1-002' => ['color' => 'Amarillo', 'porcentaje_variacion' => 4.24, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M1-003' => ['color' => 'Verde', 'porcentaje_variacion' => 17.8, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M1-009' => ['color' => 'Amarillo', 'porcentaje_variacion' => 3.9, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M1-012' => ['color' => 'Verde', 'porcentaje_variacion' => 60, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M1-012b' => ['color' => 'Verde', 'porcentaje_variacion' => 119.42, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M1-013' => ['color' => 'Verde', 'porcentaje_variacion' => 36.21, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M1-013b' => ['color' => 'Verde', 'porcentaje_variacion' => 119.18, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M1-013c' => ['color' => 'Amarillo', 'porcentaje_variacion' => 3.4, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M1-018' => ['color' => 'Verde', 'porcentaje_variacion' => 24.83, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M1-025' => ['color' => 'Amarillo', 'porcentaje_variacion' => 0.46, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M1-027' => ['color' => 'Verde', 'porcentaje_variacion' => 29.55, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M1-027b' => ['color' => 'Verde', 'porcentaje_variacion' => 57.82, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M2-001' => ['color' => 'Verde', 'porcentaje_variacion' => 83.98, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M2-007' => ['color' => 'Verde', 'porcentaje_variacion' => 42.08, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M2-027' => ['color' => 'Verde', 'porcentaje_variacion' => 14.06, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M2-027b' => ['color' => 'Verde', 'porcentaje_variacion' => 10.88, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M2-037' => ['color' => 'Verde', 'porcentaje_variacion' => 131.02, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M2-038' => ['color' => 'Amarillo', 'porcentaje_variacion' => 4.86, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M2-039' => ['color' => 'Verde', 'porcentaje_variacion' => 5.26, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M2-041' => ['color' => 'Verde', 'porcentaje_variacion' => 69.47, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M2-043' => ['color' => 'Verde', 'porcentaje_variacion' => 33.48, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M2-046' => ['color' => 'Verde', 'porcentaje_variacion' => 16, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M3-045' => ['color' => 'Amarillo', 'porcentaje_variacion' => 4.26, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M3-058' => ['color' => 'Verde', 'porcentaje_variacion' => 50.45, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M3-065' => ['color' => 'Verde', 'porcentaje_variacion' => 269.18, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M3-068' => ['color' => 'Verde', 'porcentaje_variacion' => 6.12, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M3-089' => ['color' => 'Amarillo', 'porcentaje_variacion' => 0.07, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M3-095' => ['color' => 'Verde', 'porcentaje_variacion' => 24.76, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M3-100' => ['color' => 'Amarillo', 'porcentaje_variacion' => 4.88, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M3-104' => ['color' => 'Verde', 'porcentaje_variacion' => 25.52, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M4-014' => ['color' => 'Verde', 'porcentaje_variacion' => 14.11, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M4-015' => ['color' => 'Verde', 'porcentaje_variacion' => 61.88, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M4-020' => ['color' => 'Amarillo', 'porcentaje_variacion' => 2.23, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M4-022' => ['color' => 'Verde', 'porcentaje_variacion' => 17.65, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M4-049' => ['color' => 'Amarillo', 'porcentaje_variacion' => 3.5, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M4-050' => ['color' => 'Verde', 'porcentaje_variacion' => 42.96, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M4-051' => ['color' => 'Verde', 'porcentaje_variacion' => 106.09, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M4-058' => ['color' => 'Verde', 'porcentaje_variacion' => 19.31, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M5-007' => ['color' => 'Verde', 'porcentaje_variacion' => 36.73, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M5-009' => ['color' => 'Verde', 'porcentaje_variacion' => 35.33, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M5-012' => ['color' => 'Verde', 'porcentaje_variacion' => 15.18, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M5-015' => ['color' => 'Verde', 'porcentaje_variacion' => 116.53, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M5-017' => ['color' => 'Amarillo', 'porcentaje_variacion' => 4.49, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M5-020' => ['color' => 'Amarillo', 'porcentaje_variacion' => 0.28, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M5-023' => ['color' => 'Verde', 'porcentaje_variacion' => 77.83, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
        'M5-024' => ['color' => 'Verde', 'porcentaje_variacion' => 42.86, 'descripcion_regla' => 'Semáforo: Verde >= 5% crecimiento | Amarillo entre -5% y 5% | Rojo <= -5% | Gris sin dato comparable'],
    ];
        foreach ($data as $clave => $meta) {
            DB::table('indicators')->where('clave', $clave)->update(['metadata_semaforo' => json_encode($meta, JSON_UNESCAPED_UNICODE)]);
        }
    }

    public function down(): void
    {
        DB::table('indicators')->update(['metadata_semaforo' => null]);
    }
};
