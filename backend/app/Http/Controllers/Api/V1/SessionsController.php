<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateSessionRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * セッション（ログイン）用のAPIコントローラ
 *
 * - email / password を受け取り、ユーザーを認証する
 * - 認証に成功したら auth_token を返す
 */
class SessionsController extends Controller
{
    /**
     * ログイン処理
     *
     * @param  CreateSessionRequest  $request  リクエスト
     * @return JsonResponse ログイン結果
     */
    public function create(CreateSessionRequest $request): JsonResponse
    {
        // FormRequestで検証済みの資格情報のみを受け取る
        $validated = $request->validated();

        // 資格情報チェック
        if (! Auth::attempt($validated)) {
            return $this->invalidCredentials();
        }

        // 認証成功後に認証済みユーザーを取得する
        // 取得できない異常系は資格情報エラーとして扱い処理を打ち切る
        $user = $request->user() ?? Auth::user();
        if (! $user) {
            return $this->invalidCredentials();
        }

        // Sanctum トークンを発行
        $token = $user->createToken('web-login')->plainTextToken;

        return response()->json([
            'auth_token' => $token,
            'body' => [
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ], 200);
    }

    /**
     * ログアウト処理
     *
     * Authorizationヘッダーの現在トークンだけを失効する
     */
    public function destroy(Request $request): JsonResponse
    {
        $accessToken = $this->resolveAccessTokenFromAuthorization($request);
        if (! $accessToken) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        // 現在のトークンのみ削除して他セッションへの影響を回避
        $accessToken->delete();

        return response()->json(null, 204);
    }

    /**
     * Authorizationヘッダーから現在アクセストークンを解決する
     */
    private function resolveAccessTokenFromAuthorization(Request $request): ?PersonalAccessToken
    {
        $auth = (string) $request->header('Authorization', '');
        $parts = preg_split('/\s+/', trim($auth));
        $token = $parts ? end($parts) : '';

        if (! is_string($token) || $token === '') {
            return null;
        }

        return PersonalAccessToken::findToken($token);
    }

    /**
     * 認証失敗のレスポンスを返す
     */
    private function invalidCredentials(): JsonResponse
    {
        return response()->json(['error' => 'invalid_credentials'], 401);
    }
}
