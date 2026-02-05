<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            !Schema::hasColumn('users', 'auth_token') &&
            !Schema::hasColumn('users', 'password_digest')
        ) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'auth_token')) {
                $table->dropColumn('auth_token');
            }
            if (Schema::hasColumn('users', 'password_digest')) {
                $table->dropColumn('password_digest');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'password_digest')) {
                $table->string('password_digest')->nullable();
            }
            if (!Schema::hasColumn('users', 'auth_token')) {
                $table->string('auth_token')->nullable();
            }
        });
    }
};
