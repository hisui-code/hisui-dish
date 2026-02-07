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
        if (Schema::hasColumn('users', 'email')) {
            $this->ensureNoNullInColumn('email');
        }

        if (Schema::hasColumn('users', 'password')) {
            $this->ensureNoNullInColumn('password');
        }

        if (!Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role', 32)->default('user');
            });
        }

        if (Schema::hasColumn('users', 'email')) {
            DB::statement('ALTER TABLE users ALTER COLUMN email SET NOT NULL');
        }

        if (Schema::hasColumn('users', 'password')) {
            DB::statement('ALTER TABLE users ALTER COLUMN password SET NOT NULL');
        }

        if (Schema::hasColumn('users', 'email_verified_at') || Schema::hasColumn('users', 'remember_token')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'email_verified_at')) {
                    $table->dropColumn('email_verified_at');
                }

                if (Schema::hasColumn('users', 'remember_token')) {
                    $table->dropColumn('remember_token');
                }
            });
        }

        if (Schema::hasColumn('users', 'role') && !$this->hasCheckConstraint('users', 'users_role_check')) {
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user', 'guest'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if ($this->hasCheckConstraint('users', 'users_role_check')) {
            DB::statement('ALTER TABLE users DROP CONSTRAINT users_role_check');
        }

        if (Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }

        if (!Schema::hasColumn('users', 'email_verified_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('email_verified_at')->nullable();
            });
        }

        if (!Schema::hasColumn('users', 'remember_token')) {
            Schema::table('users', function (Blueprint $table) {
                $table->rememberToken();
            });
        }

        if (Schema::hasColumn('users', 'email')) {
            DB::statement('ALTER TABLE users ALTER COLUMN email DROP NOT NULL');
        }

        if (Schema::hasColumn('users', 'password')) {
            DB::statement('ALTER TABLE users ALTER COLUMN password DROP NOT NULL');
        }
    }

    /**
     * usersテーブル対象カラムにNULLが存在しないことを保証する
     * @param string $column チェック対象カラム名
     * @return void
     */
    private function ensureNoNullInColumn(string $column): void
    {
        // NULLを残したままNOT NULL制約を設定すると移行が失敗するため先に停止する
        $exists = DB::table('users')->whereNull($column)->exists();
        if (!$exists) {
            return;
        }

        throw new \RuntimeException('users.' . $column . ' にNULLが存在するため migration を中断');
    }

    /**
     * 指定テーブルにチェック制約が存在するか判定する
     * @param string $table テーブル名
     * @param string $constraint 制約名
     * @return bool 制約が存在する場合はtrue
     */
    private function hasCheckConstraint(string $table, string $constraint): bool
    {
        $row = DB::table('information_schema.table_constraints')
            ->select('constraint_name')
            ->where('table_schema', 'public')
            ->where('table_name', $table)
            ->where('constraint_name', $constraint)
            ->where('constraint_type', 'CHECK')
            ->first();

        return $row !== null;
    }
};
