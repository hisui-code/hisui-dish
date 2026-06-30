<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Tests\TestCase;

class UploadsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // 画像アップロードAPIのテストに必要な最小テーブルを用意する
        // 既にmigration済みの環境では何もしない
        $this->ensureUsersTable();
        $this->ensurePersonalAccessTokensTable();
        $this->ensurePhotosTable();
        $this->ensureDevicesTable();
        $this->ensureHealthLogsTable();
        $this->ensureHealthLogPhotosTable();

        // テストではS3ではなくlocal diskの分岐を検証する
        config(['filesystems.photos_disk' => 'local']);
    }

    public function test_presign_returns_local_upload_response(): void
    {
        // テスト内容:
        // local環境でpresign APIを呼ぶと、Backend経由アップロード用の情報を返す
        //
        // 確認観点:
        // object key はフロントではなくBackendが発行する
        // 保存先はログインユーザー自身の tmp 領域に限定する
        $user = $this->seedUser('uploads-presign@example.com');

        $response = $this->postJson('/api/v1/uploads/presign', [
            'filename' => 'cat.jpg',
            'mime_type' => 'image/jpeg',
            'bytes' => 1024,
        ], [
            'Authorization' => 'Bearer '.$user['token'],
        ]);

        // local disk では直接PUT URLではなく、Backend upload APIへ送る情報を返す
        $response->assertStatus(200);
        $response->assertJsonPath('upload.disk', 'local');
        $response->assertJsonPath('upload.method', 'POST');

        // object key はログインユーザー配下に固定される
        $this->assertStringStartsWith('users/'.$user['id'].'/tmp/', $response->json('upload.objectKey'));
        $this->assertStringEndsWith('.jpg', $response->json('upload.objectKey'));

        // フロントはこのURLに画像本体をPOSTする
        $this->assertStringEndsWith('/api/v1/uploads/local', $response->json('upload.url'));
    }

    public function test_presign_invalid_mime_type_returns_validation_error(): void
    {
        // テスト内容:
        // 許可していないMIME typeはpresign時点で拒否する
        //
        // 確認観点:
        // storageに保存する前に画像形式を制限する
        // gifなど未対応形式をobject key発行前に止める
        $user = $this->seedUser('uploads-presign-invalid@example.com');

        $response = $this->postJson('/api/v1/uploads/presign', [
            'filename' => 'cat.gif',
            'mime_type' => 'image/gif',
            'bytes' => 1024,
        ], [
            'Authorization' => 'Bearer '.$user['token'],
        ]);

        // FormRequestのmime_type validationで422になる
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['mime_type']);
    }

    public function test_local_upload_stores_file_for_own_object_key(): void
    {
        // テスト内容:
        // 認証ユーザー自身のobject keyであればlocal diskへ保存できる
        //
        // 確認観点:
        // presignで発行された想定のユーザー領域だけに画像本体を保存する
        Storage::fake('local');

        $user = $this->seedUser('uploads-local@example.com');
        $objectKey = 'users/'.$user['id'].'/tmp/'.Str::uuid().'.jpg';

        // UploadedFile::fake で実ファイルなしにmultipart uploadを再現する
        $file = UploadedFile::fake()->create('cat.jpg', 8, 'image/jpeg');

        $response = $this->post('/api/v1/uploads/local', [
            'object_key' => $objectKey,
            'file' => $file,
        ], [
            'Authorization' => 'Bearer '.$user['token'],
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('upload.disk', 'local');
        $response->assertJsonPath('upload.objectKey', $objectKey);
        $response->assertJsonPath('upload.originalName', 'cat.jpg');

        // complete APIが後で参照できるよう、同じobject keyに実体が保存される
        $this->assertTrue(Storage::disk('local')->exists($objectKey));
    }

    public function test_local_upload_rejects_other_user_object_key(): void
    {
        // テスト内容:
        // 他ユーザー領域のobject keyではlocal uploadできない
        //
        // 確認観点:
        // User A が User B の保存領域へ画像を書き込めないようにする
        Storage::fake('local');

        $user = $this->seedUser('uploads-local-user@example.com');
        $otherUser = $this->seedUser('uploads-local-other@example.com');
        $objectKey = 'users/'.$otherUser['id'].'/tmp/'.Str::uuid().'.jpg';
        $file = UploadedFile::fake()->create('cat.jpg', 8, 'image/jpeg');

        $response = $this->post('/api/v1/uploads/local', [
            'object_key' => $objectKey,
            'file' => $file,
        ], [
            'Authorization' => 'Bearer '.$user['token'],
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'error' => 'invalid object key',
        ]);

        // 拒否された場合はstorageにも保存しない
        $this->assertFalse(Storage::disk('local')->exists($objectKey));
    }

    public function test_complete_creates_photo_metadata_after_storage_exists(): void
    {
        // テスト内容:
        // storage上に画像実体が存在する場合、complete APIでphotosへメタデータを保存する
        //
        // 確認観点:
        // DBには画像本体ではなく、disk/object_keyなどのメタデータだけを保存する
        // storage実体がある画像だけをcompleted扱いにする
        Storage::fake('local');

        $user = $this->seedUser('uploads-complete@example.com');
        $objectKey = 'users/'.$user['id'].'/tmp/'.Str::uuid().'.jpg';
        $content = 'jpeg-bytes';

        // 先にupload済みの状態を作る
        Storage::disk('local')->put($objectKey, $content);

        $response = $this->postJson('/api/v1/uploads/complete', [
            'disk' => 'local',
            'object_key' => $objectKey,
            'original_name' => 'cat.jpg',
            'mime_type' => 'image/jpeg',
            'bytes' => strlen($content),
        ], [
            'Authorization' => 'Bearer '.$user['token'],
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('photo.disk', 'local');
        $response->assertJsonPath('photo.objectKey', $objectKey);
        $response->assertJsonPath('photo.originalName', 'cat.jpg');
        $response->assertJsonPath('photo.mimeType', 'image/jpeg');
        $response->assertJsonPath('photo.bytes', strlen($content));
        $response->assertJsonPath('photo.status', 'completed');

        // photosテーブルには画像メタデータだけが保存される
        $this->assertDatabaseHas('photos', [
            'user_id' => $user['id'],
            'disk' => 'local',
            'object_key' => $objectKey,
            'original_name' => 'cat.jpg',
            'mime_type' => 'image/jpeg',
            'bytes' => strlen($content),
            'visibility' => 'private',
            'status' => 'completed',
        ]);
    }

    public function test_complete_rejects_missing_storage_object(): void
    {
        // テスト内容:
        // storageに画像実体がない場合、complete APIは失敗する
        //
        // 確認観点:
        // DBにだけ存在する壊れた写真メタデータを作らない
        Storage::fake('local');

        $user = $this->seedUser('uploads-complete-missing@example.com');
        $objectKey = 'users/'.$user['id'].'/tmp/'.Str::uuid().'.jpg';

        $response = $this->postJson('/api/v1/uploads/complete', [
            'disk' => 'local',
            'object_key' => $objectKey,
            'original_name' => 'cat.jpg',
            'mime_type' => 'image/jpeg',
            'bytes' => 1024,
        ], [
            'Authorization' => 'Bearer '.$user['token'],
        ]);

        $response->assertStatus(404);
        $response->assertJson([
            'error' => 'object not found',
        ]);

        // 失敗時はphotosレコードを作らない
        $this->assertDatabaseMissing('photos', [
            'disk' => 'local',
            'object_key' => $objectKey,
        ]);
    }

    public function test_complete_rejects_other_user_object_key(): void
    {
        // テスト内容:
        // 他ユーザー領域のobject keyはcompleteできない
        //
        // 確認観点:
        // User A が User B の画像を自分の写真メタデータとして確定できないようにする
        Storage::fake('local');

        $user = $this->seedUser('uploads-complete-user@example.com');
        $otherUser = $this->seedUser('uploads-complete-other@example.com');
        $objectKey = 'users/'.$otherUser['id'].'/tmp/'.Str::uuid().'.jpg';

        Storage::disk('local')->put($objectKey, 'jpeg-bytes');

        $response = $this->postJson('/api/v1/uploads/complete', [
            'disk' => 'local',
            'object_key' => $objectKey,
            'original_name' => 'cat.jpg',
            'mime_type' => 'image/jpeg',
            'bytes' => strlen('jpeg-bytes'),
        ], [
            'Authorization' => 'Bearer '.$user['token'],
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'error' => 'invalid object key',
        ]);

        $this->assertDatabaseMissing('photos', [
            'disk' => 'local',
            'object_key' => $objectKey,
        ]);
    }

    public function test_complete_rejects_size_mismatch(): void
    {
        // テスト内容:
        // 申告サイズとstorage上の実サイズが違う場合はcompleteできない
        //
        // 確認観点:
        // 改ざん、途中アップロード、別ファイル差し替えを検知してDB確定を防ぐ
        Storage::fake('local');

        $user = $this->seedUser('uploads-complete-size@example.com');
        $objectKey = 'users/'.$user['id'].'/tmp/'.Str::uuid().'.jpg';

        Storage::disk('local')->put($objectKey, 'actual-bytes');

        $response = $this->postJson('/api/v1/uploads/complete', [
            'disk' => 'local',
            'object_key' => $objectKey,
            'original_name' => 'cat.jpg',
            'mime_type' => 'image/jpeg',
            'bytes' => 1,
        ], [
            'Authorization' => 'Bearer '.$user['token'],
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'error' => 'file size mismatch',
        ]);

        $this->assertDatabaseMissing('photos', [
            'disk' => 'local',
            'object_key' => $objectKey,
        ]);
    }

    public function test_complete_deletes_object_when_actual_size_is_too_large(): void
    {
        // テスト内容:
        // storage上の実ファイルサイズが上限を超える場合、objectを削除してcompleteを拒否する
        //
        // 確認観点:
        // presign後に大きいファイルへ差し替えられても、不正なobjectをstorageに残さない
        Storage::fake('local');

        $user = $this->seedUser('uploads-complete-large@example.com');
        $objectKey = 'users/'.$user['id'].'/tmp/'.Str::uuid().'.jpg';

        // requestのbytes上限は通しつつ、storage実体だけを10MB超にする
        Storage::disk('local')->put($objectKey, str_repeat('a', 10485761));

        $response = $this->postJson('/api/v1/uploads/complete', [
            'disk' => 'local',
            'object_key' => $objectKey,
            'original_name' => 'cat.jpg',
            'mime_type' => 'image/jpeg',
            'bytes' => 10485760,
        ], [
            'Authorization' => 'Bearer '.$user['token'],
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'error' => 'file too large',
        ]);

        // 上限超過のobjectは後始末として削除される
        $this->assertFalse(Storage::disk('local')->exists($objectKey));
    }

    public function test_download_url_allows_authenticated_user_for_other_user_photo(): void
    {
        // テスト内容:
        // 完了済み画像はログインユーザーなら所有者以外でも表示URLを取得できる
        //
        // 確認観点:
        // 画像の参照は全ロール許可という現仕様を固定する
        // 削除権限とは分けて考える
        $owner = $this->seedUser('photos-owner@example.com');
        $viewer = $this->seedUser('photos-viewer@example.com');

        $photoId = $this->seedPhoto($owner['id'], [
            'object_key' => 'users/'.$owner['id'].'/tmp/'.Str::uuid().'.jpg',
        ]);

        $response = $this->get('/api/v1/photos/'.$photoId.'/download-url', [
            'Authorization' => 'Bearer '.$viewer['token'],
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'download' => ['url', 'expiresAt'],
        ]);

        // local diskの場合はBackend配信用の署名付きURLが返る
        $this->assertStringContainsString('/api/v1/photos/'.$photoId.'/content', $response->json('download.url'));
    }

    public function test_download_url_rejects_pending_photo(): void
    {
        // テスト内容:
        // 完了前の画像は表示URLを発行しない
        //
        // 確認観点:
        // upload途中や失敗状態の画像を画面に表示しない
        $user = $this->seedUser('photos-pending@example.com');

        $photoId = $this->seedPhoto($user['id'], [
            'object_key' => 'users/'.$user['id'].'/tmp/'.Str::uuid().'.jpg',
            'status' => 'pending',
        ]);

        $response = $this->get('/api/v1/photos/'.$photoId.'/download-url', [
            'Authorization' => 'Bearer '.$user['token'],
        ]);

        $response->assertStatus(409);
        $response->assertJson([
            'error' => 'photo is not completed',
        ]);
    }

    public function test_content_returns_local_file_with_signed_url(): void
    {
        // テスト内容:
        // 署名付きURLでlocal diskの画像本体を取得できる
        //
        // 確認観点:
        // local diskは直接公開せず、Backendの署名付きURL経由でだけ配信する
        Storage::fake('local');

        $user = $this->seedUser('photos-content@example.com');
        $objectKey = 'users/'.$user['id'].'/tmp/'.Str::uuid().'.jpg';

        $photoId = $this->seedPhoto($user['id'], [
            'object_key' => $objectKey,
            'mime_type' => 'image/jpeg',
            'original_name' => 'cat.jpg',
        ]);

        Storage::disk('local')->put($objectKey, 'jpeg-bytes');

        // download-url APIが内部で返すURLと同じ署名形式をテスト内で作る
        $signedUrl = URL::temporarySignedRoute(
            'api.v1.photos.content',
            now('UTC')->addMinutes(10),
            ['photo' => $photoId],
        );

        $response = $this->get($this->pathAndQueryFromUrl($signedUrl));

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'image/jpeg');
    }

    public function test_content_requires_valid_signature(): void
    {
        // テスト内容:
        // 署名なしでは画像本体を取得できない
        //
        // 確認観点:
        // photos/{photo}/content を推測されても、署名なしでは直接表示できないようにする
        $user = $this->seedUser('photos-content-signature@example.com');

        $photoId = $this->seedPhoto($user['id'], [
            'object_key' => 'users/'.$user['id'].'/tmp/'.Str::uuid().'.jpg',
        ]);

        $response = $this->get('/api/v1/photos/'.$photoId.'/content');

        $response->assertStatus(403);
    }

    public function test_photo_owner_can_delete_photo(): void
    {
        // テスト内容:
        // アップロードした本人は画像を削除できる
        //
        // 確認観点:
        // photos レコード、health_log_photos の紐付け、storage object が削除される
        Storage::fake('local');

        $owner = $this->seedUser('photos-delete-owner@example.com');
        $objectKey = 'users/'.$owner['id'].'/tmp/'.Str::uuid().'.jpg';
        $photoId = $this->seedPhoto($owner['id'], [
            'object_key' => $objectKey,
        ]);
        $healthLogId = $this->seedHealthLogWithPhoto($photoId);

        Storage::disk('local')->put($objectKey, 'jpeg-bytes');

        $response = $this->delete('/api/v1/photos/'.$photoId, [], [
            'Authorization' => 'Bearer '.$owner['token'],
        ]);

        $response->assertStatus(204);

        $this->assertDatabaseMissing('photos', [
            'id' => $photoId,
        ]);
        $this->assertDatabaseMissing('health_log_photos', [
            'health_log_id' => $healthLogId,
            'photo_id' => $photoId,
        ]);
        $this->assertFalse(Storage::disk('local')->exists($objectKey));
    }

    public function test_admin_can_delete_other_user_photo(): void
    {
        // テスト内容:
        // adminは他ユーザーがアップロードした画像を削除できる
        //
        // 確認観点:
        // 削除権限は所有者本人またはadminに限定する
        Storage::fake('local');

        $owner = $this->seedUser('photos-delete-owner-by-admin@example.com');
        $admin = $this->seedUser('photos-delete-admin@example.com', 'admin');
        $objectKey = 'users/'.$owner['id'].'/tmp/'.Str::uuid().'.jpg';
        $photoId = $this->seedPhoto($owner['id'], [
            'object_key' => $objectKey,
        ]);

        Storage::disk('local')->put($objectKey, 'jpeg-bytes');

        $response = $this->delete('/api/v1/photos/'.$photoId, [], [
            'Authorization' => 'Bearer '.$admin['token'],
        ]);

        $response->assertStatus(204);

        $this->assertDatabaseMissing('photos', [
            'id' => $photoId,
        ]);
        $this->assertFalse(Storage::disk('local')->exists($objectKey));
    }

    public function test_non_owner_cannot_delete_other_user_photo(): void
    {
        // テスト内容:
        // 一般ユーザーは他ユーザーの画像を削除できない
        //
        // 確認観点:
        // 権限不足時はDBとstorageのどちらも変更しない
        Storage::fake('local');

        $owner = $this->seedUser('photos-delete-owner-forbidden@example.com');
        $viewer = $this->seedUser('photos-delete-viewer-forbidden@example.com');
        $objectKey = 'users/'.$owner['id'].'/tmp/'.Str::uuid().'.jpg';
        $photoId = $this->seedPhoto($owner['id'], [
            'object_key' => $objectKey,
        ]);

        Storage::disk('local')->put($objectKey, 'jpeg-bytes');

        $response = $this->delete('/api/v1/photos/'.$photoId, [], [
            'Authorization' => 'Bearer '.$viewer['token'],
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'error' => 'forbidden',
        ]);

        $this->assertDatabaseHas('photos', [
            'id' => $photoId,
        ]);
        $this->assertTrue(Storage::disk('local')->exists($objectKey));
    }

    public function test_photo_delete_removes_metadata_even_when_storage_object_is_missing(): void
    {
        // テスト内容:
        // storage object が既に存在しない画像でも削除APIは成功する
        //
        // 確認観点:
        // object欠落時も壊れたphotosメタデータを削除できる
        Storage::fake('local');

        $owner = $this->seedUser('photos-delete-missing-object@example.com');
        $objectKey = 'users/'.$owner['id'].'/tmp/'.Str::uuid().'.jpg';
        $photoId = $this->seedPhoto($owner['id'], [
            'object_key' => $objectKey,
        ]);

        $response = $this->delete('/api/v1/photos/'.$photoId, [], [
            'Authorization' => 'Bearer '.$owner['token'],
        ]);

        $response->assertStatus(204);

        $this->assertDatabaseMissing('photos', [
            'id' => $photoId,
        ]);
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
     * photosテーブルの存在を保証する
     */
    private function ensurePhotosTable(): void
    {
        // テスト環境でphotosテーブルが無い場合のみ作成する
        $row = DB::selectOne("SELECT to_regclass('public.photos') as name");
        $exists = $row && $row->name !== null;

        if ($exists) {
            return;
        }

        DB::statement(<<<'SQL'
            CREATE TABLE IF NOT EXISTS photos (
                id UUID PRIMARY KEY,
                user_id BIGINT,
                disk VARCHAR(50) NOT NULL,
                object_key VARCHAR(1024) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                bytes BIGINT NOT NULL,
                visibility VARCHAR(20) NOT NULL DEFAULT 'private',
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                created_at TIMESTAMPTZ,
                updated_at TIMESTAMPTZ,
                UNIQUE (disk, object_key)
            )
        SQL);
    }

    /**
     * devicesテーブルの存在を保証する
     */
    private function ensureDevicesTable(): void
    {
        // health_logs の device_id 外部キーを満たすため、devices を最小構成で補完する
        $row = DB::selectOne("SELECT to_regclass('public.devices') as name");
        $exists = $row && $row->name !== null;

        if ($exists) {
            return;
        }

        DB::statement(<<<'SQL'
            CREATE TABLE IF NOT EXISTS devices (
                id UUID PRIMARY KEY,
                code VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                last_seen_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ,
                updated_at TIMESTAMPTZ
            )
        SQL);
    }

    /**
     * health_logsテーブルの存在を保証する
     */
    private function ensureHealthLogsTable(): void
    {
        // テスト環境でhealth_logsテーブルが無い場合のみ作成する
        $row = DB::selectOne("SELECT to_regclass('public.health_logs') as name");
        $exists = $row && $row->name !== null;

        if ($exists) {
            return;
        }

        DB::statement(<<<'SQL'
            CREATE TABLE IF NOT EXISTS health_logs (
                id UUID PRIMARY KEY,
                device_id UUID,
                type VARCHAR(255) NOT NULL,
                occurred_at TIMESTAMPTZ NOT NULL,
                note TEXT,
                weight_kg NUMERIC(5, 2),
                photos JSON,
                created_at TIMESTAMPTZ,
                updated_at TIMESTAMPTZ
            )
        SQL);
    }

    /**
     * health_log_photosテーブルの存在を保証する
     */
    private function ensureHealthLogPhotosTable(): void
    {
        // テスト環境でhealth_log_photosテーブルが無い場合のみ作成する
        $row = DB::selectOne("SELECT to_regclass('public.health_log_photos') as name");
        $exists = $row && $row->name !== null;

        if ($exists) {
            return;
        }

        DB::statement(<<<'SQL'
            CREATE TABLE IF NOT EXISTS health_log_photos (
                health_log_id UUID NOT NULL,
                photo_id UUID NOT NULL,
                sort_order SMALLINT NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ,
                updated_at TIMESTAMPTZ,
                PRIMARY KEY (health_log_id, photo_id)
            )
        SQL);
    }

    /**
     * 認証付きAPIテスト用ユーザーを作成する
     *
     * @return array{id:int,token:string,email:string}
     */
    private function seedUser(string $email, string $role = 'user'): array
    {
        // 再実行時に同じメールアドレスが残っていても作り直せるよう削除する
        DB::table('users')->where('email', $email)->delete();

        $plainToken = Str::random(40);

        $userId = DB::table('users')->insertGetId([
            'name' => 'upload test user',
            'email' => $email,
            'password' => password_hash('password', PASSWORD_BCRYPT),
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

    /**
     * 画像メタデータを作成する
     */
    private function seedPhoto(int $userId, array $overrides = []): string
    {
        $photoId = (string) Str::uuid();

        // テストごとに上書きしたい項目だけ差し替えられるようにする
        $values = array_merge([
            'id' => $photoId,
            'user_id' => $userId,
            'disk' => 'local',
            'object_key' => 'users/'.$userId.'/tmp/'.Str::uuid().'.jpg',
            'original_name' => 'cat.jpg',
            'mime_type' => 'image/jpeg',
            'bytes' => 10,
            'visibility' => 'private',
            'status' => 'completed',
            'created_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ], $overrides);

        DB::table('photos')->insert($values);

        return $photoId;
    }

    /**
     * テスト用デバイスを作成する
     */
    private function seedDevice(): string
    {
        $deviceId = (string) Str::uuid();

        DB::table('devices')->insert([
            'id' => $deviceId,
            'code' => 'uploads-test-'.Str::uuid(),
            'name' => 'uploads test device',
            'last_seen_at' => null,
            'created_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ]);

        return $deviceId;
    }

    /**
     * 健康記録と画像の紐付けを作成する
     */
    private function seedHealthLogWithPhoto(string $photoId): string
    {
        $healthLogId = (string) Str::uuid();
        $now = now('UTC');

        DB::table('health_logs')->insert([
            'id' => $healthLogId,
            'device_id' => $this->seedDevice(),
            'type' => 'other',
            'occurred_at' => $now,
            'note' => 'photo delete test',
            'weight_kg' => null,
            'photos' => json_encode([]),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('health_log_photos')->insert([
            'health_log_id' => $healthLogId,
            'photo_id' => $photoId,
            'sort_order' => 0,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return $healthLogId;
    }

    /**
     * 絶対URLからテストリクエスト用のpathとqueryを取り出す
     */
    private function pathAndQueryFromUrl(string $url): string
    {
        // Laravelのget()は絶対URLではなくアプリ内pathを渡すため、URLを分解する
        $path = parse_url($url, PHP_URL_PATH);
        $query = parse_url($url, PHP_URL_QUERY);

        return $path.($query ? '?'.$query : '');
    }
}
