<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bowl_snapshots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('device_id');

            $table->integer('weight_g');

            // recorded_at は timestamptz（UTCで保存する前提）
            $table->timestampTz('recorded_at');

            $table->timestampsTz();

            $table->foreign('device_id')->references('id')->on('devices')->cascadeOnDelete();

            // dashboard集計で効く（期間検索 + デバイス絞り）
            $table->index(['device_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bowl_snapshots');
    }
};