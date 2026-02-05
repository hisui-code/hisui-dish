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

        DB::table('users')->where('email', $email)->delete();

        DB::table('users')->insert([
            'email' => $email,
            'password' => Hash::make($password),
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

        DB::table('users')->where('email', $email)->delete();

        DB::table('users')->insert([
            'email' => $email,
            'password' => Hash::make($password),
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
  email VARCHAR(255),
  password VARCHAR(255),
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
