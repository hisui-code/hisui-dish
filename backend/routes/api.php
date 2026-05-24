<?php

use App\Http\Controllers\Api\V1\DailyTotalsController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DeviceBowlSnapshotsController;
use App\Http\Controllers\Api\V1\DeviceSessionEventsController;
use App\Http\Controllers\Api\V1\DeviceSettingsController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\HealthLogsController;
use App\Http\Controllers\Api\V1\LogsController;
use App\Http\Controllers\Api\V1\PhotosController;
use App\Http\Controllers\Api\V1\SessionsController;
use App\Http\Controllers\Api\V1\UploadsController;
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

Route::prefix('v1')->group(function () {
    // 公開API
    Route::get('health', [HealthController::class, 'show']);
    Route::post('login', [SessionsController::class, 'create']);

    // Device専用API
    Route::prefix('device')
        ->middleware(['api.token'])
        ->group(function () {
            Route::post('session_events', [DeviceSessionEventsController::class, 'store']);
            Route::post('bowl_snapshots', [DeviceBowlSnapshotsController::class, 'store']);
            Route::get('device_settings/{device_id}', [DeviceSettingsController::class, 'show']);
            Route::get('device_settings/{device_id}/version', [DeviceSettingsController::class, 'version']);
        });

    // Web ユーザー使用API
    Route::middleware(['api.auth'])->group(function () {
        // Dashboard
        Route::get('dashboard', [DashboardController::class, 'show']);
        Route::get('daily_totals', [DailyTotalsController::class, 'show']);
        Route::get('year_monthly_totals', [YearMonthlyTotalsController::class, 'show']);
        // HealthLog
        Route::get('health_logs', [HealthLogsController::class, 'index']);
        Route::post('health_logs', [HealthLogsController::class, 'store']);
        Route::patch('health_logs/{health_log_id}', [HealthLogsController::class, 'update']);
        Route::delete('health_logs/{health_log_id}', [HealthLogsController::class, 'destroy']);
        // Photo
        Route::get('photos/{photo}/download-url', [PhotosController::class, 'downloadUrl']);
        // Upload
        Route::post('uploads/presign', [UploadsController::class, 'presign']);
        Route::post('uploads/local', [UploadsController::class, 'uploadLocal']);
        Route::post('uploads/complete', [UploadsController::class, 'complete']);
        // DeviceSettings（管理画面取得、更新用）
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
    // Photo signed content
    Route::get('photos/{photo}/content', [PhotosController::class, 'content'])
        ->middleware('signed')
        ->name('api.v1.photos.content');
});
