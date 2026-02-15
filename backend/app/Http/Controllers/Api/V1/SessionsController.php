<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
     * @param  Request  $request  リクエスト
     * @return JsonResponse ログイン結果
     */
    public function create(Request $request): JsonResponse
    {
        // バリデーション
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // 資格情報チェック
        if (! Auth::attempt($validated)) {
            return $this->invalidCredentials();
        }

        $user = $request->user() ?? Auth::user();
        if (! $user) {
            return $this->invalidCredentials();
        }

        // 「web-login」トークンは1個だけにする（乱発防止）
        $user->tokens()->where('name', 'web-login')->delete();

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
     * 認証失敗のレスポンスを返す
     */
    private function invalidCredentials(): JsonResponse
    {
        return response()->json(['error' => 'invalid_credentials'], 401);
    }
}
