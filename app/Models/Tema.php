<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tema extends Model
{
    use HasFactory;

    protected $fillable = ['año', 'nombre'];

    public function subtemas()
    {
        return $this->hasMany(Subtema::class);
    }

    public function indicators()
    {
        return $this->hasMany(Indicator::class);
    }
}
