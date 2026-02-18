<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureUsersTable();
        $this->ensurePersonalAccessTokensTable();
    }

    public function test_login_success_returns_token_and_email(): void
    {
        $email = 'login-success@example.com';
        $password = 'password';

        // テストごとに対象ユーザーを作り直して前回実行の影響を除外
        DB::table('users')->where('email', $email)->delete();

        DB::table('users')->insert([
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'user',
            'created_at' => now('Asia/Tokyo'),
            'updated_at' => now('Asia/Tokyo'),
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => $email,
            'password' => $password,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'body' => [
                'email' => $email,
            ],
        ]);

        // 返却トークンの形式とDB保存値の整合を検証
        $token = $response->json('auth_token');
        $this->assertIsString($token);
        $this->assertNotSame('', $token);

        [$tokenId, $plainToken] = explode('|', $token, 2);
        $this->assertNotSame('', $tokenId);
        $this->assertNotSame('', $plainToken);

        $userId = DB::table('users')->where('email', $email)->value('id');
        $stored = DB::table('personal_access_tokens')->where('id', (int) $tokenId)->first();
        $this->assertNotNull($stored);
        $this->assertSame('App\\Models\\User', $stored->tokenable_type);
        $this->assertSame((int) $userId, (int) $stored->tokenable_id);
        $this->assertSame(hash('sha256', $plainToken), $stored->token);
    }

    public function test_login_invalid_credentials_returns_unauthorized(): void
    {
        $email = 'login-failure@example.com';
        $password = 'password';

        // テストごとに対象ユーザーを作り直して前回実行の影響を除外
        DB::table('users')->where('email', $email)->delete();

        DB::table('users')->insert([
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'user',
            'created_at' => now('Asia/Tokyo'),
            'updated_at' => now('Asia/Tokyo'),
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => $email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401);
        $response->assertJson([
            'error' => 'invalid_credentials',
        ]);
    }

    public function test_login_allows_multiple_active_tokens_for_same_user(): void
    {
        $email = 'multi-device-login@example.com';
        $password = 'password';

        // 同一ユーザーで複数回ログインできる前提を作るため対象ユーザーを作り直す
        DB::table('users')->where('email', $email)->delete();

        DB::table('users')->insert([
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'user',
            'created_at' => now('Asia/Tokyo'),
            'updated_at' => now('Asia/Tokyo'),
        ]);

        // 端末Aのログインを模擬して1つ目のトークンを発行する
        $firstLoginResponse = $this->postJson('/api/v1/login', [
            'email' => $email,
            'password' => $password,
        ]);
        $firstLoginResponse->assertStatus(200);
        $firstToken = (string) $firstLoginResponse->json('auth_token');

        // 端末Bのログインを模擬して2つ目のトークンを発行する
        $secondLoginResponse = $this->postJson('/api/v1/login', [
            'email' => $email,
            'password' => $password,
        ]);
        $secondLoginResponse->assertStatus(200);
        $secondToken = (string) $secondLoginResponse->json('auth_token');

        // 別端末ログインでトークンが置き換えられていないことを確認する
        $this->assertNotSame($firstToken, $secondToken);

        $userId = DB::table('users')->where('email', $email)->value('id');
        $tokenCount = DB::table('personal_access_tokens')
            ->where('tokenable_type', 'App\\Models\\User')
            ->where('tokenable_id', (int) $userId)
            ->count();
        $this->assertSame(2, $tokenCount);

        // どちらのトークンでも認証APIにアクセスできることを確認する
        $firstMeResponse = $this->get('/api/v1/me', [
            'Authorization' => 'Bearer '.$firstToken,
        ]);
        $firstMeResponse->assertStatus(200);

        $secondMeResponse = $this->get('/api/v1/me', [
            'Authorization' => 'Bearer '.$secondToken,
        ]);
        $secondMeResponse->assertStatus(200);
    }

    public function test_logout_revokes_current_token_and_returns_no_content(): void
    {
        $email = 'logout-success@example.com';
        $password = 'password';

        // ログイン対象ユーザーを毎回作り直して再現性を担保
        DB::table('users')->where('email', $email)->delete();

        DB::table('users')->insert([
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'user',
            'created_at' => now('Asia/Tokyo'),
            'updated_at' => now('Asia/Tokyo'),
        ]);

        $loginResponse = $this->postJson('/api/v1/login', [
            'email' => $email,
            'password' => $password,
        ]);

        $loginResponse->assertStatus(200);

        // 発行済みトークンIDを保持してログアウト後の削除有無を確認
        $token = (string) $loginResponse->json('auth_token');
        [$tokenId] = explode('|', $token, 2);

        $logoutResponse = $this->postJson('/api/v1/logout', [], [
            'Authorization' => "Bearer {$token}",
        ]);

        $logoutResponse->assertNoContent();

        // 現在トークンが失効してDBから消えることを検証
        $stored = DB::table('personal_access_tokens')->where('id', (int) $tokenId)->first();
        $this->assertNull($stored);
    }

    public function test_logout_requires_authentication(): void
    {
        // Authorizationなしではログアウトできないことを検証
        $response = $this->postJson('/api/v1/logout');

        $response->assertStatus(401);
        $response->assertJson([
            'error' => 'unauthorized',
        ]);
    }

    public function test_login_requires_api_token_in_production(): void
    {
        putenv('API_TOKEN=secret-token');
        $_ENV['API_TOKEN'] = 'secret-token';
        $_SERVER['API_TOKEN'] = 'secret-token';

        config(['app.env' => 'production']);

        $response = $this->post('/api/v1/login', [
            'email' => 'login-success@example.com',
            'password' => 'password',
        ], [
            'X-Api-Token' => 'wrong-token',
        ]);

        $response->assertStatus(403);
        $response->assertContent('');
        $response->assertHeaderMissing('Content-Type');
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
}
