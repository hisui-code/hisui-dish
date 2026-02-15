<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateSessionRequest;
use Illuminate\Http\JsonResponse;
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
