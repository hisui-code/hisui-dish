<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LogsController extends Controller
{
    /**
     * @description 月別ログ一覧を取得する
     * monthとdevice_idの指定がない場合は既定値で補完する
     */
    public function index(Request $request): JsonResponse
    {
        // クエリにmonthがなければJSTの当月を対象にする
        $month = $request->input('month');
        if (! is_string($month) || trim($month) === '') {
            $month = CarbonImmutable::now('Asia/Tokyo')->format('Y-m');
        }

        // YYYY-MMの形式検証とJST月初への正規化を行う
        $monthStart = $this->parseMonthStart($month);
        if ($monthStart === null) {
            return response()->json([
                'error' => 'invalid month',
            ], 400);
        }

        // 検索範囲はJST月初から月末末尾までにする
        $monthEnd = $monthStart->endOfMonth()->endOfDay();
        // DBはUTC保存なので検索境界をUTCへ変換する
        $monthStartUtc = $monthStart->setTimezone('UTC');
        $monthEndUtc = $monthEnd->setTimezone('UTC');

        // device_id未指定時は先頭デバイスを既定対象にする
        $deviceId = $request->input('device_id');
        if (! is_string($deviceId) || trim($deviceId) === '') {
            $deviceId = DB::table('devices')->orderBy('id')->value('id');
        }

        // 対象デバイスが存在しない場合は404を返す
        if ($deviceId === null) {
            return response()->json([
                'error' => 'device not found',
            ], 404);
        }

        // 対象デバイスかつ対象月範囲のスナップショットを新しい順で取得する
        $records = DB::table('bowl_snapshots')
            ->where('device_id', $deviceId)
            ->whereBetween('recorded_at', [
                $monthStartUtc->format('Y-m-d H:i:s'),
                $monthEndUtc->format('Y-m-d H:i:s'),
            ])
            ->orderByDesc('recorded_at')
            ->orderByDesc('id')
            ->get(['id', 'recorded_at', 'weight_g']);

        // レスポンスはJST表示に合わせて日時を変換する
        $logs = $records->map(function ($row) {
            $recordedAt = CarbonImmutable::parse($row->recorded_at, 'UTC')->setTimezone('Asia/Tokyo');

            return [
                'id' => $row->id,
                'recordedAtIso' => $recordedAt->toIso8601String(),
                'grams' => (int) $row->weight_g,
            ];
        })->all();

        // logs配列で返却する
        return response()->json([
            'logs' => $logs,
        ]);
    }

    /**
     * @description 指定IDのログを削除する
     *
     * @param  string  $logId  ログID
     * @return Response 削除結果
     */
    public function destroy(string $logId): JsonResponse
    {
        // 指定IDのログを1件削除する
        $deleted = DB::table('bowl_snapshots')
            ->where('id', $logId)
            ->delete();

        // 削除対象が存在しない場合は404
        if ($deleted === 0) {
            return response()->json([
                'error' => 'log not found',
            ], 404);
        }

        return response()->json(null, 204);
    }

    /**
     * @description YYYY-MMをJSTの月初へ変換する
     * 形式不正の場合はnullを返す
     */
    private function parseMonthStart(string $month): ?CarbonImmutable
    {
        // YYYY-MM 以外は不正として扱う
        if (preg_match('/\A\d{4}-\d{2}\z/', $month) !== 1) {
            return null;
        }

        // JSTの月初00:00:00を生成し検索開始境界として返す
        $parsed = CarbonImmutable::createFromFormat('Y-m-d H:i:s', $month.'-01 00:00:00', 'Asia/Tokyo');

        return $parsed ? $parsed->startOfMonth() : null;
    }
}
