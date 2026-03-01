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

        // テスト実行に必要な最小テーブルを準備する
        $this->ensureUsersTable();
        $this->ensurePersonalAccessTokensTable();
        $this->ensureDevicesTable();
        $this->ensureDeviceSettingsTable();
        $this->ensureDeviceSessionEventsTable();
    }

    public function test_logs_success_with_month_and_device_id(): void
    {
        // テストケース
        // 月とdevice_idを指定したとき、対象月のeat_finishedログだけ取得できる
        // 処理内容
        // 2026-02の食事イベントを1件作成して /api/v1/logs で取得する
        // 期待する結果
        // 200で logs 配列が返り、JST形式の recordedAtIso と grams が含まれる
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();
        $month = '2026-02';

        DB::table('device_session_events')->where('device_id', $deviceId)->delete();

        $recordedAt = CarbonImmutable::create(2026, 2, 10, 12, 0, 0, 'UTC');

        DB::table('device_session_events')->insert([
            'id' => (string) Str::uuid(),
            'session_id' => (string) Str::uuid(),
            'device_id' => $deviceId,
            'event' => 'eat_finished',
            'eaten_grams' => 123,
            'recorded_at' => $recordedAt->format('Y-m-d H:i:s'),
            'raw_payload' => json_encode(['event' => 'eat_finished'], JSON_UNESCAPED_UNICODE),
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
        // テストケース
        // month未指定時に当月（JST）でログ取得できる
        // 処理内容
        // 現在時刻のeat_finishedログを1件作成して monthなしで取得する
        // 期待する結果
        // 200で logs 配列が返る
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();

        DB::table('device_session_events')->where('device_id', $deviceId)->delete();

        $recordedAt = CarbonImmutable::now('UTC');

        DB::table('device_session_events')->insert([
            'id' => (string) Str::uuid(),
            'session_id' => (string) Str::uuid(),
            'device_id' => $deviceId,
            'event' => 'eat_finished',
            'eaten_grams' => 50,
            'recorded_at' => $recordedAt->format('Y-m-d H:i:s'),
            'raw_payload' => json_encode(['event' => 'eat_finished'], JSON_UNESCAPED_UNICODE),
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
        // テストケース
        // month形式が不正な場合
        // 処理内容
        // month=invalid でアクセスする
        // 期待する結果
        // 400 invalid month を返す
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
        // テストケース
        // デバイスが1件も無い場合
        // 処理内容
        // devices/device_settings/device_session_events を空にして /logs を呼ぶ
        // 期待する結果
        // 404 device not found を返す
        $token = $this->seedUser();
        DB::table('device_session_events')->delete();
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
        // テストケース
        // 認証なしアクセス
        // 処理内容
        // Authorizationヘッダなしで /logs を呼ぶ
        // 期待する結果
        // 401 unauthorized を返す
        $response = $this->get('/api/v1/logs');

        $response->assertStatus(401);
        $response->assertJson([
            'error' => 'unauthorized',
        ]);
    }

    public function test_logs_requires_api_token_in_production(): void
    {
        // テストケース
        // production環境でAPIトークンが不正な場合
        // 処理内容
        // app.env=production かつ X-Api-Token を誤値で /logs を呼ぶ
        // 期待する結果
        // 403を返し、レスポンスボディは空
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
        // 認証付きAPIテスト用ユーザーを作成する
        // 戻り値は token_id|plain_token 形式
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
        // ログ紐付け用のデバイスを作成する
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
        // usersテーブルが無い環境でも動くよう最小構成で補完する
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
        // personal_access_tokensテーブルを最小構成で補完する
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
        // devicesテーブルを最小構成で補完する
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

    private function ensureDeviceSessionEventsTable(): void
    {
        // logs取得元のdevice_session_eventsを最小構成で補完する
        $row = DB::selectOne("SELECT to_regclass('public.device_session_events') as name");
        $exists = $row && $row->name !== null;

        if ($exists) {
            return;
        }

        DB::statement(<<<SQL
CREATE TABLE IF NOT EXISTS device_session_events (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  event VARCHAR(64) NOT NULL,
  eaten_grams NUMERIC(8,2) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  raw_payload TEXT,
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
        // テストケース
        // ログID指定で削除できる
        // 処理内容
        // eat_finishedイベントを1件作成し DELETE /logs/{id} を呼ぶ
        // 期待する結果
        // 204を返し、対象レコードが削除される
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();

        $logId = (string) Str::uuid();
        $recordedAt = CarbonImmutable::now('UTC');

        DB::table('device_session_events')->insert([
            'id' => $logId,
            'session_id' => (string) Str::uuid(),
            'device_id' => $deviceId,
            'event' => 'eat_finished',
            'eaten_grams' => 120,
            'recorded_at' => $recordedAt->format('Y-m-d H:i:s'),
            'raw_payload' => json_encode(['event' => 'eat_finished'], JSON_UNESCAPED_UNICODE),
            'created_at' => $recordedAt->format('Y-m-d H:i:s'),
            'updated_at' => $recordedAt->format('Y-m-d H:i:s'),
        ]);

        $response = $this->delete('/api/v1/logs/' . $logId, [], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(204);
        $this->assertSame(0, DB::table('device_session_events')->where('id', $logId)->count());
    }
}
