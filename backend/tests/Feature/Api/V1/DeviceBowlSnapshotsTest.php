<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class DeviceBowlSnapshotsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // テスト用に必要なテーブルを事前に用意する
        $this->ensureUsersTable();
        $this->ensurePersonalAccessTokensTable();
        $this->ensureDevicesTable();
        $this->ensureBowlSnapshotsTable();
    }

    public function test_store_bowl_snapshot_success(): void
    {
        // テストケース
        // 正しいpayloadを送ると201で作成される
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();
        $snapshotId = (string) Str::uuid();

        $payload = [
            'snapshot_id' => $snapshotId,
            'device_id' => $deviceId,
            'weight_g' => 24.6,
            'recorded_at' => now('UTC')->toIso8601String(),
        ];

        $response = $this->postJson('/api/v1/device/bowl_snapshots', $payload, [
            'Authorization' => 'Bearer '.$token,
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'status' => 'created',
        ]);

        // DBに保存されることを確認する
        $stored = DB::table('bowl_snapshots')->where('id', $snapshotId)->first();
        $this->assertNotNull($stored);
        $this->assertSame($deviceId, $stored->device_id);
        // DBカラムがintegerなので四捨五入して保存される
        $this->assertSame(25, (int) $stored->weight_g);
    }

    public function test_store_bowl_snapshot_is_idempotent(): void
    {
        // テストケース
        // 同じsnapshot_idを再送しても重複登録されない
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();
        $snapshotId = (string) Str::uuid();

        $payload = [
            'snapshot_id' => $snapshotId,
            'device_id' => $deviceId,
            'weight_g' => 12.3,
            'recorded_at' => now('UTC')->toIso8601String(),
        ];

        $first = $this->postJson('/api/v1/device/bowl_snapshots', $payload, [
            'Authorization' => 'Bearer '.$token,
        ]);
        $first->assertStatus(201);

        $second = $this->postJson('/api/v1/device/bowl_snapshots', $payload, [
            'Authorization' => 'Bearer '.$token,
        ]);
        $second->assertStatus(200);
        $second->assertJson([
            'status' => 'already_processed',
        ]);

        // 同一IDは1件だけ存在することを確認する
        $this->assertSame(
            1,
            DB::table('bowl_snapshots')->where('id', $snapshotId)->count()
        );
    }

    public function test_store_bowl_snapshot_validation_error(): void
    {
        // テストケース
        // 必須項目や形式が不正な場合は422を返す
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();

        $payload = [
            'snapshot_id' => '',
            'device_id' => $deviceId,
            'weight_g' => -1,
            'recorded_at' => 'invalid-date',
        ];

        $response = $this->postJson('/api/v1/device/bowl_snapshots', $payload, [
            'Authorization' => 'Bearer '.$token,
        ]);

        $response->assertStatus(422);
        $response->assertJsonStructure([
            'message',
            'errors' => [
                'snapshot_id',
                'weight_g',
                'recorded_at',
            ],
        ]);
    }

    public function test_store_bowl_snapshot_device_not_found(): void
    {
        // テストケース
        // 未登録device_idは404を返す
        $token = $this->seedUser();

        $payload = [
            'snapshot_id' => (string) Str::uuid(),
            'device_id' => (string) Str::uuid(),
            'weight_g' => 12,
            'recorded_at' => now('UTC')->toIso8601String(),
        ];

        $response = $this->postJson('/api/v1/device/bowl_snapshots', $payload, [
            'Authorization' => 'Bearer '.$token,
        ]);

        $response->assertStatus(404);
        $response->assertJson([
            'error' => 'device_not_found',
        ]);
    }

    public function test_store_bowl_snapshot_allows_without_authentication_in_local(): void
    {
        // テストケース
        // local環境ではapi.authを要求しないため認証なしでも作成できる
        $deviceId = $this->seedDevice();

        $payload = [
            'snapshot_id' => (string) Str::uuid(),
            'device_id' => $deviceId,
            'weight_g' => 10,
            'recorded_at' => now('UTC')->toIso8601String(),
        ];

        $response = $this->postJson('/api/v1/device/bowl_snapshots', $payload);

        $response->assertStatus(201);
        $response->assertJson([
            'status' => 'created',
        ]);
    }

    public function test_store_bowl_snapshot_requires_api_token_in_production(): void
    {
        // テストケース
        // production環境ではX-Api-Tokenが不正だと403を返す
        $token = $this->seedUser();
        $deviceId = $this->seedDevice();

        putenv('API_TOKEN=secret-token');
        $_ENV['API_TOKEN'] = 'secret-token';
        $_SERVER['API_TOKEN'] = 'secret-token';

        config(['app.env' => 'production']);

        $payload = [
            'snapshot_id' => (string) Str::uuid(),
            'device_id' => $deviceId,
            'weight_g' => 11,
            'recorded_at' => now('UTC')->toIso8601String(),
        ];

        $response = $this->postJson('/api/v1/device/bowl_snapshots', $payload, [
            'Authorization' => 'Bearer '.$token,
            'X-Api-Token' => 'wrong-token',
        ]);

        $response->assertStatus(403);
        $response->assertContent('');
        $response->assertHeaderMissing('Content-Type');
    }

    private function seedUser(): string
    {
        // テスト専用ユーザーを作成してBearerトークンを返す
        $email = 'device-bowl-snapshots@example.com';
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

        return $tokenId.'|'.$plainToken;
    }

    private function seedDevice(): string
    {
        // テスト専用デバイスを作成する
        $deviceId = (string) Str::uuid();

        DB::table('devices')->where('id', $deviceId)->delete();
        DB::table('devices')->insert([
            'id' => $deviceId,
            'code' => 'device-code-'.uniqid(),
            'name' => 'device-name',
            'created_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ]);

        return $deviceId;
    }

    private function ensureUsersTable(): void
    {
        // 最小構成のusersテーブルを用意する
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
        // 最小構成のpersonal_access_tokensテーブルを用意する
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
        // 最小構成のdevicesテーブルを用意する
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
        // 最小構成のbowl_snapshotsテーブルを用意する
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
