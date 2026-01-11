<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->environment('production')) {
            $expected = (string) config('app.api_token', '');
            $provided = (string) $request->header('X-Api-Token', '');

            if ($expected === '' || $provided === '' || !hash_equals($expected, $provided)) {
                return response()->json(['error' => 'forbidden'], 403);
            }
        }

        return $next($request);
    }
}
