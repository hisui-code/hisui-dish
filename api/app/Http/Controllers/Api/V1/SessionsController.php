<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SessionsController extends Controller
{
    public function create(Request $request): JsonResponse
    {
        $email = $request->input('email');
        $password = $request->input('password');

        if (!is_string($email) || !is_string($password)) {
            return $this->invalidCredentials();
        }

        $user = DB::table('users')->where('email', $email)->first();
        if (!$user || !is_string($user->password_digest)) {
            return $this->invalidCredentials();
        }

        if (!password_verify($password, $user->password_digest)) {
            return $this->invalidCredentials();
        }

        $authToken = $user->auth_token;
        if (!is_string($authToken) || $authToken === '') {
            $authToken = Str::random(24);
            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'auth_token' => $authToken,
                    'updated_at' => now('Asia/Tokyo'),
                ]);
        }

        return response()->json([
            'auth_token' => $authToken,
            'body' => [
                'email' => $user->email,
            ],
        ]);
    }

    private function invalidCredentials(): JsonResponse
    {
        return response()->json([
            'error' => 'invalid_credentials',
        ], 401);
    }
}
