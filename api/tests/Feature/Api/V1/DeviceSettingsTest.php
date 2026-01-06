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

        $this->ensureUsersTable();
        $this->ensureDevicesTable();
        $this->ensureDeviceSettingsTable();
    }

    public function test_get_device_settings_success(): void
    {
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

        $updatedAt = $response->json('updated_at');
        $this->assertIsString($updatedAt);
        $this->assertMatchesRegularExpression(
            '/\A\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\z/',
            $updatedAt
        );
    }

    public function test_get_device_settings_not_found(): void
    {
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

        $updatedAt = $response->json('updated_at');
        $this->assertMatchesRegularExpression(
            '/\A\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\z/',
            $updatedAt
        );
    }

    public function test_put_device_settings_conflict(): void
    {
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
        $deviceId = $this->seedDevice();

        $response = $this->get('/api/v1/device_settings/' . $deviceId);

        $response->assertStatus(401);
        $response->assertJson([
            'error' => 'unauthorized',
        ]);
    }

    public function test_device_settings_requires_api_token_in_production(): void
    {
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
            'X-Api-Token' => 'wrong-token',
        ]);

        $response->assertStatus(403);
        $response->assertContent('');
        $response->assertHeaderMissing('Content-Type');
    }

    private function seedUser(): string
    {
        $email = 'device-settings@example.com';
        $token = 'token-' . uniqid();

        DB::table('users')->where('email', $email)->delete();
        DB::table('users')->insert([
            'email' => $email,
            'password_digest' => password_hash('password', PASSWORD_BCRYPT),
            'auth_token' => $token,
            'created_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ]);

        return $token;
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
  email VARCHAR(255),
  password_digest VARCHAR(255),
  auth_token VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
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
  created_at TIMESTAMP,
  updated_at TIMESTAMP
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
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
SQL);
    }
}
