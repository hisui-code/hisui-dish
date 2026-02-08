<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class UsersTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureUsersTable();
        $this->ensurePersonalAccessTokensTable();
    }

    public function test_users_index_success_for_admin(): void
    {
        // adminでログインし、一般ユーザーも1件作って一覧取得対象を用意する
        $admin = $this->seedUser('admin', 'users-admin@example.com');
        $this->seedUser('user', 'users-member@example.com');

        // adminトークンで一覧APIを実行する
        $response = $this->get('/api/v1/users', [
            'Authorization' => 'Bearer ' . $admin['token'],
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'users' => [
                ['id', 'name', 'email', 'role', 'updated_at'],
            ],
        ]);
    }

    public function test_users_index_forbidden_for_non_admin(): void
    {
        // 非adminユーザーで一覧APIにアクセスする
        $user = $this->seedUser('user', 'users-non-admin@example.com');

        $response = $this->get('/api/v1/users', [
            'Authorization' => 'Bearer ' . $user['token'],
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'error' => 'forbidden',
        ]);
    }

    public function test_users_update_success(): void
    {
        // adminで対象ユーザーを更新できることを確認する
        $admin = $this->seedUser('admin', 'users-update-admin@example.com');
        $target = $this->seedUser('user', 'users-update-target@example.com');
        $newPassword = 'new-password-123';

        $response = $this->patchJson('/api/v1/users/' . $target['id'], [
            'name' => 'updated user',
            'email' => 'users-updated@example.com',
            'password' => $newPassword,
            'role' => 'guest',
        ], [
            'Authorization' => 'Bearer ' . $admin['token'],
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('user.name', 'updated user');
        $response->assertJsonPath('user.email', 'users-updated@example.com');
        $response->assertJsonPath('user.role', 'guest');

        // パスワードはハッシュ保存されるためHash::checkで検証する
        $stored = DB::table('users')->where('id', $target['id'])->first();
        $this->assertNotNull($stored);
        $this->assertTrue(Hash::check($newPassword, (string) $stored->password));
    }

    public function test_users_update_invalid_role_returns_unprocessable_entity(): void
    {
        // 許可されていないrole値を送って422になることを確認する
        $admin = $this->seedUser('admin', 'users-invalid-role-admin@example.com');
        $target = $this->seedUser('user', 'users-invalid-role-target@example.com');

        $response = $this->patchJson('/api/v1/users/' . $target['id'], [
            'role' => 'invalid-role',
        ], [
            'Authorization' => 'Bearer ' . $admin['token'],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['role']);
    }

    public function test_users_delete_success(): void
    {
        // adminが他ユーザーを削除できることを確認する
        $admin = $this->seedUser('admin', 'users-delete-admin@example.com');
        $target = $this->seedUser('user', 'users-delete-target@example.com');

        $response = $this->delete('/api/v1/users/' . $target['id'], [], [
            'Authorization' => 'Bearer ' . $admin['token'],
        ]);

        $response->assertStatus(204);
        // 削除後にDBから行が消えていることを確認する
        $this->assertFalse(DB::table('users')->where('id', $target['id'])->exists());
    }

    public function test_users_delete_self_returns_conflict(): void
    {
        // 自己削除は運用事故防止のため禁止する
        $admin = $this->seedUser('admin', 'users-self-delete-admin@example.com');

        $response = $this->delete('/api/v1/users/' . $admin['id'], [], [
            'Authorization' => 'Bearer ' . $admin['token'],
        ]);

        $response->assertStatus(409);
        $response->assertJson([
            'error' => 'self_delete_forbidden',
        ]);
    }

    public function test_users_requires_authentication(): void
    {
        // 認証ヘッダなしではusers管理APIに入れない
        $response = $this->get('/api/v1/users');

        $response->assertStatus(401);
        $response->assertJson([
            'error' => 'unauthorized',
        ]);
    }

    public function test_users_requires_api_token_in_production(): void
    {
        // 本番環境ではAPI_TOKENヘッダ一致も必須
        $admin = $this->seedUser('admin', 'users-production-admin@example.com');

        putenv('API_TOKEN=secret-token');
        $_ENV['API_TOKEN'] = 'secret-token';
        $_SERVER['API_TOKEN'] = 'secret-token';

        config(['app.env' => 'production']);

        $response = $this->get('/api/v1/users', [
            'Authorization' => 'Bearer ' . $admin['token'],
            'X-Api-Token' => 'wrong-token',
        ]);

        $response->assertStatus(403);
        $response->assertContent('');
        $response->assertHeaderMissing('Content-Type');
    }

    /**
     * usersテーブルの存在を保証する
     * @return void
     */
    private function ensureUsersTable(): void
    {
        // テスト環境でusersテーブルが無い場合のみ作成する
        $row = DB::selectOne("SELECT to_regclass('public.users') as name");
        $exists = $row && $row->name !== null;

        if ($exists) {
            return;
        }

        DB::statement(<<<SQL
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SQL);
    }

    /**
     * personal_access_tokensテーブルの存在を保証する
     * @return void
     */
    private function ensurePersonalAccessTokensTable(): void
    {
        // テスト環境でpersonal_access_tokensが無い場合のみ作成する
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

    /**
     * 指定ロールのユーザーと認証トークンを作成する
     * @param string $role ユーザーロール
     * @param string $email メールアドレス
     * @return array{id:int,token:string,email:string}
     */
    private function seedUser(string $role, string $email): array
    {
        // 既存ユーザーを消してから作り直し、テストの再実行性を担保する
        $plainToken = Str::random(40);

        DB::table('users')->where('email', $email)->delete();
        $userId = DB::table('users')->insertGetId([
            'name' => 'seed-user',
            'email' => $email,
            'password' => Hash::make('password'),
            'role' => $role,
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

        return [
            'id' => (int) $userId,
            'token' => $tokenId . '|' . $plainToken,
            'email' => $email,
        ];
    }
}
