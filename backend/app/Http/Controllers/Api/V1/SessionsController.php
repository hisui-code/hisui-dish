<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * @description
 * セッション（ログイン）用のAPIコントローラ
 *
 * - email / password を受け取り、ユーザーを認証する
 * - 認証に成功したら auth_token を返す（未発行なら生成して保存する）
 */
class SessionsController extends Controller
{
    /**
     * @description
     * ログイン処理。
     *
     * リクエスト例:
     * - POST /api/v1/login
     * - body: { "email": "...", "password": "..." }
     *
     * レスポンス例:
     * - 200: { "auth_token": "...", "body": { "email": "..." } }
     * - 401: { "error": "invalid_credentials" }
     */
    public function create(Request $request): JsonResponse
    {
        // 入力値を取得
        $email = $request->input('email');
        $password = $request->input('password');

        // 型が不正（null や配列など）なら弾く
        if (!is_string($email) || !is_string($password)) {
            return $this->invalidCredentials();
        }

        // Auth で資格情報を検証（セッションは作らず検証だけ）
        if (!Auth::validate(['email' => $email, 'password' => $password])) {
            return $this->invalidCredentials();
        }

        // token 発行/返却のためにユーザーを取得
        $user = User::query()->where('email', $email)->first();
        if (!$user) {
            return $this->invalidCredentials();
        }

        // 既存トークンがあればそれを返す。なければ生成して保存する
        $authToken = $user->auth_token;
        if (!is_string($authToken) || $authToken === '') {
            $authToken = Str::random(24);
            $user->auth_token = $authToken;
            $user->save();
        }

        return response()->json([
            'auth_token' => $authToken,
            'body' => [
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * @description
     * 認証失敗の共通レスポンス。
     * 「メールが存在しない」などの詳細は返さず invalid_credentials に統一する。
     */
    private function invalidCredentials(): JsonResponse
    {
        return response()->json([
            'error' => 'invalid_credentials',
        ], 401);
    }
}
