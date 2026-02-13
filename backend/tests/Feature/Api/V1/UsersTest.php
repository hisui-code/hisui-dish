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

    // テスト内容: adminはusers一覧を取得できる
    public function test_users_index_success_for_admin(): void
    {
        // 前提: adminと一般ユーザーを作成する
        $admin = $this->seedUser('admin', 'users-admin@example.com');
        $this->seedUser('user', 'users-member@example.com');

        // 実行: adminで一覧APIを呼ぶ
        $response = $this->get('/api/v1/users', [
            'Authorization' => 'Bearer '.$admin['token'],
        ]);

        // 検証: 一覧取得が成功し必要項目を返す
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'users' => [
                ['id', 'name', 'email', 'role', 'updated_at'],
            ],
        ]);
    }

    // テスト内容: 非adminはusers一覧を取得できない
    public function test_users_index_forbidden_for_non_admin(): void
    {
        // 前提: 非adminユーザーを作成する
        $user = $this->seedUser('user', 'users-non-admin@example.com');

        // 実行: 非adminで一覧APIを呼ぶ
        $response = $this->get('/api/v1/users', [
            'Authorization' => 'Bearer '.$user['token'],
        ]);

        // 検証: 権限不足で403を返す
        $response->assertStatus(403);
        $response->assertJson([
            'error' => 'forbidden',
        ]);
    }

    // テスト内容: adminは他ユーザー詳細を取得できる
    public function test_users_show_success_for_admin(): void
    {
        // 前提: adminと参照対象ユーザーを作成する
        $admin = $this->seedUser('admin', 'users-show-admin@example.com');
        $target = $this->seedUser('user', 'users-show-target@example.com');

        // 実行: adminで対象ユーザー詳細を取得する
        $response = $this->get('/api/v1/users/'.$target['id'], [
            'Authorization' => 'Bearer '.$admin['token'],
        ]);

        // 検証: 200で対象ユーザー情報を返す
        $response->assertStatus(200);
        $response->assertJsonPath('user.id', $target['id']);
        $response->assertJsonPath('user.email', $target['email']);
    }

    // テスト観点: 非adminでも自分の詳細は取得できる
    public function test_users_show_success_for_self(): void
    {
        // 前提: 非adminユーザーを作成する
        $user = $this->seedUser('user', 'users-show-self@example.com');

        // 実行: 自分自身の詳細を取得する
        $response = $this->get('/api/v1/users/'.$user['id'], [
            'Authorization' => 'Bearer '.$user['token'],
        ]);

        // 検証: 200で自己ユーザー情報を返す
        $response->assertStatus(200);
        $response->assertJsonPath('user.id', $user['id']);
        $response->assertJsonPath('user.email', $user['email']);
    }

    // テスト内容: 非adminは他ユーザー詳細を取得できない
    public function test_users_show_forbidden_for_non_admin_other_user(): void
    {
        // 前提: 非adminユーザーと別ユーザーを作成する
        $user = $this->seedUser('user', 'users-show-non-admin@example.com');
        $target = $this->seedUser('guest', 'users-show-other@example.com');

        // 実行: 非adminで他ユーザー詳細を取得する
        $response = $this->get('/api/v1/users/'.$target['id'], [
            'Authorization' => 'Bearer '.$user['token'],
        ]);

        // 検証: 権限不足で403を返す
        $response->assertStatus(403);
        $response->assertJson([
            'error' => 'forbidden',
        ]);
    }

    // テスト内容: adminは他ユーザー情報を更新できる
    public function test_users_update_success(): void
    {
        // 前提: adminと更新対象ユーザーを作成する
        $admin = $this->seedUser('admin', 'users-update-admin@example.com');
        $target = $this->seedUser('user', 'users-update-target@example.com');
        $newPassword = 'new-password-123';
        $updatedEmail = 'users-updated-'.Str::lower(Str::random(8)).'@example.com';

        // 実行: adminで他ユーザー情報を更新する
        $response = $this->patchJson('/api/v1/users/'.$target['id'], [
            'name' => 'updated user',
            'email' => $updatedEmail,
            'password' => $newPassword,
            'role' => 'guest',
        ], [
            'Authorization' => 'Bearer '.$admin['token'],
        ]);

        // 検証: 200で更新後の値を返す
        $response->assertStatus(200);
        $response->assertJsonPath('user.name', 'updated user');
        $response->assertJsonPath('user.email', $updatedEmail);
        $response->assertJsonPath('user.role', 'guest');

        // 検証: パスワードはハッシュ化して保存される
        $stored = DB::table('users')->where('id', $target['id'])->first();
        $this->assertNotNull($stored);
        $this->assertTrue(Hash::check($newPassword, (string) $stored->password));
    }

    // テスト内容: 非adminでも自分のname emailは更新できる
    public function test_users_update_success_for_self_without_role(): void
    {
        // 前提: 非adminユーザーを作成する
        $user = $this->seedUser('user', 'users-update-self@example.com');
        $updatedEmail = 'users-self-updated-'.Str::lower(Str::random(8)).'@example.com';

        // 実行: 非adminで自分自身のnameとemailを更新する
        $response = $this->patchJson('/api/v1/users/'.$user['id'], [
            'name' => 'self updated',
            'email' => $updatedEmail,
        ], [
            'Authorization' => 'Bearer '.$user['token'],
        ]);

        // 検証: 200で自己更新が成功しroleは維持される
        $response->assertStatus(200);
        $response->assertJsonPath('user.id', $user['id']);
        $response->assertJsonPath('user.name', 'self updated');
        $response->assertJsonPath('user.email', $updatedEmail);
        $response->assertJsonPath('user.role', 'user');
    }

    // テスト内容: 非adminは他ユーザー情報を更新できない
    public function test_users_update_forbidden_for_non_admin_other_user(): void
    {
        // 前提: 非adminユーザーと別ユーザーを作成する
        $user = $this->seedUser('user', 'users-update-non-admin@example.com');
        $target = $this->seedUser('guest', 'users-update-other@example.com');

        // 実行: 非adminで他ユーザーを更新する
        $response = $this->patchJson('/api/v1/users/'.$target['id'], [
            'name' => 'forbidden update',
        ], [
            'Authorization' => 'Bearer '.$user['token'],
        ]);

        // 検証: 権限不足で403を返す
        $response->assertStatus(403);
        $response->assertJson([
            'error' => 'forbidden',
        ]);
    }

    // テスト内容: 非adminは自分でもroleを更新できない
    public function test_users_update_role_forbidden_for_non_admin_self(): void
    {
        // 前提: 非adminユーザーを作成する
        $user = $this->seedUser('user', 'users-update-role-self@example.com');

        // 実行: 非adminで自分自身のrole更新を試みる
        $response = $this->patchJson('/api/v1/users/'.$user['id'], [
            'role' => 'guest',
        ], [
            'Authorization' => 'Bearer '.$user['token'],
        ]);

        // 検証: role更新は拒否され403を返す
        $response->assertStatus(403);
        $response->assertJson([
            'error' => 'forbidden',
        ]);
    }

    // テスト内容: 不正なrole値は422で弾かれる
    public function test_users_update_invalid_role_returns_unprocessable_entity(): void
    {
        // 前提: adminと更新対象ユーザーを作成する
        $admin = $this->seedUser('admin', 'users-invalid-role-admin@example.com');
        $target = $this->seedUser('user', 'users-invalid-role-target@example.com');

        // 実行: 許可されていないrole値で更新する
        $response = $this->patchJson('/api/v1/users/'.$target['id'], [
            'role' => 'invalid-role',
        ], [
            'Authorization' => 'Bearer '.$admin['token'],
        ]);

        // 検証: バリデーションエラーで422を返す
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['role']);
    }

    // テスト内容: adminは他ユーザーを削除できる
    public function test_users_delete_success(): void
    {
        // 前提: adminと削除対象ユーザーを作成する
        $admin = $this->seedUser('admin', 'users-delete-admin@example.com');
        $target = $this->seedUser('user', 'users-delete-target@example.com');

        // 実行: adminで対象ユーザーを削除する
        $response = $this->delete('/api/v1/users/'.$target['id'], [], [
            'Authorization' => 'Bearer '.$admin['token'],
        ]);

        // 検証: 204を返しDBから削除される
        $response->assertStatus(204);
        $this->assertFalse(DB::table('users')->where('id', $target['id'])->exists());
    }

    // テスト内容: 自己削除は禁止される
    public function test_users_delete_self_returns_conflict(): void
    {
        // 前提: adminユーザーを作成する
        $admin = $this->seedUser('admin', 'users-self-delete-admin@example.com');

        // 実行: 自分自身の削除を試みる
        $response = $this->delete('/api/v1/users/'.$admin['id'], [], [
            'Authorization' => 'Bearer '.$admin['token'],
        ]);

        // 検証: 自己削除は禁止され409を返す
        $response->assertStatus(409);
        $response->assertJson([
            'error' => 'self_delete_forbidden',
        ]);
    }

    // テスト内容: 認証なしではusers一覧にアクセスできない
    public function test_users_requires_authentication(): void
    {
        // 実行: 認証ヘッダなしでusers一覧APIを呼ぶ
        $response = $this->get('/api/v1/users');

        // 検証: 未認証で401を返す
        $response->assertStatus(401);
        $response->assertJson([
            'error' => 'unauthorized',
        ]);
    }

    // テスト内容: 本番環境ではX-Api-Token不一致で拒否される
    public function test_users_requires_api_token_in_production(): void
    {
        // 前提: adminユーザーと本番向けAPI_TOKEN環境を用意する
        $admin = $this->seedUser('admin', 'users-production-admin@example.com');

        putenv('API_TOKEN=secret-token');
        $_ENV['API_TOKEN'] = 'secret-token';
        $_SERVER['API_TOKEN'] = 'secret-token';

        config(['app.env' => 'production']);

        // 実行: 不一致なX-Api-Tokenで一覧APIを呼ぶ
        $response = $this->get('/api/v1/users', [
            'Authorization' => 'Bearer '.$admin['token'],
            'X-Api-Token' => 'wrong-token',
        ]);

        // 検証: 403で空レスポンスを返す
        $response->assertStatus(403);
        $response->assertContent('');
        $response->assertHeaderMissing('Content-Type');
    }

    /**
     * usersテーブルの存在を保証する
     */
    private function ensureUsersTable(): void
    {
        // テスト環境でusersテーブルが無い場合のみ作成する
        $row = DB::selectOne("SELECT to_regclass('public.users') as name");
        $exists = $row && $row->name !== null;

        if ($exists) {
            return;
        }

        DB::statement(<<<'SQL'
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
     */
    private function ensurePersonalAccessTokensTable(): void
    {
        // テスト環境でpersonal_access_tokensが無い場合のみ作成する
        $row = DB::selectOne("SELECT to_regclass('public.personal_access_tokens') as name");
        $exists = $row && $row->name !== null;

        if ($exists) {
            return;
        }

        DB::statement(<<<'SQL'
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
     *
     * @param  string  $role  ユーザーロール
     * @param  string  $email  メールアドレス
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
            'token' => $tokenId.'|'.$plainToken,
            'email' => $email,
        ];
    }
}
