<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'password_digest')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('password_digest')->nullable();
            });
        }

        if (!Schema::hasColumn('users', 'auth_token')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('auth_token')->nullable();
            });
        }

        if (Schema::hasColumn('users', 'password')) {
            DB::statement('ALTER TABLE users ALTER COLUMN password DROP NOT NULL');
        }

        if (Schema::hasColumn('users', 'name')) {
            DB::statement('ALTER TABLE users ALTER COLUMN name DROP NOT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('users', 'auth_token')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('auth_token');
            });
        }

        if (Schema::hasColumn('users', 'password_digest')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('password_digest');
            });
        }

        if (Schema::hasColumn('users', 'password')) {
            $hasNulls = DB::table('users')->whereNull('password')->exists();
            if (!$hasNulls) {
                DB::statement('ALTER TABLE users ALTER COLUMN password SET NOT NULL');
            }
        }

        if (Schema::hasColumn('users', 'name')) {
            $hasNulls = DB::table('users')->whereNull('name')->exists();
            if (!$hasNulls) {
                DB::statement('ALTER TABLE users ALTER COLUMN name SET NOT NULL');
            }
        }
    }
};
