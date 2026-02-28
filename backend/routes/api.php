<?php

use App\Http\Controllers\Api\V1\DailyTotalsController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DeviceSessionEventsController;
use App\Http\Controllers\Api\V1\DeviceSettingsController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\LogsController;
use App\Http\Controllers\Api\V1\SessionsController;
use App\Http\Controllers\Api\V1\UsersController;
use App\Http\Controllers\Api\V1\YearMonthlyTotalsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by bootstrap/app.php and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::prefix('v1')
    ->middleware(['api.token'])
    ->group(function () {
        Route::get('health', [HealthController::class, 'show']);
        Route::post('login', [SessionsController::class, 'create']);

        // Device
        Route::post('device/session_events', [DeviceSessionEventsController::class, 'store']);

        Route::middleware(['api.auth'])->group(function () {
            // Dashboard
            Route::get('dashboard', [DashboardController::class, 'show']);
            Route::get('daily_totals', [DailyTotalsController::class, 'show']);
            Route::get('year_monthly_totals', [YearMonthlyTotalsController::class, 'show']);
            // DeviceSettings
            Route::get('device_settings/{device_id}', [DeviceSettingsController::class, 'show']);
            Route::put('device_settings/{device_id}', [DeviceSettingsController::class, 'update']);
            Route::patch('device_settings/{device_id}', [DeviceSettingsController::class, 'update']);
            // Log
            Route::get('logs', [LogsController::class, 'index']);
            Route::delete('logs/{log_id}', [LogsController::class, 'destroy']);
            // User
            Route::get('me', [UsersController::class, 'me']);
            Route::get('users/{user_id}', [UsersController::class, 'show']);
            Route::patch('users/{user_id}', [UsersController::class, 'update']);
            // Logout
            Route::post('logout', [SessionsController::class, 'destroy']);

            // Users
            Route::middleware(['require.admin'])->group(function () {
                Route::get('users', [UsersController::class, 'index']);
                Route::post('users', [UsersController::class, 'store']);
                Route::delete('users/{user_id}', [UsersController::class, 'destroy']);
            });
        });

    });
