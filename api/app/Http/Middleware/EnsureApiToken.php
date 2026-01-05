<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response as IlluminateResponse;
use Symfony\Component\HttpFoundation\Response;

class EnsureApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = env('API_TOKEN');
        if (config('app.env') === 'production' && !empty($expected)) {
            $provided = (string) $request->header('X-Api-Token', '');
            if (!hash_equals((string) $expected, $provided)) {
                return new class('', 403) extends IlluminateResponse {
                    public function prepare(\Symfony\Component\HttpFoundation\Request $request): static
                    {
                        parent::prepare($request);
                        $this->headers->remove('Content-Type');
                        return $this;
                    }
                };
            }
        }

        return $next($request);
    }
}
