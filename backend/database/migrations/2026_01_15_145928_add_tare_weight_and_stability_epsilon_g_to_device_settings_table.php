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
        if (!Schema::hasColumn('device_settings', 'tare_weight')) {
            Schema::table('device_settings', function (Blueprint $table) {
                $table->integer('tare_weight')->nullable();
            });
        }

        if (!Schema::hasColumn('device_settings', 'stability_epsilon_g')) {
            Schema::table('device_settings', function (Blueprint $table) {
                $table->integer('stability_epsilon_g')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('device_settings', 'stability_epsilon_g')) {
            Schema::table('device_settings', function (Blueprint $table) {
                $table->dropColumn('stability_epsilon_g');
            });
        }

        if (Schema::hasColumn('device_settings', 'tare_weight')) {
            Schema::table('device_settings', function (Blueprint $table) {
                $table->dropColumn('tare_weight');
            });
        }
    }
};
