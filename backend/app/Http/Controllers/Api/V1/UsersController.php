<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserRequest;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersController extends Controller
{
    /**
     * ユーザー一覧を返す
     * @return JsonResponse 一覧レスポンス
     */
    public function index(): JsonResponse
    {
        // 管理画面の一覧表示で使う項目だけを取得する
        $rows = DB::table('users')
            ->orderBy('id')
            ->get(['id', 'name', 'email', 'role', 'updated_at']);

        // DBの生データをAPIレスポンス形式に揃える
        $users = $rows->map(fn ($row) => $this->serializeUser($row))->all();

        return response()->json([
            'users' => $users,
        ], 200);
    }

    /**
     * 指定ユーザーを返す
     * @param Request $request リクエスト
     * @param string $userId ユーザーID
     * @return JsonResponse ユーザー情報
     */
    public function show(Request $request, string $userId): JsonResponse
    {
        // 本人またはadminだけが指定ユーザーを参照できる
        if (!$this->canAccessTargetUser($request, $userId)) {
            return $this->forbidden();
        }

        $user = $this->findUserById($userId);
        if (!$user) {
            return $this->notFound();
        }

        return response()->json([
            'user' => $this->serializeUser($user),
        ], 200);
    }

    /**
     * 指定ユーザーを更新する
     * @param UpdateUserRequest $request リクエスト
     * @param string $userId ユーザーID
     * @return JsonResponse 更新結果
     */
    public function update(UpdateUserRequest $request, string $userId): JsonResponse
    {
        // 本人またはadmin以外の更新を拒否する
        if (!$this->canAccessTargetUser($request, $userId)) {
            return $this->forbidden();
        }

        // 非adminはroleを更新できない
        if (!$this->isAdmin($request) && array_key_exists('role', $request->validated())) {
            return $this->forbidden();
        }

        // 先に対象ユーザーの存在を確認する
        $user = $this->findUserById($userId);
        if (!$user) {
            return $this->notFound();
        }

        // FormRequestで検証済みの値だけを受け取る
        $payload = $request->validated();

        // 更新データの組み立て責務を分離して見通しを良くする
        $updateData = $this->buildUpdateData($payload);
        // 更新時刻はUTCで統一する
        $updateData['updated_at'] = CarbonImmutable::now('UTC')->format('Y-m-d H:i:s.u');

        DB::table('users')->where('id', $userId)->update($updateData);

        // 更新後の最新状態を返すため再取得する
        $updatedUser = $this->findUserById($userId);
        if (!$updatedUser) {
            return $this->notFound();
        }

        return response()->json([
            'user' => $this->serializeUser($updatedUser),
        ], 200);
    }

    /**
     * 指定ユーザーを削除する
     * @param Request $request リクエスト
     * @param string $userId ユーザーID
     * @return JsonResponse 削除結果
     */
    public function destroy(Request $request, string $userId): JsonResponse
    {
        $currentUser = $request->user() ?? Auth::user();
        // 自己削除を禁止して管理者アカウント喪失事故を防ぐ
        if (!$currentUser || (string) $currentUser->id === $userId) {
            return $this->selfDeleteForbidden();
        }

        $deleted = DB::table('users')
            ->where('id', $userId)
            ->delete();

        // 削除対象が存在しない場合は404を返す
        if ($deleted === 0) {
            return $this->notFound();
        }

        return response()->json(null, 204);
    }

    /**
     * レスポンス用にユーザー情報を整形する
     * @param object $user DBから取得したユーザー行
     * @return array{id:int,name:?string,email:string,role:string,updated_at:?string} ユーザー情報
     */
    private function serializeUser(object $user): array
    {
        return [
            'id' => (int) $user->id,
            'name' => $user->name !== null ? (string) $user->name : null,
            'email' => (string) $user->email,
            'role' => (string) $user->role,
            'updated_at' => $this->formatUtcMillis($user->updated_at ?? null),
        ];
    }

    /**
     * 指定IDのユーザーを取得する
     * @param string $userId ユーザーID
     * @return object|null ユーザー行。未存在ならnull
     */
    private function findUserById(string $userId): ?object
    {
        return DB::table('users')
            ->where('id', $userId)
            ->first(['id', 'name', 'email', 'role', 'updated_at']);
    }

    /**
     * 更新可能項目だけを更新用配列に変換する
     * @param array<string,mixed> $payload バリデーション済み入力
     * @return array<string,mixed> DB更新用配列
     */
    private function buildUpdateData(array $payload): array
    {
        $updateData = [];

        if (array_key_exists('name', $payload)) {
            $updateData['name'] = $payload['name'];
        }

        if (array_key_exists('email', $payload)) {
            $updateData['email'] = $payload['email'];
        }

        if (array_key_exists('password', $payload)) {
            // パスワードは平文保存を避けるため必ずハッシュ化する
            $updateData['password'] = Hash::make((string) $payload['password']);
        }

        if (array_key_exists('role', $payload)) {
            $updateData['role'] = $payload['role'];
        }

        return $updateData;
    }

    /**
     * UTCの日時文字列をミリ秒付きISO8601に変換する
     * @param mixed $value 変換対象
     * @return string|null 変換結果
     */
    private function formatUtcMillis(mixed $value): ?string
    {
        if (!is_string($value) || $value === '') {
            return null;
        }
        return CarbonImmutable::parse($value, 'UTC')->utc()->format('Y-m-d\\TH:i:s.v\\Z');
    }

    /**
     * not_foundレスポンスを返す
     * @return JsonResponse エラーレスポンス
     */
    private function notFound(): JsonResponse
    {
        return response()->json([
            'error' => 'not_found',
        ], 404);
    }

    /**
     * 自己削除禁止レスポンスを返す
     * @return JsonResponse エラーレスポンス
     */
    private function selfDeleteForbidden(): JsonResponse
    {
        return response()->json([
            'error' => 'self_delete_forbidden',
        ], 409);
    }

    /**
     * 本人またはadminかを判定する
     * @param Request $request リクエスト
     * @param string $userId 対象ユーザーID
     * @return bool 許可可否
     */
    private function canAccessTargetUser(Request $request, string $userId): bool
    {
        $currentUser = $request->user() ?? Auth::user();
        if (!$currentUser) {
            return false;
        }

        // adminは全ユーザーにアクセス可能
        if ($this->isAdmin($request)) {
            return true;
        }

        // 非adminは本人ID一致時のみアクセス可能
        return (string) $currentUser->id === $userId;
    }

    /**
     * 現在ユーザーがadminかを判定する
     * @param Request $request リクエスト
     * @return bool adminならtrue
     */
    private function isAdmin(Request $request): bool
    {
        $currentUser = $request->user() ?? Auth::user();
        return (bool) $currentUser && isset($currentUser->role) && (string) $currentUser->role === 'admin';
    }

    /**
     * forbiddenレスポンスを返す
     * @return JsonResponse エラーレスポンス
     */
    private function forbidden(): JsonResponse
    {
        return response()->json([
            'error' => 'forbidden',
        ], 403);
    }
}
