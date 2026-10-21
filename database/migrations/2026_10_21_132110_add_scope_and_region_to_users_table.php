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
        Schema::table('users', function (Blueprint $table) {
            $table->string('scope')->default('daerah')->after('role'); // 'nasional' | 'daerah'
            $table->string('provinsi')->nullable()->after('scope'); // Nama provinsi yurisdiksi, e.g. 'Jawa Timur', 'Jawa Barat' (null jika nasional)
            $table->foreignId('posko_id')->nullable()->after('provinsi')->constrained('posko_wilayahs')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['posko_id']);
            $table->dropColumn(['scope', 'provinsi', 'posko_id']);
        });
    }
};
