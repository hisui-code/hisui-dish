<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $month = $request->input('month');
        if (!is_string($month) || trim($month) === '') {
            $month = CarbonImmutable::now('Asia/Tokyo')->format('Y-m');
        }

        $monthStart = CarbonImmutable::parse($month . '-01', 'Asia/Tokyo')->startOfMonth();
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

        $monthStartUtc = $monthStart->setTimezone('UTC');
        $monthEndUtc = $monthEnd->setTimezone('UTC');

        $lastSnapshot = DB::table('bowl_snapshots')
            ->where('device_id', $deviceId)
            ->orderByDesc('recorded_at')
            ->first();

        $bowlRemaining = $lastSnapshot ? (float) $lastSnapshot->weight_g : 0.0;

        $rawDaily = DB::table('bowl_snapshots')
            ->selectRaw("DATE(timezone('Asia/Tokyo', recorded_at)) AS d, SUM(weight_g) AS total")
            ->where('device_id', $deviceId)
            ->whereBetween('recorded_at', [
                $monthStartUtc->format('Y-m-d H:i:s.u'),
                $monthEndUtc->format('Y-m-d H:i:s.u'),
            ])
            ->groupByRaw("DATE(timezone('Asia/Tokyo', recorded_at))")
            ->orderBy('d')
            ->get();

        $dailyMap = [];
        foreach ($rawDaily as $row) {
            $day = (string) CarbonImmutable::parse($row->d)->day;
            $dailyMap[$day] = (int) $row->total;
        }

        $daysInMonth = $monthStart->daysInMonth;
        $dailySeries = [];
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $dayKey = (string) $day;
            $dailySeries[] = [
                'day' => $dayKey,
                'total' => (int) ($dailyMap[$dayKey] ?? 0),
            ];
        }

        $todayStart = CarbonImmutable::now('Asia/Tokyo')->startOfDay();
        $todayEnd = $todayStart->endOfDay();
        $todayStartUtc = $todayStart->setTimezone('UTC');
        $todayEndUtc = $todayEnd->setTimezone('UTC');

        $todayEventsRows = DB::table('bowl_snapshots')
            ->where('device_id', $deviceId)
            ->whereBetween('recorded_at', [
                $todayStartUtc->format('Y-m-d H:i:s.u'),
                $todayEndUtc->format('Y-m-d H:i:s.u'),
            ])
            ->orderBy('recorded_at')
            ->get(['recorded_at', 'weight_g']);

        $todayEvents = $todayEventsRows->map(function ($row) {
            $time = CarbonImmutable::parse($row->recorded_at, 'UTC')
                ->setTimezone('Asia/Tokyo')
                ->format('H:i');

            return [
                'time' => $time,
                'g' => (float) $row->weight_g,
            ];
        })->all();

        $todayTotal = (float) DB::table('bowl_snapshots')
            ->where('device_id', $deviceId)
            ->whereBetween('recorded_at', [
                $todayStartUtc->format('Y-m-d H:i:s.u'),
                $todayEndUtc->format('Y-m-d H:i:s.u'),
            ])
            ->sum('weight_g');

        $periodStart = $monthStart->subMonths(3)->startOfMonth();
        $periodEnd = $monthStart->subMonths(1)->endOfMonth();
        $periodStartUtc = $periodStart->setTimezone('UTC');
        $periodEndUtc = $periodEnd->setTimezone('UTC');

        $dailyTotals = DB::table('bowl_snapshots')
            ->selectRaw("DATE(timezone('Asia/Tokyo', recorded_at)) AS d, SUM(weight_g) AS total")
            ->where('device_id', $deviceId)
            ->whereBetween('recorded_at', [
                $periodStartUtc->format('Y-m-d H:i:s.u'),
                $periodEndUtc->format('Y-m-d H:i:s.u'),
            ])
            ->groupByRaw("DATE(timezone('Asia/Tokyo', recorded_at))")
            ->get();

        if ($dailyTotals->isEmpty()) {
            $averageDailyIntakeLast3Months = 0.0;
        } else {
            $totalGrams = 0.0;
            foreach ($dailyTotals as $row) {
                $totalGrams += (float) $row->total;
            }

            $daysWithMeals = $dailyTotals->count();
            $averageDailyIntakeLast3Months = $daysWithMeals === 0
                ? 0.0
                : round($totalGrams / $daysWithMeals, 1);
        }

        return response()->json([
            'todayEvents' => $todayEvents,
            'dailySeries' => $dailySeries,
            'todayTotal' => $todayTotal,
            'bowlRemaining' => $bowlRemaining,
            'averageDailyIntakeLast3Months' => $averageDailyIntakeLast3Months,
        ], 200, [], JSON_PRESERVE_ZERO_FRACTION);
    }
}
