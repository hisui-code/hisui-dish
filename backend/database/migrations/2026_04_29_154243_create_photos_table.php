<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 画像メタデータを保存する photos テーブルを作成する
     * 画像本体は DB に保存せず、disk と object_key で保存先を参照する
     */
    public function up(): void
    {
        Schema::create('photos', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('disk', 50);
            $table->string('object_key', 1024);
            $table->string('original_name');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('bytes');
            $table->string('visibility', 20)->default('private');
            $table->string('status', 20)->default('pending');

            $table->timestampsTz();

            $table->unique(['disk', 'object_key']);
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * photos テーブルを削除する
     */
    public function down(): void
    {
        Schema::dropIfExists('photos');
    }
};
