<?php

namespace Tests\Feature\Api\V1;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureUsersTable();
        $this->ensurePersonalAccessTokensTable();
        $this->ensureDevicesTable();
        $this->ensureDeviceSettingsTable();
        $this->ensureBowlSnapshotsTable();
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    public function test_dashboard_success_with_month_and_device_id(): void
    {
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();
        $month = '2026-02';

        CarbonImmutable::setTestNow(
            CarbonImmutable::create(2026, 2, 10, 12, 0, 0, 'Asia/Tokyo')
        );

        DB::table('bowl_snapshots')->where('device_id', $deviceId)->delete();

        $this->insertSnapshot($deviceId, '2026-02-05 03:00:00', 100);
        $this->insertSnapshot($deviceId, '2026-02-05 04:00:00', 50);
        $this->insertSnapshot($deviceId, '2026-02-10 00:15:00', 30);
        $this->insertSnapshot($deviceId, '2026-02-10 09:45:00', 20);
        $this->insertSnapshot($deviceId, '2026-02-11 00:00:00', 77);

        $this->insertSnapshot($deviceId, '2025-11-05 03:00:00', 40);
        $this->insertSnapshot($deviceId, '2025-11-05 05:00:00', 60);
        $this->insertSnapshot($deviceId, '2025-12-20 02:00:00', 50);
        $this->insertSnapshot($deviceId, '2026-01-15 04:00:00', 30);

        $response = $this->get('/api/v1/dashboard?month=' . $month . '&device_id=' . $deviceId, [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(200);

        $response->assertJson([
            'todayEvents' => [
                ['time' => '09:15', 'g' => 30.0],
                ['time' => '18:45', 'g' => 20.0],
            ],
            'todayTotal' => 50,
            'bowlRemaining' => 77,
            'averageDailyIntakeLast3Months' => 60,
        ]);
    }

    public function test_dashboard_missing_device_returns_not_found(): void
    {
        $token = $this->seedUser();

        DB::table('bowl_snapshots')->delete();
        DB::table('device_settings')->delete();
        DB::table('devices')->delete();

        $response = $this->get('/api/v1/dashboard', [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(404);
        $response->assertJson([
            'error' => 'device not found',
        ]);
    }

    public function test_dashboard_returns_zero_as_int_when_no_data(): void
    {
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();

        CarbonImmutable::setTestNow(
            CarbonImmutable::create(2026, 2, 10, 12, 0, 0, 'Asia/Tokyo')
        );

        DB::table('bowl_snapshots')->where('device_id', $deviceId)->delete();

        $response = $this->get('/api/v1/dashboard?device_id=' . $deviceId, [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'todayEvents' => [],
            'todayTotal' => 0,
            'bowlRemaining' => 0,
            'averageDailyIntakeLast3Months' => 0,
        ]);

        $this->assertIsInt($response->json('todayTotal'));
        $this->assertIsInt($response->json('bowlRemaining'));
        $this->assertIsInt($response->json('averageDailyIntakeLast3Months'));
    }

    public function test_dashboard_requires_authentication(): void
    {
        $response = $this->get('/api/v1/dashboard');

        $response->assertStatus(401);
        $response->assertJson([
            'error' => 'unauthorized',
        ]);
    }

    public function test_dashboard_requires_api_token_in_production(): void
    {
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();

        putenv('API_TOKEN=secret-token');
        $_ENV['API_TOKEN'] = 'secret-token';
        $_SERVER['API_TOKEN'] = 'secret-token';

        config(['app.env' => 'production']);

        $response = $this->get('/api/v1/dashboard?device_id=' . $deviceId, [
            'Authorization' => 'Bearer ' . $token,
            'X-Api-Token' => 'wrong-token',
        ]);

        $response->assertStatus(403);
        $response->assertContent('');
        $response->assertHeaderMissing('Content-Type');
    }

    private function buildDailySeries(int $daysInMonth, array $totals): array
    {
        $series = [];
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $key = (string) $day;
            $series[] = [
                'day' => $key,
                'total' => (int) ($totals[$key] ?? 0),
            ];
        }

        return $series;
    }

    private function insertSnapshot(string $deviceId, string $recordedAtUtc, int $weight): void
    {
        DB::table('bowl_snapshots')->insert([
            'id' => (string) Str::uuid(),
            'device_id' => $deviceId,
            'weight_g' => $weight,
            'recorded_at' => $recordedAtUtc,
            'created_at' => $recordedAtUtc,
            'updated_at' => $recordedAtUtc,
        ]);
    }

    private function seedUser(): string
    {
        $email = 'dashboard@example.com';
        $plainToken = Str::random(40);

        DB::table('users')->where('email', $email)->delete();
        $userId = DB::table('users')->insertGetId([
            'email' => $email,
            'password' => password_hash('password', PASSWORD_BCRYPT),
            'role' => 'user',
            'created_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ]);

        $tokenId = DB::table('personal_access_tokens')->insertGetId([
            'tokenable_type' => 'App\\Models\\User',
            'tokenable_id' => $userId,
            'name' => 'web-login',
            'token' => hash('sha256', $plainToken),
            'abilities' => null,
            'created_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ]);

        return $tokenId . '|' . $plainToken;
    }

    private function seedDevice(): string
    {
        $deviceId = (string) Str::uuid();

        DB::table('devices')->where('id', $deviceId)->delete();
        DB::table('devices')->insert([
            'id' => $deviceId,
            'code' => 'device-code-' . uniqid(),
            'name' => 'device-name',
            'created_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ]);

        return $deviceId;
    }

    private function ensureUsersTable(): void
    {
        $row = DB::selectOne("SELECT to_regclass('public.users') as name");
        $exists = $row && $row->name !== null;

        if ($exists) {
            return;
        }

        DB::statement(<<<SQL
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SQL);
    }

    /**
     * personal_access_tokens テーブルの存在を保証する
     * @return void
     */
    private function ensurePersonalAccessTokensTable(): void
    {
        $row = DB::selectOne("SELECT to_regclass('public.personal_access_tokens') as name");
        $exists = $row && $row->name !== null;

        if ($exists) {
            return;
        }

        DB::statement(<<<SQL
CREATE TABLE IF NOT EXISTS personal_access_tokens (
  id SERIAL PRIMARY KEY,
  tokenable_type VARCHAR(255) NOT NULL,
  tokenable_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  abilities TEXT,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SQL);
    }

    private function ensureDevicesTable(): void
    {
        $row = DB::selectOne("SELECT to_regclass('public.devices') as name");
        $exists = $row && $row->name !== null;

        if ($exists) {
            return;
        }

        DB::statement(<<<SQL
CREATE TABLE IF NOT EXISTS devices (
  id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SQL);
    }

    private function ensureDeviceSettingsTable(): void
    {
        $row = DB::selectOne("SELECT to_regclass('public.device_settings') as name");
        $exists = $row && $row->name !== null;

        if ($exists) {
            return;
        }

        DB::statement(<<<SQL
CREATE TABLE IF NOT EXISTS device_settings (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL,
  stable_duration_sec INTEGER NOT NULL,
  max_session_sec INTEGER NOT NULL,
  lock_version INTEGER NOT NULL DEFAULT 0,
  tare_weight INTEGER NOT NULL,
  stability_epsilon_g INTEGER NOT NULL,
  sampling_hz INTEGER NOT NULL,
  moving_avg_window INTEGER NOT NULL,
  gross_weight_limit_g INTEGER NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SQL);
    }

    private function ensureBowlSnapshotsTable(): void
    {
        $row = DB::selectOne("SELECT to_regclass('public.bowl_snapshots') as name");
        $exists = $row && $row->name !== null;

        if ($exists) {
            return;
        }

        DB::statement(<<<SQL
CREATE TABLE IF NOT EXISTS bowl_snapshots (
  id VARCHAR(255) PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL,
  weight_g INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SQL);
    }
}
