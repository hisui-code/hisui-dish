<?php

namespace Tests\Feature\Api\V1;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class LogsTest extends TestCase
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

    public function test_logs_success_with_month_and_device_id(): void
    {
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();
        $month = '2026-02';

        DB::table('bowl_snapshots')->where('device_id', $deviceId)->delete();

        $recordedAt = CarbonImmutable::create(2026, 2, 10, 12, 0, 0, 'UTC');

        DB::table('bowl_snapshots')->insert([
            'id' => (string) Str::uuid(),
            'device_id' => $deviceId,
            'weight_g' => 123,
            'recorded_at' => $recordedAt->format('Y-m-d H:i:s'),
            'created_at' => $recordedAt->format('Y-m-d H:i:s'),
            'updated_at' => $recordedAt->format('Y-m-d H:i:s'),
        ]);

        $response = $this->get('/api/v1/logs?month=' . $month . '&device_id=' . $deviceId, [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'logs' => [
                ['id', 'recordedAtIso', 'grams'],
            ],
        ]);

        $recordedAtIso = $response->json('logs.0.recordedAtIso');
        $this->assertMatchesRegularExpression('/\+09:00\z/', $recordedAtIso);
        $this->assertSame(123, $response->json('logs.0.grams'));
    }

    public function test_logs_success_with_month_omitted(): void
    {
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();

        DB::table('bowl_snapshots')->where('device_id', $deviceId)->delete();

        $recordedAt = CarbonImmutable::now('UTC');

        DB::table('bowl_snapshots')->insert([
            'id' => (string) Str::uuid(),
            'device_id' => $deviceId,
            'weight_g' => 50,
            'recorded_at' => $recordedAt->format('Y-m-d H:i:s'),
            'created_at' => $recordedAt->format('Y-m-d H:i:s'),
            'updated_at' => $recordedAt->format('Y-m-d H:i:s'),
        ]);

        $response = $this->get('/api/v1/logs?device_id=' . $deviceId, [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'logs' => [
                ['id', 'recordedAtIso', 'grams'],
            ],
        ]);
    }

    public function test_logs_invalid_month_returns_bad_request(): void
    {
        $token = $this->seedUser();

        $response = $this->get('/api/v1/logs?month=invalid', [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(400);
        $response->assertJson([
            'error' => 'invalid month',
        ]);
    }

    public function test_logs_missing_device_returns_not_found(): void
    {
        $token = $this->seedUser();
        DB::table('bowl_snapshots')->delete();
        DB::table('device_settings')->delete();
        DB::table('devices')->delete();

        $response = $this->get('/api/v1/logs', [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(404);
        $response->assertJson([
            'error' => 'device not found',
        ]);
    }

    public function test_logs_requires_authentication(): void
    {
        $response = $this->get('/api/v1/logs');

        $response->assertStatus(401);
        $response->assertJson([
            'error' => 'unauthorized',
        ]);
    }

    public function test_logs_requires_api_token_in_production(): void
    {
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();

        putenv('API_TOKEN=secret-token');
        $_ENV['API_TOKEN'] = 'secret-token';
        $_SERVER['API_TOKEN'] = 'secret-token';

        config(['app.env' => 'production']);

        $response = $this->get('/api/v1/logs?device_id=' . $deviceId, [
            'Authorization' => 'Bearer ' . $token,
            'X-Api-Token' => 'wrong-token',
        ]);

        $response->assertStatus(403);
        $response->assertContent('');
        $response->assertHeaderMissing('Content-Type');
    }

    private function seedUser(): string
    {
        $email = 'logs@example.com';
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

    public function test_logs_delete_success(): void
    {
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();

        $logId = (string) Str::uuid();
        $recordedAt = CarbonImmutable::now('UTC');

        DB::table('bowl_snapshots')->insert([
            'id' => $logId,
            'device_id' => $deviceId,
            'weight_g' => 120,
            'recorded_at' => $recordedAt->format('Y-m-d H:i:s'),
            'created_at' => $recordedAt->format('Y-m-d H:i:s'),
            'updated_at' => $recordedAt->format('Y-m-d H:i:s'),
        ]);

        $response = $this->delete('/api/v1/logs/' . $logId, [], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(204);
        $this->assertSame(0, DB::table('bowl_snapshots')->where('id', $logId)->count());
    }
}
