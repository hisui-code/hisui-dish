<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * @description
 * 指定月の「日ごとの合計（daily totals）」のみ返す API コントローラ
 */
class DailyTotalsController extends Controller
{
    /**
     * @description
     * 指定月の「日ごとの合計（daily totals）」のみ返す
     *
     * クエリパラメータ:
     * - month: 対象月（YYYY-MM）。未指定の場合は JST の当月を使用
     * - device_id: 対象デバイスID。未指定の場合は devices の先頭を使用
     *
     * @param Request $request リクエスト
     * @returns JsonResponse レスポンス
     */

    public function show(Request $request): JsonResponse
    {
        // month は "YYYY-MM" を想定。未指定なら JST の当月を使う
        $month = $request->input('month');
        if (!is_string($month) || trim($month) === '') {
            $month = CarbonImmutable::now('Asia/Tokyo')->format('Y-m');
        }

        // JST基準で月初〜月末を作成
        $monthStart = CarbonImmutable::parse($month . '-01', 'Asia/Tokyo')->startOfMonth();
        $monthEnd = $monthStart->endOfMonth()->endOfDay();

        // device_idが無ければ　devicesテーブルの先頭IDを使う
        $deviceId = $request->input('device_id');
        if (!is_string($deviceId) || trim($deviceId) === '') {
            $deviceId = DB::table('devices')->orderBy('id')->value('id');
        }

        if ($deviceId === null) {
            return response()->json([
              'error' => 'device not found',
            ], 404);
        }

        // 検索
        $monthStartUtc = $monthStart->setTimezone('UTC');
        $monthEndUtc = $monthEnd->setTimezone('UTC');

        // recorded_at（UTC）を JST に変換して日付で groupBy する
        $rawDaily = DB::table('bowl_snapshots')
            ->selectRaw("DATE(recorded_at AT TIME ZONE 'Asia/Tokyo') AS d, SUM(weight_g) AS total")
            ->where('device_id', $deviceId)
            ->whereBetween('recorded_at', [
              $monthStartUtc->format('Y-m-d H:i:s.u'),
              $monthEndUtc->format('Y-m-d H:i:s.u'),
            ])
            ->groupByRaw("DATE(recorded_at AT TIME ZONE 'Asia/Tokyo')")
            ->orderBy('d')
            ->get();

        // クエリ結果を"日(1~31)" => 合計g
        $dailyMap = [];
        foreach ($rawDaily as $row) {
            $day = (string) CarbonImmutable::parse($row->d)->day;
            $dailyMap[$day] = (int) $row->total;
        }

        // 0件の日も含めて配列を返す
        $daysInMonth = $monthStart->daysInMonth;
        $dailyTotals = [];
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $dayKey = (string) $day;
            $dailyTotals[] = [
                'day' => $dayKey,
                'total' => (int) ($dailyMap[$dayKey] ?? 0),
            ];
        }
        return response()->json($dailyTotals, 200, [], JSON_PRESERVE_ZERO_FRACTION);
    }
}
