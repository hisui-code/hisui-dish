<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * @description
 * Seeder のエントリポイント
 */
class DatabaseSeeder extends Seeder
{
    /**
     * @description
     * アプリのシードを実行する
     *
     * @return void
     */
    public function run(): void
    {
        $this->call([
            HisuiDishSeeder::class,
        ]);
    }
}