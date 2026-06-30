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
 * - users: 管理ユーザーをadminとして作成し、user/guestも追加作成
 * - devices: DEVICE_ID を ENV から作成（なければ固定UUID）
 * - device_settings: テーブルが存在すれば、存在するカラムだけ初期化
 * - bowl_snapshots:
 *   - 過去2ヶ月 / 今月（合計3ヶ月）を対象に生成
 *   - 1日あたり 1〜3件
 *   - JSTの日時で生成し、DB保存はUTCへ変換して recorded_at に保存
 * - device_session_events:
 *   - 過去2ヶ月 / 今月 / 先1ヶ月（合計4ヶ月）を対象に生成
 *   - 1日あたり 1〜3件
 *   - 食事確定イベント（eat_finished）を中心に生成
 * - health_logs:
 *   - 過去2ヶ月 / 今月（合計3ヶ月）を対象に生成
 *   - 各月・各種別ごとに5件ずつ生成
 *   - JSTの日時で生成し、DB保存はUTCへ変換して occurred_at に保存
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
        $this->log('🧪 Seeding users / devices / bowl_snapshots / device_session_events / health_logs ...');

        DB::transaction(function () {
            $this->seedUsers();
            $deviceId = $this->ensureDevice();
            $this->ensureDeviceSetting($deviceId);
            $this->seedBowlSnapshots($deviceId);
            $this->seedDeviceSessionEvents($deviceId);
            $this->seedHealthLogs($deviceId);
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
     * 管理ユーザーをadminとして作成し、user/guestも追加作成する
     *
     * - 既存 users は全削除して作り直す
     * - password は Hash::make で保存
     *
     * @return void
     */
    private function seedUsers(): void
    {
        if (!Schema::hasTable('users')) {
            $this->log('⚠️ users table not found. skip users seeding.');
            return;
        }

        $adminEmail = (string) env('ADMIN_EMAIL', 'admin@example.com');
        $adminPassword = (string) env('ADMIN_PASSWORD', 'password');
        $userEmail = (string) env('USER_EMAIL', 'user@example.com');
        $userPassword = (string) env('USER_PASSWORD', 'password');
        $guestEmail = (string) env('GUEST_EMAIL', 'guest@example.com');
        $guestPassword = (string) env('GUEST_PASSWORD', 'password');

        DB::table('users')->delete();

        $baseTimestamps = [];
        if (Schema::hasColumn('users', 'created_at')) {
            $baseTimestamps['created_at'] = now();
        }
        if (Schema::hasColumn('users', 'updated_at')) {
            $baseTimestamps['updated_at'] = now();
        }

        // 既存の管理ユーザーをadminとして作成する
        $adminData = [
            'email' => $adminEmail,
            'password' => Hash::make($adminPassword),
        ] + $baseTimestamps;
        if (Schema::hasColumn('users', 'name')) {
            $adminData['name'] = 'admin';
        }
        if (Schema::hasColumn('users', 'role')) {
            $adminData['role'] = 'admin';
        }

        // 一般ユーザーを追加する
        $userData = [
            'email' => $userEmail,
            'password' => Hash::make($userPassword),
        ] + $baseTimestamps;
        if (Schema::hasColumn('users', 'name')) {
            $userData['name'] = 'user';
        }
        if (Schema::hasColumn('users', 'role')) {
            $userData['role'] = 'user';
        }

        // ゲストユーザーを追加する
        $guestData = [
            'email' => $guestEmail,
            'password' => Hash::make($guestPassword),
        ] + $baseTimestamps;
        if (Schema::hasColumn('users', 'name')) {
            $guestData['name'] = 'guest';
        }
        if (Schema::hasColumn('users', 'role')) {
            $guestData['role'] = 'guest';
        }

        DB::table('users')->insert([
            $adminData,
            $userData,
            $guestData,
        ]);

        $this->log('✅ users seeded. (admin/user/guest)');
    }

    /**
     * @description
     * Device を1件作成/確保して device_id を返す
     *
     * - DEVICE_ID があればそれを使用
     * - なければ既定の固定UUIDを使う
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
     * bowl_snapshots を「過去2ヶ月〜今月」で生成する
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

        // 現在時刻（JST）
        $nowJst = CarbonImmutable::now($jst);
        $todayJst = $nowJst->startOfDay();

        // 過去2ヶ月の月初 〜 今月の月初（今月含めて 3ヶ月）
        $startMonth = $todayJst->subMonths(2)->startOfMonth();
        $endMonth = $todayJst->startOfMonth();

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

                    // 未来時刻のシードは作らない
                    // 当日の未到来時刻を除外して「今より前」のデータだけ作る
                    if ($dtJst->greaterThan($nowJst)) {
                        continue;
                    }

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

    /**
     * @description
     * device_session_events を「過去2ヶ月〜先1ヶ月（今月含む）」で生成する
     *
     * - 生成日時は JST で作る（UIと整合する）
     * - DB保存は recorded_at を UTC へ変換して入れる（timestamptz想定）
     * - 既存 device_session_events は全削除して作り直す
     *
     * @param string $deviceId - devices.id
     * @return void
     */
    private function seedDeviceSessionEvents(string $deviceId): void
    {
        if (!Schema::hasTable('device_session_events')) {
            $this->log('⚠️ device_session_events table not found. skip.');
            return;
        }

        DB::table('device_session_events')->delete();

        $jst = 'Asia/Tokyo';
        $todayJst = CarbonImmutable::now($jst)->startOfDay();

        // 過去2ヶ月の月初 〜 先1ヶ月の月初（今月含めて 4ヶ月）
        $startMonth = $todayJst->subMonths(2)->startOfMonth();
        $endMonth = $todayJst->addMonths(1)->startOfMonth();

        $eatenCandidates = [3.5, 5.0, 6.5, 8.0, 10.0, 12.5];
        $minutes = [0, 10, 20, 30, 40, 50];

        $rows = [];

        for ($m = $startMonth; $m->lessThanOrEqualTo($endMonth); $m = $m->addMonth()->startOfMonth()) {
            $monthBegin = $m->startOfMonth();
            $monthEnd = $m->endOfMonth();

            for ($d = $monthBegin; $d->lessThanOrEqualTo($monthEnd); $d = $d->addDay()) {
                $n = random_int(1, 3);

                for ($i = 0; $i < $n; $i++) {
                    $hour = random_int(6, 22);
                    $minute = $minutes[array_rand($minutes)];
                    $dtJst = $d->setTime($hour, $minute, 0, 0);
                    $dtUtc = $dtJst->setTimezone('UTC');

                    $eaten = $eatenCandidates[array_rand($eatenCandidates)];
                    // 各日最低1件は eat_finished を入れて、0g日が出ないようにする
                    // 2件目以降は従来どおり一部を discard にする
                    $event = $i === 0
                        ? 'eat_finished'
                        : (random_int(1, 10) === 1 ? 'eat_discarded' : 'eat_finished');

                    $row = [
                        'id' => (string) Str::uuid(),
                        'session_id' => (string) Str::uuid(),
                        'device_id' => $deviceId,
                        'event' => $event,
                        'eaten_grams' => $eaten,
                        'recorded_at' => $dtUtc->format('Y-m-d H:i:s.uP'),
                    ];

                    if (Schema::hasColumn('device_session_events', 'raw_payload')) {
                        $row['raw_payload'] = json_encode([
                            'session_id' => $row['session_id'],
                            'device_id' => $deviceId,
                            'event' => $event,
                            'eaten' => $eaten,
                            'recorded_at' => $dtUtc->toIso8601String(),
                        ], JSON_UNESCAPED_UNICODE);
                    }
                    if (Schema::hasColumn('device_session_events', 'created_at')) {
                        $row['created_at'] = now();
                    }
                    if (Schema::hasColumn('device_session_events', 'updated_at')) {
                        $row['updated_at'] = now();
                    }

                    $rows[] = $row;
                }
            }
        }

        foreach (array_chunk($rows, 1000) as $chunk) {
            DB::table('device_session_events')->insert($chunk);
        }

        $count = DB::table('device_session_events')->count();
        $this->log("✅ device_session_events seeded. count={$count}");
    }

    /**
     * @description
     * health_logs を「過去2ヶ月〜今月」で生成する
     *
     * - 各月・各種別ごとに5件ずつ作る
     * - 生成日時は JST で作る
     * - DB保存は occurred_at を UTC へ変換して入れる
     *
     * @param string $deviceId - devices.id
     * @return void
     */
    private function seedHealthLogs(string $deviceId): void
    {
        if (!Schema::hasTable('health_logs')) {
            $this->log('⚠️ health_logs table not found. skip.');
            return;
        }

        DB::table('health_logs')->where('device_id', $deviceId)->delete();

        $jst = 'Asia/Tokyo';
        $todayJst = CarbonImmutable::now($jst)->startOfDay();

        // seed実行月に合わせて、過去2ヶ月の月初 〜 今月の月初を対象にする
        $startMonth = $todayJst->subMonths(2)->startOfMonth();
        $endMonth = $todayJst->startOfMonth();

        $types = [
            'vomit',
            'diarrhea',
            'bloody_stool',
            'injury',
            'hospital_visit',
            'medication',
            'weight',
            'other',
        ];

        $notes = [
            'vomit' => '食後に少量の嘔吐あり',
            'diarrhea' => '便がやわらかい状態',
            'bloody_stool' => '便に少量の血が混じる',
            'injury' => '足を気にしている様子',
            'hospital_visit' => '定期通院',
            'medication' => '処方薬を服用',
            'weight' => '体重測定',
            'other' => 'いつもと少し様子が違う',
        ];

        $days = [2, 7, 12, 18, 24];
        $hours = [8, 10, 13, 17, 21];
        $weightValues = [3.72, 3.76, 3.80, 3.84, 3.88];

        $rows = [];

        for ($m = $startMonth; $m->lessThanOrEqualTo($endMonth); $m = $m->addMonth()->startOfMonth()) {
            $month = $m->format('Y-m');

            foreach ($types as $type) {
                foreach ($days as $index => $day) {
                    // 月ごと・種別ごとに日付をずらして、タイムライン上で偏らないようにする
                    $dtJst = $m
                        ->setDate((int) $m->format('Y'), (int) $m->format('m'), $day)
                        ->setTime($hours[$index], $index * 10, 0, 0);

                    // DB保存はUTCへ変換
                    $dtUtc = $dtJst->setTimezone('UTC');
                    $hasPhoto = in_array($type, ['vomit', 'injury', 'bloody_stool'], true) && $index % 2 === 0;

                    $rows[] = [
                        'id' => (string) Str::uuid(),
                        'device_id' => $deviceId,
                        'type' => $type,
                        'occurred_at' => $dtUtc->format('Y-m-d H:i:s.uP'),
                        'note' => $notes[$type],
                        'weight_kg' => $type === 'weight' ? $weightValues[$index] : null,
                        'photos' => json_encode($hasPhoto ? ["sample-{$type}-{$month}-{$index}"] : []),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        foreach (array_chunk($rows, 1000) as $chunk) {
            DB::table('health_logs')->insert($chunk);
        }

        $count = DB::table('health_logs')->where('device_id', $deviceId)->count();
        $this->log("✅ health_logs seeded. count={$count}");
    }
}
