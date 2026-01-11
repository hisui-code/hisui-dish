<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_settings', function (Blueprint $table) {
            $table->uuid('device_id')->primary();

            $table->integer('stable_duration_sec')->nullable();
            $table->integer('max_session_sec')->nullable();

            $table->integer('sampling_hz')->nullable();
            $table->integer('moving_avg_window')->nullable();
            $table->integer('gross_weight_limit_g')->nullable();

            $table->integer('lock_version')->default(0);

            $table->timestampsTz();

            $table->foreign('device_id')->references('id')->on('devices')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_settings');
    }
};