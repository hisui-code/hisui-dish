<?php

namespace Database\Seeders;

use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * @description
 * HisuiDish の開発用シード
 *
 * - users: 管理ユーザーを ENV から 1件作成
 * - devices: DEVICE_ID を ENV から作成（なければ固定UUID）
 * - device_settings: テーブルが存在すれば、存在するカラムだけ初期化
 * - bowl_snapshots:
 *   - 過去2ヶ月 / 今月 / 先2ヶ月（合計5ヶ月）を対象に生成
 *   - 1日あたり 1〜3件
 *   - JSTの日時で生成し、DB保存はUTCへ変換して recorded_at に保存
 */
class HisuiDishSeeder extends Seeder
{
    /**
     * @description
     * シード実行
     *
     * @return void
     */
    public function run(): void
    {
        $this->log('🧪 Seeding users / devices / bowl_snapshots (past2, current, next2 months)...');

        DB::transaction(function () {
            $this->seedUser();
            $deviceId = $this->ensureDevice();
            $this->ensureDeviceSetting($deviceId);
            $this->seedBowlSnapshots($deviceId);
        });

        $this->log('✅ Done.');
    }

    /**
     * @description
     * メッセージ出力（artisan db:seed 実行時に見やすくする）
     *
     * @param string $message - 表示文字列
     * @return void
     */
    private function log(string $message): void
    {
        if ($this->command) {
            $this->command->info($message);
            return;
        }
        echo $message . PHP_EOL;
    }

    /**
     * @description
     * 管理ユーザーを ENV から 1件作成する
     *
     * - 既存 users は全削除して作り直す
     * - password は Hash::make で保存
     *
     * @return void
     */
    private function seedUser(): void
    {
        if (!Schema::hasTable('users')) {
            $this->log('⚠️ users table not found. skip users seeding.');
            return;
        }

        $email = (string) env('ADMIN_EMAIL', 'admin@example.com');
        $password = (string) env('ADMIN_PASSWORD', 'password');

        DB::table('users')->delete();

        $data = [
            'email' => $email,
            'password' => Hash::make($password),
        ];

        if (Schema::hasColumn('users', 'created_at')) {
            $data['created_at'] = now();
        }
        if (Schema::hasColumn('users', 'updated_at')) {
            $data['updated_at'] = now();
        }

        DB::table('users')->insert($data);

        $this->log('✅ users seeded.');
    }

    /**
     * @description
     * Device を1件作成/確保して device_id を返す
     *
     * - DEVICE_ID があればそれを使用
     * - なければ Rails版と同じ固定UUIDを使う
     * - code / name カラムが存在すれば入れる
     *
     * @return string device_id
     */
    private function ensureDevice(): string
    {
        if (!Schema::hasTable('devices')) {
            $this->log('⚠️ devices table not found. skip device seeding.');
            // ここで止めると bowl_snapshots を作れないので例外にする方が安全
            throw new \RuntimeException('devices table not found');
        }

        $deviceId = (string) (env('DEVICE_ID') ?: '70812440-1965-4193-934d-d21e078da956');

        $data = ['id' => $deviceId];

        if (Schema::hasColumn('devices', 'code')) {
            $data['code'] = 'hisuidish-rpi5';
        }
        if (Schema::hasColumn('devices', 'name')) {
            $data['name'] = 'HisuiDish Pi 1';
        }
        if (Schema::hasColumn('devices', 'created_at')) {
            $data['created_at'] = now();
        }
        if (Schema::hasColumn('devices', 'updated_at')) {
            $data['updated_at'] = now();
        }

        // updateOrInsert: idがあれば更新、なければ作成
        DB::table('devices')->updateOrInsert(
            ['id' => $deviceId],
            $data
        );

        $this->log("✅ device ensured: {$deviceId}");

        return $deviceId;
    }

    /**
     * @description
     * device_settings が存在する場合、device_id の設定行を確保する
     *
     * - テーブルがない場合はスキップ
     * - カラムがあるものだけ初期化する
     *
     * @param string $deviceId - devices.id
     * @return void
     */
    private function ensureDeviceSetting(string $deviceId): void
    {
        if (!Schema::hasTable('device_settings')) {
            $this->log('ℹ️ device_settings table not found. skip.');
            return;
        }

        $data = ['device_id' => $deviceId];

        if (Schema::hasColumn('device_settings', 'stable_duration_sec')) {
            $data['stable_duration_sec'] = 180;
        }
        if (Schema::hasColumn('device_settings', 'max_session_sec')) {
            $data['max_session_sec'] = 600;
        }
        if (Schema::hasColumn('device_settings', 'sampling_hz')) {
            $data['sampling_hz'] = 10;
        }
        if (Schema::hasColumn('device_settings', 'moving_avg_window')) {
            $data['moving_avg_window'] = 5;
        }
        if (Schema::hasColumn('device_settings', 'gross_weight_limit_g')) {
            $data['gross_weight_limit_g'] = 2000;
        }
        if (Schema::hasColumn('device_settings', 'created_at')) {
            $data['created_at'] = now();
        }
        if (Schema::hasColumn('device_settings', 'updated_at')) {
            $data['updated_at'] = now();
        }

        DB::table('device_settings')->updateOrInsert(
            ['device_id' => $deviceId],
            $data
        );

        $this->log("✅ device_settings ensured: {$deviceId}");
    }

    /**
     * @description
     * bowl_snapshots を「過去2ヶ月〜先2ヶ月（今月含む）」で生成する
     *
     * - 生成日時は JST で作る（UIと整合する）
     * - DB保存は recorded_at を UTC へ変換して入れる（timestamptz想定）
     * - 既存 bowl_snapshots は全削除して作り直す
     *
     * @param string $deviceId - devices.id
     * @return void
     */
    private function seedBowlSnapshots(string $deviceId): void
    {
        if (!Schema::hasTable('bowl_snapshots')) {
            $this->log('⚠️ bowl_snapshots table not found. skip.');
            return;
        }

        DB::table('bowl_snapshots')->delete();

        $jst = 'Asia/Tokyo';

        // 今日（JST）
        $todayJst = CarbonImmutable::now($jst)->startOfDay();

        // 過去2ヶ月の月初 〜 先2ヶ月の月初（今月含めて 5ヶ月）
        $startMonth = $todayJst->subMonths(2)->startOfMonth();
        $endMonth = $todayJst->addMonths(2)->startOfMonth();

        $weights = [6, 8, 10, 12, 14];
        $minutes = [0, 10, 20, 30, 40, 50];

        $rows = [];

        // month loop
        for ($m = $startMonth; $m->lessThanOrEqualTo($endMonth); $m = $m->addMonth()->startOfMonth()) {
            $monthBegin = $m->startOfMonth();
            $monthEnd = $m->endOfMonth();

            // day loop
            for ($d = $monthBegin; $d->lessThanOrEqualTo($monthEnd); $d = $d->addDay()) {
                $n = random_int(1, 3);

                for ($i = 0; $i < $n; $i++) {
                    $hour = random_int(6, 22);
                    $minute = $minutes[array_rand($minutes)];

                    // JSTの日時を作る
                    $dtJst = $d->setTime($hour, $minute, 0, 0);

                    // DB保存はUTCへ変換
                    $dtUtc = $dtJst->setTimezone('UTC');

                    $row = [
                        'device_id' => $deviceId,
                        'weight_g' => $weights[array_rand($weights)],
                        'recorded_at' => $dtUtc->format('Y-m-d H:i:s.uP'),
                    ];

                    // bowl_snapshots.id が NOT NULL (uuid) で default が無い環境向け
                    if (Schema::hasColumn('bowl_snapshots', 'id')) {
                        // 先頭に入れて見やすくする
                        $row = ['id' => (string) Str::uuid()] + $row;
                    }

                    if (Schema::hasColumn('bowl_snapshots', 'created_at')) {
                        $row['created_at'] = now();
                    }
                    if (Schema::hasColumn('bowl_snapshots', 'updated_at')) {
                        $row['updated_at'] = now();
                    }

                    $rows[] = $row;
                }
            }
        }

        // insert（大量になるので chunk）
        $chunkSize = 1000;
        foreach (array_chunk($rows, $chunkSize) as $chunk) {
            DB::table('bowl_snapshots')->insert($chunk);
        }

        $count = DB::table('bowl_snapshots')->count();
        $this->log("✅ bowl_snapshots seeded. count={$count}");
    }
}
