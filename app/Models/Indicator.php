<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Indicator extends Model
{
    use HasFactory;

    protected $fillable = [
        'año',
        'clave',
        'titulo',
        'dependencia',
        'mision',
        'tema_id',
        'subtema_id',
        'metadata_dinamica',
        'metadata_tabla',
        'fuente',
        'notas',
        'desglose_municipal',
        'is_estrella'
    ];

    protected $casts = [
        'metadata_dinamica' => 'array',
        'metadata_tabla' => 'array',
    ];

    public function tema()
    {
        return $this->belongsTo(Tema::class);
    }

    public function subtema()
    {
        return $this->belongsTo(Subtema::class);
    }
}
