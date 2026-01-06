<?php

use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\DeviceSettingsController;
use App\Http\Controllers\Api\V1\SessionsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::prefix('v1')
    ->middleware('api.token')
    ->group(function () {
        Route::get('health', [HealthController::class, 'show']);
        Route::post('login', [SessionsController::class, 'create']);
    });

Route::prefix('v1')
    ->middleware(['api.token', 'api.auth'])
    ->group(function () {
        Route::get('device_settings/{device_id}', [DeviceSettingsController::class, 'show']);
        Route::put('device_settings/{device_id}', [DeviceSettingsController::class, 'update']);
    });
