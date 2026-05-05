<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 健康記録と画像の関連を保存する health_log_photos テーブルを作成する
     */
    public function up(): void
    {
        Schema::create('health_log_photos', function (Blueprint $table) {
            $table->uuid('health_log_id');
            $table->uuid('photo_id');
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestampsTz();

            $table->primary(['health_log_id', 'photo_id']);

            $table->foreign('health_log_id')
                ->references('id')
                ->on('health_logs')
                ->cascadeOnDelete();

            $table->foreign('photo_id')
                ->references('id')
                ->on('photos')
                ->cascadeOnDelete();

            $table->index(['health_log_id', 'sort_order']);
        });
    }

    /**
     * health_log_photos テーブルを削除する
     */
    public function down(): void
    {
        Schema::dropIfExists('health_log_photos');
    }
};
