<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('missions', function (Blueprint $table) {
            $table->id();
            $table->integer('numero')->unique();
            $table->string('nombre');
            $table->timestamps();
        });

        // Insert initial data
        DB::table('missions')->insert([
            ['numero' => 1, 'nombre' => 'Misión 1'],
            ['numero' => 2, 'nombre' => 'Misión 2'],
            ['numero' => 3, 'nombre' => 'Misión 3'],
            ['numero' => 4, 'nombre' => 'Misión 4'],
            ['numero' => 5, 'nombre' => 'Misión 5'],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('missions');
    }
};
