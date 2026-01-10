<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class LoginTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureUsersTable();
    }

    public function test_login_success_returns_token_and_email(): void
    {
        $email = 'login-success@example.com';
        $password = 'password';

        DB::table('users')->where('email', $email)->delete();

        DB::table('users')->insert([
            'email' => $email,
            'password_digest' => password_hash($password, PASSWORD_BCRYPT),
            'auth_token' => null,
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

        $storedToken = DB::table('users')->where('email', $email)->value('auth_token');
        $this->assertSame($token, $storedToken);
    }

    public function test_login_invalid_credentials_returns_unauthorized(): void
    {
        $email = 'login-failure@example.com';
        $password = 'password';

        DB::table('users')->where('email', $email)->delete();

        DB::table('users')->insert([
            'email' => $email,
            'password_digest' => password_hash($password, PASSWORD_BCRYPT),
            'auth_token' => null,
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
  password_digest VARCHAR(255),
  auth_token VARCHAR(255),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SQL);
    }
}
