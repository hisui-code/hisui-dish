<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * @description
 * ダッシュボード表示に必要な集計データを返す API コントローラ
 *
 * 返却する主なデータ:
 * - todayEvents: 今日の食事イベント一覧（JST 表示用の HH:mm と g）
 * - dailySeries: 指定月の日別合計（day=日付(1..), total=合計g）
 * - todayTotal: 今日の合計（g）
 * - bowlRemaining: 最新スナップショットの残量（g）
 * - averageDailyIntakeLast3Months: 直近3ヶ月（前々月〜前月）の 1 日平均（g）
 */
class DashboardController extends Controller
{
    /**
     * @description
     * ダッシュボード用の集計結果を返す
     *
     * クエリパラメータ:
     * - month: 対象月（YYYY-MM）。未指定の場合は JST の当月を使用
     * - device_id: 対象デバイスID。未指定の場合は devices の先頭を使用
     *
     * @param Request $request リクエスト
     * @return JsonResponse レスポンス
     */
    public function show(Request $request): JsonResponse
    {

        // month は "YYYY-MM" を想定。未指定なら JST の当月を使う
        $month = $request->input('month');
        if (!is_string($month) || trim($month) === '') {
            $month = CarbonImmutable::now('Asia/Tokyo')->format('Y-m');
        }

        // JST 基準で月初〜月末を作る
        $monthStart = CarbonImmutable::parse($month . '-01', 'Asia/Tokyo')->startOfMonth();
        $monthEnd = $monthStart->endOfMonth()->endOfDay();

        // device_id が無ければ devices テーブルの先頭 ID を使う
        $deviceId = $request->input('device_id');
        if (!is_string($deviceId) || trim($deviceId) === '') {
            $deviceId = DB::table('devices')->orderBy('id')->value('id');
        }

        if ($deviceId === null) {
            return response()->json([
                'error' => 'device not found',
            ], 404);
        }

        // DB は UTC の timestamptz 前提なので、検索範囲は UTC に変換して使う
        $monthStartUtc = $monthStart->setTimezone('UTC');
        $monthEndUtc = $monthEnd->setTimezone('UTC');

        // 最新の残量（bowlRemaining）
        $lastSnapshot = DB::table('bowl_snapshots')
            ->where('device_id', $deviceId)
            ->orderByDesc('recorded_at')
            ->first();

        $bowlRemaining = $lastSnapshot ? (int) $lastSnapshot->weight_g : 0;

        // 指定月の日別合計（dailySeries）
        // recorded_at（UTC）を JST に変換して日付で groupBy する
        $rawDaily = DB::table('bowl_snapshots')
            ->selectRaw("DATE((recorded_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Tokyo') AS d, SUM(weight_g) AS total")
            ->where('device_id', $deviceId)
            ->whereBetween('recorded_at', [
                $monthStartUtc->format('Y-m-d H:i:s.u'),
                $monthEndUtc->format('Y-m-d H:i:s.u'),
            ])
            ->groupByRaw("DATE((recorded_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Tokyo')")
            ->orderBy('d')
            ->get();

        // クエリ結果を "日(1..31)" => 合計g のマップに変換
        $dailyMap = [];
        foreach ($rawDaily as $row) {
            $day = (string) CarbonImmutable::parse($row->d)->day;
            $dailyMap[$day] = (int) $row->total;
        }

        // 0 件の日も含めて日数分の配列を返す（UI 側で扱いやすくする）
        $daysInMonth = $monthStart->daysInMonth;
        $dailySeries = [];
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $dayKey = (string) $day;
            $dailySeries[] = [
                'day' => $dayKey,
                'total' => (int) ($dailyMap[$dayKey] ?? 0),
            ];
        }

        // 今日のイベント（todayEvents）/ 今日の合計（todayTotal） 
        // 今日（JST）の 00:00:00〜23:59:59 を UTC に直して検索する
        $todayStart = CarbonImmutable::now('Asia/Tokyo')->startOfDay();
        $todayEnd = $todayStart->endOfDay();
        $todayStartUtc = $todayStart->setTimezone('UTC');
        $todayEndUtc = $todayEnd->setTimezone('UTC');

        // 今日のログを時系列で取得し、JST の HH:mm 表示に整形
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

        // 今日の合計（g）
        $todayTotal = (int) DB::table('bowl_snapshots')
            ->where('device_id', $deviceId)
            ->whereBetween('recorded_at', [
                $todayStartUtc->format('Y-m-d H:i:s.u'),
                $todayEndUtc->format('Y-m-d H:i:s.u'),
            ])
            ->sum('weight_g');

        //  直近3ヶ月の 1 日平均（averageDailyIntakeLast3Months） 
        // 対象月の「前々月〜前月」(3ヶ月分) を JST 境界で集計し、日次合計の平均を返す
        $periodStart = $monthStart->subMonths(3)->startOfMonth();
        $periodEnd = $monthStart->subMonths(1)->endOfMonth();
        $periodStartUtc = $periodStart->setTimezone('UTC');
        $periodEndUtc = $periodEnd->setTimezone('UTC');

        // 直近3ヶ月の各日合計を取得（JST 日付で groupBy）
        $dailyTotals = DB::table('bowl_snapshots')
            ->selectRaw("DATE((recorded_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Tokyo') AS d, SUM(weight_g) AS total")
            ->where('device_id', $deviceId)
            ->whereBetween('recorded_at', [
                $periodStartUtc->format('Y-m-d H:i:s.u'),
                $periodEndUtc->format('Y-m-d H:i:s.u'),
            ])
            ->groupByRaw("DATE((recorded_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Tokyo')")
            ->get();

        // ログが無い場合は 0 を返す
        if ($dailyTotals->isEmpty()) {
            $averageDailyIntakeLast3Months = 0;
        } else {
            $totalGrams = 0.0;
            foreach ($dailyTotals as $row) {
                $totalGrams += (float) $row->total;
            }

            $daysWithMeals = $dailyTotals->count();
            $averageDailyIntakeLast3Months = $daysWithMeals === 0
                ? 0
                : round($totalGrams / $daysWithMeals, 1);

            if (is_float($averageDailyIntakeLast3Months) &&
                floor($averageDailyIntakeLast3Months) === $averageDailyIntakeLast3Months) {
                $averageDailyIntakeLast3Months = (int) $averageDailyIntakeLast3Months;
            }
        }

        // レスポンス
        return response()->json([
            'todayEvents' => $todayEvents,
            'dailySeries' => $dailySeries,
            'todayTotal' => $todayTotal,
            'bowlRemaining' => $bowlRemaining,
            'averageDailyIntakeLast3Months' => $averageDailyIntakeLast3Months,
        ], 200, [], JSON_PRESERVE_ZERO_FRACTION);
    }
}
