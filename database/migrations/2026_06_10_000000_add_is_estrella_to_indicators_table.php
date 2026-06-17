<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('indicators', function (Blueprint $table) {
            if (!Schema::hasColumn('indicators', 'is_estrella')) {
                $table->boolean('is_estrella')->default(false)->after('desglose_municipal');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('indicators', function (Blueprint $table) {
            if (Schema::hasColumn('indicators', 'is_estrella')) {
                $table->dropColumn('is_estrella');
            }
        });
    }
};
