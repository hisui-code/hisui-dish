<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        $user = DB::table('users')->where('auth_token', $token)->first();
        if (!$user) {
            return $this->unauthorized();
        }

        return $next($request);
    }

    private function unauthorized(): SymfonyResponse
    {
        return response()->json([
            'error' => 'unauthorized',
        ], 401);
    }
}
