<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpsertHealthLogRequest;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HealthLogsController extends Controller
{
    /**
     * 健康記録一覧を月別に取得する。
     */
    public function index(Request $request): JsonResponse
    {
        // リクエストから month パラメータを取り出す
        $month = $request->input('month');

        // 月指定がない場合は、画面の初期表示用にJSTの当月を採用する
        if (! is_string($month) || trim($month) === '') {
            $month = CarbonImmutable::now('Asia/Tokyo')->format('Y-m');
        }

        // 文字列の YYYY-MM を、検索に使いやすい月初日時へ変換する
        $monthStart = $this->parseMonthStart($month);
        if ($monthStart === null) {
            return response()->json(['error' => 'invalid month'], 400);
        }

        // どの端末の記録かを判定するため、device_id を必須で受け取る
        $deviceId = $request->input('device_id');
        if (! is_string($deviceId) || trim($deviceId) === '') {
            return response()->json(['error' => 'device_id is required'], 400);
        }

        // DBはUTC保存のため、JSTの月初末をUTC範囲へ変換して検索する
        $monthStartUtc = $monthStart->setTimezone('UTC');
        $monthEndUtc = $monthStart->endOfMonth()->endOfDay()->setTimezone('UTC');

        // Query Builder で health_logs テーブルから対象データを取得する
        // whereBetween は、開始日時から終了日時までの範囲検索を行う
        $rows = DB::table('health_logs')
            ->where('device_id', $deviceId)
            ->whereBetween('occurred_at', [
                $monthStartUtc->format('Y-m-d H:i:s'),
                $monthEndUtc->format('Y-m-d H:i:s'),
            ])
            // 新しい記録から表示したいので降順で並べる
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            // get() は複数行をコレクションとして取得する
            ->get();

        return response()->json([
            // APIレスポンスはフロント前提のキー名とJST日時へ整形して返す
            // map は各行に同じ整形処理を適用し、all() で配列へ変換する
            'healthLogs' => $rows->map(fn ($row) => $this->serializeHealthLog($row))->all(),
        ]);
    }

    /**
     * 健康記録を新規作成する。
     */
    public function store(UpsertHealthLogRequest $request): JsonResponse
    {
        // validated() はバリデーション済みの値だけを取り出す
        $payload = $request->validated();
        $nowUtc = CarbonImmutable::now('UTC')->format('Y-m-d H:i:s.u');
        $id = (string) Str::uuid();

        // 保存時は日時をUTCへ統一し、配列項目はJSON化してDBへ格納する
        DB::table('health_logs')->insert([
            'id' => $id,
            'device_id' => $payload['device_id'],
            'type' => $payload['type'],
            'occurred_at' => $this->parseOccurredAtToUtc($payload['occurred_at']),
            'note' => $payload['note'] ?? null,
            'weight_kg' => $payload['weight_kg'] ?? null,
            'photos' => json_encode($payload['photos'] ?? []),
            'created_at' => $nowUtc,
            'updated_at' => $nowUtc,
        ]);

        // first() は条件に一致した1件を取得する
        $created = DB::table('health_logs')->where('id', $id)->first();

        return response()->json([
            'healthLog' => $this->serializeHealthLog($created),
        ], 201);
    }

    /**
     * 健康記録を更新する。
     */
    public function update(UpsertHealthLogRequest $request, string $healthLogId): JsonResponse
    {
        // 事前に定義したルールを通過した入力値だけを使う
        $payload = $request->validated();

        // 別端末のデータを更新できないよう、IDとdevice_idの両方で対象を特定する
        $updated = DB::table('health_logs')
            ->where('id', $healthLogId)
            ->where('device_id', $payload['device_id'])
            ->update([
                'type' => $payload['type'],
                'occurred_at' => $this->parseOccurredAtToUtc($payload['occurred_at']),
                'note' => $payload['note'] ?? null,
                'weight_kg' => $payload['weight_kg'] ?? null,
                'photos' => json_encode($payload['photos'] ?? []),
                'updated_at' => CarbonImmutable::now('UTC')->format('Y-m-d H:i:s.u'),
            ]);

        // update() は更新件数を返すので、0件なら対象なしとして扱う
        if ($updated === 0) {
            return response()->json(['error' => 'health log not found'], 404);
        }

        // 更新後の最新状態を取り直して、そのままレスポンスへ返す
        $healthLog = DB::table('health_logs')->where('id', $healthLogId)->first();

        return response()->json([
            'healthLog' => $this->serializeHealthLog($healthLog),
        ]);
    }

    /**
     * 健康記録を削除する
     */
    public function destroy(Request $request, string $healthLogId): JsonResponse
    {
        // 削除対象を端末単位で制御するため、device_id を受け取る
        $deviceId = $request->input('device_id');
        if (! is_string($deviceId) || trim($deviceId) === '') {
            return response()->json(['error' => 'device_id is required'], 400);
        }

        // 削除も更新と同様に、別端末のレコードを触れない条件で実行する
        $deleted = DB::table('health_logs')
            ->where('id', $healthLogId)
            ->where('device_id', $deviceId)
            ->delete();

        // delete() も削除件数を返すので、0件なら対象が見つかっていない
        if ($deleted === 0) {
            return response()->json(['error' => 'health log not found'], 404);
        }

        // 204 は本文なしで削除成功を表すステータスコード
        return response()->json(null, 204);
    }

    /**
     * DB行を健康記録APIレスポンスへ整形する
     */
    private function serializeHealthLog(object $row): array
    {
        // DBはUTC保存なので、画面表示用にJSTへ戻して返す
        $occurredAt = CarbonImmutable::parse($row->occurred_at, 'UTC')->setTimezone('Asia/Tokyo');

        return [
            'id' => (string) $row->id,
            'type' => (string) $row->type,
            'occurredAt' => $occurredAt->format('Y-m-d\\TH:i:s'),
            // null のまま返す項目と、型を合わせて返す項目をここで整える
            'note' => $row->note !== null ? (string) $row->note : null,
            'weightKg' => $row->weight_kg !== null ? (float) $row->weight_kg : null,
            // photos はDBではJSON文字列なので、配列へ戻して返す
            'photos' => json_decode($row->photos ?? '[]', true) ?: [],
        ];
    }

    /**
     * YYYY-MMをJST月初に変換する
     */
    private function parseMonthStart(string $month): ?CarbonImmutable
    {
        // 月指定はYYYY-MMだけを受け付け、日単位の揺れを防ぐ
        if (preg_match('/\A\d{4}-\d{2}\z/', $month) !== 1) {
            return null;
        }

        // JSTの月初0時として扱い、その月の検索基準点を固定する
        $parsed = CarbonImmutable::createFromFormat('Y-m-d H:i:s', $month.'-01 00:00:00', 'Asia/Tokyo');

        return $parsed ? $parsed->startOfMonth() : null;
    }

    /**
     * フロントのJST日時文字列をUTC保存用に変換する
     */
    private function parseOccurredAtToUtc(string $occurredAt): string
    {
        // フロントはJST基準で入力するため、保存前にUTCへ正規化する
        return CarbonImmutable::parse($occurredAt, 'Asia/Tokyo')
            ->setTimezone('UTC')
            ->format('Y-m-d H:i:s');
    }
}
