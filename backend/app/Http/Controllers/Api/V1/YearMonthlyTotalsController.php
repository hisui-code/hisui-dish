<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * @description
 * 指定年の「月ごとの合計（1〜12）」を返す API コントローラ
 */
class YearMonthlyTotalsController extends Controller
{
    /**
     * @description
     * 指定年の「月ごとの合計（1〜12）」を返す
     *
     * クエリパラメータ:
     * - year: 対象年（YYYY）
     * - device_id: 対象デバイスID。未指定の場合は devices の先頭を使用
     *
     * @param Request $request リクエスト
     * @returns JsonResponse レスポンス
     */
    public function show(Request $request): JsonResponse
    {
        // year は "YYYY" を想定。未指定は JST の当年
        $year = $request->input('year');
        if (!is_string($year) || trim($year) === '') {
            $year = CarbonImmutable::now('Asia/Tokyo')->format('Y');
        }

        if (preg_match('/\A\d{4}\z/', $year) !== 1) {
            return response()->json(['error' => 'invalid year'], 400);
        }

        // JST基準で年初〜年末を作る
        $yearStart = CarbonImmutable::createFromFormat('Y-m-d H:i:s', $year . '-01-01 00:00:00', 'Asia/Tokyo');
        if (!$yearStart) {
            return response()->json(['error' => 'invalid year'], 400);
        }
        $yearEnd = $yearStart->endOfYear()->endOfDay();

        // device_id が無ければ devices テーブルの先頭 ID を使う
        $deviceId = $request->input('device_id');
        if (!is_string($deviceId) || trim($deviceId) === '') {
            $deviceId = DB::table('device')->orderBy('id')->value('id');
        }
        if ($deviceId === null) {
            return response()->json(['error' => 'device not found'], 400);
        }

        // 検索
        $yearStartUtc = $yearStart->setTimezone('UTC');
        $yearEndUtc = $yearEnd->setTimezone('UTC');

        // recorded_at(UTC)をJSTに変換して「月」でgroupBy
        $rawMonthly = DB::table('bowl_snapshots')
            ->selectRaw("EXTRACT(MONTH FROM recorded_at AT TIME ZONE 'Asia/Tokyo') AS m, SUM(weight_g) AS total")
            ->where('device_id', $deviceId)
            ->whereBetween('recorded_at', [
                $yearStartUtc->format('Y-m-d H:i:s.u'),
                $yearEndUtc->format('Y-m-d H:i:s.u'),
            ])
            ->groupByRaw("EXTRACT(MONTH FROM recorded_at AT TIME ZONE 'Asia/Tokyo')")
            ->orderBy('m')
            ->get();

        // 月(1..12) => 合計g のマップに変換
        $monthlyMap = [];
        foreach ($rawMonthly as $row) {
            $month = (int) $row->m;
            $monthlyMap[$month] = (int) $row->total;
        }

        // 0件の月も含めて配列
        $monthlyTotals = [];
        for ($month = 1;$month <= 12; $month++) {
            $monthlyTotals[] = [
                'month' => (string) $month,
                'total' => (int) ($monthlyMap[$month] ?? 0),
            ];
        }
        return response()->json($monthlyTotals, 200, [], JSON_PRESERVE_ZERO_FRACTION);
    }
}
