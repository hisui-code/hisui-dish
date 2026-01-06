<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LogsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $month = $request->input('month');
        if (!is_string($month) || trim($month) === '') {
            $month = CarbonImmutable::now('Asia/Tokyo')->format('Y-m');
        }

        $monthStart = $this->parseMonthStart($month);
        if ($monthStart === null) {
            return response()->json([
                'error' => 'invalid month',
            ], 400);
        }

        $monthEnd = $monthStart->endOfMonth()->endOfDay();

        $deviceId = $request->input('device_id');
        if (!is_string($deviceId) || trim($deviceId) === '') {
            $deviceId = DB::table('devices')->orderBy('id')->value('id');
        }

        if ($deviceId === null) {
            return response()->json([
                'error' => 'device not found',
            ], 404);
        }

        $records = DB::table('bowl_snapshots')
            ->where('device_id', $deviceId)
            ->whereBetween('recorded_at', [
                $monthStart->format('Y-m-d H:i:s'),
                $monthEnd->format('Y-m-d H:i:s'),
            ])
            ->orderByDesc('recorded_at')
            ->orderByDesc('id')
            ->get(['id', 'recorded_at', 'weight_g']);

        $logs = $records->map(function ($row) {
            $recordedAt = CarbonImmutable::parse($row->recorded_at, 'UTC')->setTimezone('Asia/Tokyo');

            return [
                'id' => $row->id,
                'recordedAtIso' => $recordedAt->toIso8601String(),
                'grams' => (int) $row->weight_g,
            ];
        })->all();

        return response()->json([
            'logs' => $logs,
        ]);
    }

    private function parseMonthStart(string $month): ?CarbonImmutable
    {
        if (preg_match('/\A\d{4}-\d{2}\z/', $month) !== 1) {
            return null;
        }

        $parsed = CarbonImmutable::createFromFormat('Y-m-d H:i:s', $month . '-01 00:00:00', 'Asia/Tokyo');

        return $parsed ? $parsed->startOfMonth() : null;
    }
}
