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
     * 指定年の「月ごとの合計（1〜12）」を返す
     *
     * クエリパラメータ:
     * - year: 対象年（YYYY）
     * - device_id: 対象デバイスID。未指定の場合は devices の先頭を使用
     *
     * @param  Request  $request  リクエスト
     */
    public function show(Request $request): JsonResponse
    {
        // 対象年を受け取る 未指定時はJSTの現在年を使う
        $year = $request->input('year');
        if (! is_string($year) || trim($year) === '') {
            $year = CarbonImmutable::now('Asia/Tokyo')->format('Y');
        }

        // 年フォーマットが不正なら400で返す
        if (preg_match('/\A\d{4}\z/', $year) !== 1) {
            return response()->json(['error' => 'invalid year'], 400);
        }

        // JST境界で年初と年末を作る
        $yearStart = CarbonImmutable::createFromFormat('Y-m-d H:i:s', $year.'-01-01 00:00:00', 'Asia/Tokyo');
        if (! $yearStart) {
            return response()->json(['error' => 'invalid year'], 400);
        }
        $yearEnd = $yearStart->endOfYear()->endOfDay();

        // device_id未指定時は devices テーブルから既定デバイスを採用する
        // テーブル名は device ではなく devices を使う
        $deviceId = $request->input('device_id');
        if (! is_string($deviceId) || trim($deviceId) === '') {
            $deviceId = DB::table('devices')->orderBy('id')->value('id');
        }
        // デバイスが無い場合は集計できないため終了する
        if ($deviceId === null) {
            return response()->json(['error' => 'device not found'], 400);
        }

        // DB検索はUTCで統一するため範囲をUTCへ変換する
        $yearStartUtc = $yearStart->setTimezone('UTC');
        $yearEndUtc = $yearEnd->setTimezone('UTC');

        // JSTの月単位で摂取量を合算する
        // 食事量の集計は eaten_grams を使う
        // event は eat_finished のみ対象にして確定セッションだけを集計する
        $rawMonthly = DB::table('device_session_events')
            ->selectRaw("EXTRACT(MONTH FROM recorded_at AT TIME ZONE 'Asia/Tokyo') AS m, SUM(eaten_grams) AS total")
            ->where('device_id', $deviceId)
            ->where('event', 'eat_finished')
            ->whereBetween('recorded_at', [
                $yearStartUtc->format('Y-m-d H:i:s.u'),
                $yearEndUtc->format('Y-m-d H:i:s.u'),
            ])
            ->groupByRaw("EXTRACT(MONTH FROM recorded_at AT TIME ZONE 'Asia/Tokyo')")
            ->orderBy('m')
            ->get();

        // DB結果を month=>total の連想配列へ変換する
        $monthlyMap = [];
        foreach ($rawMonthly as $row) {
            $month = (int) $row->m;
            $monthlyMap[$month] = (float) $row->total;
        }

        // データが無い月も0で埋めて1〜12月を固定で返す
        $monthlyTotals = [];
        for ($month = 1; $month <= 12; $month++) {
            $monthlyTotals[] = [
                'month' => (string) $month,
                'total' => (float) ($monthlyMap[$month] ?? 0),
            ];
        }

        return response()->json($monthlyTotals, 200, [], JSON_PRESERVE_ZERO_FRACTION);
    }
}
