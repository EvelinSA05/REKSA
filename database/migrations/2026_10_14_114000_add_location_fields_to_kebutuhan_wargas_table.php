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
        Schema::table('kebutuhan_wargas', function (Blueprint $table) {
            $table->string('desa')->nullable()->after('foto_bukti');
            $table->string('kecamatan')->nullable()->after('desa');
            $table->string('kabupaten')->nullable()->after('kecamatan');
            $table->string('provinsi')->nullable()->after('kabupaten');
            $table->decimal('latitude', 10, 7)->nullable()->after('provinsi');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kebutuhan_wargas', function (Blueprint $table) {
            $table->dropColumn(['desa', 'kecamatan', 'kabupaten', 'provinsi', 'latitude', 'longitude']);
        });
    }
};
