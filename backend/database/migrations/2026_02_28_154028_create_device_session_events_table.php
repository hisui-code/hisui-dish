<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_session_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('session_id')->unique();
            $table->uuid('device_id');
            $table->string('event', 64);
            $table->decimal('eaten_grams', 8, 2);
            $table->timestampTz('recorded_at');
            $table->json('raw_payload')->nullable();
            $table->timestampsTz();

            $table->foreign('device_id')
                ->references('id')
                ->on('devices')
                ->cascadeOnDelete();

            $table->index(['device_id', 'recorded_at']);
            $table->index(['event', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_session_events');
    }
};
