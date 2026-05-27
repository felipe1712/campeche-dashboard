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
        Schema::create('indicators', function (Blueprint $table) {
            $table->id();
            $table->integer('año')->index();
            $table->string('clave')->index();
            $table->string('titulo');
            $table->string('dependencia');
            $table->string('mision')->nullable()->index();
            
            $table->foreignId('tema_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('subtema_id')->nullable()->constrained()->onDelete('set null');
            
            $table->json('metadata_dinamica');
            $table->text('fuente')->nullable();
            $table->text('notas')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('indicators');
    }
};
