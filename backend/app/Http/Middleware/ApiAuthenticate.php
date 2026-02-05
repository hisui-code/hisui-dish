<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ApiAuthenticate
{
    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        $auth = (string) $request->header('Authorization', '');
        $parts = preg_split('/\s+/', trim($auth));
        $token = $parts ? end($parts) : '';

        if (!is_string($token) || $token === '') {
            return $this->unauthorized();
        }

        $accessToken = PersonalAccessToken::findToken($token);
        if (!$accessToken || !$accessToken->tokenable) {
            return $this->unauthorized();
        }

        // トークンに紐づくユーザーを認証済みにする
        Auth::setUser($accessToken->tokenable);

        return $next($request);
    }

    private function unauthorized(): SymfonyResponse
    {
        return response()->json([
            'error' => 'unauthorized',
        ], 401);
    }
}
