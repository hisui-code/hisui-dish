<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Request as SymfonyRequest;
use Symfony\Component\HttpFoundation\Response;

class EnsureApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        if (config('app.env') !== 'production') {
            return $next($request);
        }

        $expected = (string) config('app.api_token', '');
        $provided = (string) $request->header('X-Api-Token', '');

        if ($expected === '' || $provided === '' || !hash_equals($expected, $provided)) {
            return new ForbiddenEmptyResponse('', 403);
        }

        return $next($request);
    }
}

class ForbiddenEmptyResponse extends Response
{
    public function prepare(SymfonyRequest $request): static
    {
        parent::prepare($request);
        $this->headers->remove('Content-Type');

        return $this;
    }
}
