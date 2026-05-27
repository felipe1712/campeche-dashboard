<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subtema extends Model
{
    use HasFactory;

    protected $fillable = ['tema_id', 'nombre'];

    public function tema()
    {
        return $this->belongsTo(Tema::class);
    }

    public function indicators()
    {
        return $this->hasMany(Indicator::class);
    }
}
