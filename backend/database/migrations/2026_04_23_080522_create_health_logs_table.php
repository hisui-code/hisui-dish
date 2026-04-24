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
        Schema::create('health_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('device_id');

            $table->string('type');
            $table->timestampTz('occurred_at');

            $table->text('note')->nullable();
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->json('photos')->nullable();

            $table->timestampsTz();

            $table->foreign('device_id')->references('id')->on('devices')->cascadeOnDelete();
            $table->index(['device_id', 'occurred_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('health_logs');
    }
};
