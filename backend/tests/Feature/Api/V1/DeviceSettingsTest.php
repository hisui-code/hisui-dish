<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class DeviceSettingsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // テストに必要な最小テーブルを用意する
        $this->ensureUsersTable();
        $this->ensurePersonalAccessTokensTable();
        $this->ensureDevicesTable();
        $this->ensureDeviceSettingsTable();
    }

    public function test_get_device_settings_success(): void
    {
        // テストケース
        // 既存device_settingsをGETすると200で設定値が返る
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();

        DB::table('device_settings')->where('device_id', $deviceId)->delete();
        DB::table('device_settings')->insert([
            'device_id' => $deviceId,
            'stable_duration_sec' => 180,
            'max_session_sec' => 600,
            'lock_version' => 0,
            'tare_weight' => 250,
            'stability_epsilon_g' => 5,
            'sampling_hz' => 10,
            'moving_avg_window' => 5,
            'gross_weight_limit_g' => 2000,
            'created_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ]);

        $response = $this->get('/api/v1/device_settings/' . $deviceId, [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'device_id' => $deviceId,
            'stable_duration_sec' => 180,
            'max_session_sec' => 600,
            'lock_version' => 0,
        ]);

        // updated_atはUTCミリ秒付きISO8601で返ることを確認する
        $updatedAt = $response->json('updated_at');
        $this->assertIsString($updatedAt);
        $this->assertMatchesRegularExpression(
            '/\A\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\z/',
            $updatedAt
        );
    }

    public function test_get_device_settings_not_found(): void
    {
        // テストケース
        // 対象デバイスの設定が無い場合は404を返す
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();

        DB::table('device_settings')->where('device_id', $deviceId)->delete();

        $response = $this->get('/api/v1/device_settings/' . $deviceId, [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(404);
        $response->assertJson([
            'error' => 'not_found',
        ]);
    }

    public function test_put_device_settings_success(): void
    {
        // テストケース
        // lock_version一致で更新でき、lock_versionが+1される
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();

        DB::table('device_settings')->where('device_id', $deviceId)->delete();
        DB::table('device_settings')->insert([
            'device_id' => $deviceId,
            'stable_duration_sec' => 180,
            'max_session_sec' => 600,
            'lock_version' => 1,
            'tare_weight' => 250,
            'stability_epsilon_g' => 5,
            'sampling_hz' => 10,
            'moving_avg_window' => 5,
            'gross_weight_limit_g' => 2000,
            'created_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ]);

        $payload = [
            'device_setting' => [
                'stable_duration_sec' => 181,
                'max_session_sec' => 601,
                'lock_version' => 1,
                'tare_weight' => 251,
                'stability_epsilon_g' => 6,
                'sampling_hz' => 11,
                'moving_avg_window' => 6,
                'gross_weight_limit_g' => 2001,
            ],
        ];

        $response = $this->putJson('/api/v1/device_settings/' . $deviceId, $payload, [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'device_id' => $deviceId,
            'lock_version' => 2,
            'tare_weight' => 251,
        ]);

        // 更新後の時刻フォーマットも検証する
        $updatedAt = $response->json('updated_at');
        $this->assertMatchesRegularExpression(
            '/\A\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\z/',
            $updatedAt
        );
    }

    public function test_put_device_settings_conflict(): void
    {
        // テストケース
        // 古いlock_versionで更新すると409 conflictになる
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();

        DB::table('device_settings')->where('device_id', $deviceId)->delete();
        DB::table('device_settings')->insert([
            'device_id' => $deviceId,
            'stable_duration_sec' => 180,
            'max_session_sec' => 600,
            'lock_version' => 3,
            'tare_weight' => 250,
            'stability_epsilon_g' => 5,
            'sampling_hz' => 10,
            'moving_avg_window' => 5,
            'gross_weight_limit_g' => 2000,
            'created_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ]);

        $payload = [
            'device_setting' => [
                'stable_duration_sec' => 181,
                'max_session_sec' => 601,
                'lock_version' => 2,
                'tare_weight' => 251,
                'stability_epsilon_g' => 6,
                'sampling_hz' => 11,
                'moving_avg_window' => 6,
                'gross_weight_limit_g' => 2001,
            ],
        ];

        $response = $this->putJson('/api/v1/device_settings/' . $deviceId, $payload, [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(409);
        $response->assertJson([
            'error' => 'conflict',
            'current_version' => 3,
        ]);
    }

    public function test_put_device_settings_validation_error(): void
    {
        // テストケース
        // 不正な値を送ると422とエラーメッセージ配列が返る
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();

        DB::table('device_settings')->where('device_id', $deviceId)->delete();
        DB::table('device_settings')->insert([
            'device_id' => $deviceId,
            'stable_duration_sec' => 180,
            'max_session_sec' => 600,
            'lock_version' => 0,
            'tare_weight' => 250,
            'stability_epsilon_g' => 5,
            'sampling_hz' => 10,
            'moving_avg_window' => 5,
            'gross_weight_limit_g' => 2000,
            'created_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ]);

        $payload = [
            'device_setting' => [
                'stable_duration_sec' => 0,
                'max_session_sec' => -1,
                'lock_version' => 0,
                'tare_weight' => 250,
                'stability_epsilon_g' => 5,
                'sampling_hz' => 10,
                'moving_avg_window' => 5,
                'gross_weight_limit_g' => 2000,
            ],
        ];

        $response = $this->putJson('/api/v1/device_settings/' . $deviceId, $payload, [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'error' => 'unprocessable_entity',
        ]);

        $messages = $response->json('messages');
        $this->assertIsArray($messages);
        $this->assertNotEmpty($messages);
    }

    public function test_device_settings_requires_authentication(): void
    {
        // テストケース
        // 認証ヘッダが無い場合は401を返す
        $deviceId = $this->seedDevice();

        $response = $this->get('/api/v1/device_settings/' . $deviceId);

        $response->assertStatus(401);
        $response->assertJson([
            'error' => 'unauthorized',
        ]);
    }

    public function test_web_device_settings_does_not_require_api_token_in_production(): void
    {
        // テストケース
        // production環境でもWeb用のDeviceSettings取得はBearer認証だけで使える
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();

        DB::table('device_settings')->where('device_id', $deviceId)->delete();
        DB::table('device_settings')->insert([
            'device_id' => $deviceId,
            'stable_duration_sec' => 180,
            'max_session_sec' => 600,
            'lock_version' => 0,
            'tare_weight' => 250,
            'stability_epsilon_g' => 5,
            'sampling_hz' => 10,
            'moving_avg_window' => 5,
            'gross_weight_limit_g' => 2000,
            'created_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ]);

        putenv('API_TOKEN=secret-token');
        $_ENV['API_TOKEN'] = 'secret-token';
        $_SERVER['API_TOKEN'] = 'secret-token';

        config(['app.env' => 'production']);

        $response = $this->get('/api/v1/device_settings/' . $deviceId, [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'device_id' => $deviceId,
        ]);
    }

    public function test_device_device_settings_requires_api_token_in_production(): void
    {
        // テストケース
        // production環境ではDevice用のDeviceSettings取得にX-Api-Tokenが必要
        $deviceId = $this->seedDevice();

        DB::table('device_settings')->where('device_id', $deviceId)->delete();
        DB::table('device_settings')->insert([
            'device_id' => $deviceId,
            'stable_duration_sec' => 180,
            'max_session_sec' => 600,
            'lock_version' => 0,
            'tare_weight' => 250,
            'stability_epsilon_g' => 5,
            'sampling_hz' => 10,
            'moving_avg_window' => 5,
            'gross_weight_limit_g' => 2000,
            'created_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ]);

        putenv('API_TOKEN=secret-token');
        $_ENV['API_TOKEN'] = 'secret-token';
        $_SERVER['API_TOKEN'] = 'secret-token';

        config(['app.env' => 'production']);

        $response = $this->get('/api/v1/device/device_settings/' . $deviceId, [
            'X-Api-Token' => 'wrong-token',
        ]);

        $response->assertStatus(403);
        $response->assertContent('');
        $response->assertHeaderMissing('Content-Type');
    }

    private function seedUser(): string
    {
        // 認証付きAPI呼び出し用のテストユーザーを作成する
        // 戻り値は "token_id|plain_token" 形式
        $email = 'device-settings@example.com';
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
        // device_settings紐付け用のテストデバイスを作成する
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
        // usersテーブルが無い実行環境でもテストできるように補完する
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
        // Laravelのpersonal_access_tokensを最小構成で補完する
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
        // device_settings参照先のdevicesを最小構成で補完する
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
        // テスト対象テーブルdevice_settingsを最小構成で補完する
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
}
