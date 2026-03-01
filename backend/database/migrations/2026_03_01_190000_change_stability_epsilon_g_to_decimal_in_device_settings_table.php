<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('device_settings') || !Schema::hasColumn('device_settings', 'stability_epsilon_g')) {
            return;
        }

        // stability_epsilon_g は 0.2 のような小数を保存したいので decimal へ変更する
        DB::statement("
            ALTER TABLE device_settings
            ALTER COLUMN stability_epsilon_g TYPE NUMERIC(6,3)
            USING stability_epsilon_g::numeric
        ");
    }

    public function down(): void
    {
        if (!Schema::hasTable('device_settings') || !Schema::hasColumn('device_settings', 'stability_epsilon_g')) {
            return;
        }

        // 差し戻し時は四捨五入して整数へ戻す
        DB::statement("
            ALTER TABLE device_settings
            ALTER COLUMN stability_epsilon_g TYPE INTEGER
            USING ROUND(stability_epsilon_g)::integer
        ");
    }
};
