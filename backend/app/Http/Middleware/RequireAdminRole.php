<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class RequireAdminRole
{
    /**
     * 管理者ロールを持つユーザーのみアクセスを許可する
     * @param Request $request リクエスト
     * @param Closure $next 次のミドルウェア
     * @return SymfonyResponse レスポンス
     */
    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        $user = $request->user() ?? Auth::user();

        // 認証済みであってもadmin以外はusers管理APIにアクセスさせない
        if (!$user || !isset($user->role) || $user->role !== 'admin') {
            return response()->json([
                'error' => 'forbidden',
            ], 403);
        }

        return $next($request);
    }
}
