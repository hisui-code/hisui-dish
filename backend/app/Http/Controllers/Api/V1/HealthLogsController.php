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

        // 写真情報は中間テーブルからまとめて取得し、health_log_id ごとに引ける形へ整える
        $photosByHealthLogId = $this->loadPhotosByHealthLogIds(
            $rows->pluck('id')->map(fn ($id) => (string) $id)->all(),
        );

        return response()->json([
            // APIレスポンスはフロント前提のキー名とJST日時へ整形して返す
            // map は各行に同じ整形処理を適用し、all() で配列へ変換する
            'healthLogs' => $rows->map(fn ($row) => $this->serializeHealthLog($row, $photosByHealthLogId[(string) $row->id] ?? []))->all(),
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

        $photoIds = $payload['photos'] ?? [];

        // health_log_photos に壊れた紐付けを作らないよう、存在する完了済み写真だけを許可する
        if (! $this->canAttachPhotos($photoIds)) {
            return response()->json(['error' => 'invalid photos'], 422);
        }

        // 健康記録本体と写真の紐付けが片方だけ作成されないよう、同じトランザクションで処理する
        DB::transaction(function () use ($id, $payload, $nowUtc, $photoIds) {
            // 保存時は日時をUTCへ統一し、写真は中間テーブルへ分けて保存する
            DB::table('health_logs')->insert([
                'id' => $id,
                'device_id' => $payload['device_id'],
                'type' => $payload['type'],
                'occurred_at' => $this->parseOccurredAtToUtc($payload['occurred_at']),
                'note' => $payload['note'] ?? null,
                'weight_kg' => $payload['weight_kg'] ?? null,
                'photos' => json_encode([]),
                'created_at' => $nowUtc,
                'updated_at' => $nowUtc,
            ]);

            // 作成した健康記録に、入力された写真IDを表示順つきで紐付ける
            $this->syncHealthLogPhotos($id, $photoIds, $nowUtc);
        });

        // レスポンス用に作成後の健康記録を取得する
        $created = DB::table('health_logs')->where('id', $id)->first();

        // 作成直後のレスポンスに写真メタデータを含めるため、紐付いた写真を取得する
        $photos = $this->loadPhotosByHealthLogIds([$id]);

        return response()->json([
            'healthLog' => $this->serializeHealthLog($created, $photos[$id] ?? []),
        ], 201);
    }

    /**
     * 健康記録を更新する。
     */
    public function update(UpsertHealthLogRequest $request, string $healthLogId): JsonResponse
    {
        // 事前に定義したルールを通過した入力値だけを使う
        $payload = $request->validated();

        // 別端末の健康記録を更新しないよう、IDとdevice_idの両方で更新対象を確認する
        $existing = DB::table('health_logs')
            ->where('id', $healthLogId)
            ->where('device_id', $payload['device_id'])
            ->first();

        // IDとdevice_idに一致する健康記録がない場合は、更新対象なしとして扱う
        if (! $existing) {
            return response()->json(['error' => 'health log not found'], 404);
        }

        // health_log_photos に壊れた紐付けを作らないよう、存在する完了済み写真だけを許可する
        $photoIds = $payload['photos'] ?? [];
        if (! $this->canAttachPhotos($photoIds)) {
            return response()->json(['error' => 'invalid photos'], 422);
        }

        $nowUtc = CarbonImmutable::now('UTC')->format('Y-m-d H:i:s.u');

        // 健康記録本体と写真の紐付けが片方だけ更新されないよう、同じトランザクションで処理する
        DB::transaction(function () use ($healthLogId, $payload, $photoIds, $nowUtc) {
            DB::table('health_logs')
                ->where('id', $healthLogId)
                ->where('device_id', $payload['device_id'])
                ->update([
                    'type' => $payload['type'],
                    'occurred_at' => $this->parseOccurredAtToUtc($payload['occurred_at']),
                    'note' => $payload['note'] ?? null,
                    'weight_kg' => $payload['weight_kg'] ?? null,
                    'photos' => json_encode([]),
                    'updated_at' => $nowUtc,
                ]);

            $this->syncHealthLogPhotos($healthLogId, $photoIds, $nowUtc);
        });

        // 更新後の健康記録と写真情報を取り直し、レスポンスを最新状態に揃える
        $healthLog = DB::table('health_logs')->where('id', $healthLogId)->first();
        $photos = $this->loadPhotosByHealthLogIds([$healthLogId]);

        return response()->json([
            'healthLog' => $this->serializeHealthLog($healthLog, $photos[$healthLogId] ?? []),
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
    private function serializeHealthLog(object $row, array $photos): array
    {
        // DBはUTC保存なので、画面表示用にJSTへ戻して返す
        $occurredAt = CarbonImmutable::parse($row->occurred_at, 'UTC')->setTimezone('Asia/Tokyo');

        return [
            'id' => (string) $row->id,
            'type' => (string) $row->type,
            'occurredAt' => $occurredAt->format('Y-m-d\\TH:i:s'),
            'note' => $row->note !== null ? (string) $row->note : null,
            'weightKg' => $row->weight_kg !== null ? (float) $row->weight_kg : null,
            'photos' => $photos,
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

    /**
     * 健康記録IDごとに紐付いた写真メタデータを取得する
     */
    private function loadPhotosByHealthLogIds(array $healthLogIds): array
    {
        if ($healthLogIds === []) {
            return [];
        }

        // 中間テーブルを経由して、健康記録に紐付いた写真メタデータを並び順つきで取得する
        $rows = DB::table('health_log_photos')
            ->join('photos', 'photos.id', '=', 'health_log_photos.photo_id')
            ->whereIn('health_log_photos.health_log_id', $healthLogIds)
            ->orderBy('health_log_photos.sort_order')
            ->get([
                'health_log_photos.health_log_id',
                'photos.id',
                'photos.disk',
                'photos.object_key',
                'photos.original_name',
                'photos.mime_type',
                'photos.bytes',
                'photos.visibility',
                'photos.status',
            ]);

        // health_log_id ごとに写真配列をまとめる
        $result = [];

        foreach ($rows as $row) {
            $healthLogId = (string) $row->health_log_id;

            $result[$healthLogId][] = [
                'id' => (string) $row->id,
                'disk' => (string) $row->disk,
                'objectKey' => (string) $row->object_key,
                'originalName' => (string) $row->original_name,
                'mimeType' => (string) $row->mime_type,
                'bytes' => (int) $row->bytes,
                'visibility' => (string) $row->visibility,
                'status' => (string) $row->status,
            ];
        }

        return $result;
    }

    /**
     * 健康記録に紐付けできる写真か確認する
     */
    private function canAttachPhotos(array $photoIds): bool
    {
        if ($photoIds === []) {
            return true;
        }

        $uniquePhotoIds = array_values(array_unique($photoIds));

        // アップロード完了済みの写真だけを健康記録へ紐付ける
        $count = DB::table('photos')
            ->whereIn('id', $uniquePhotoIds)
            ->where('status', 'completed')
            ->count();

        return $count === count($uniquePhotoIds);
    }

    /**
     * 健康記録と写真の紐付けを保存し直す
     */
    private function syncHealthLogPhotos(string $healthLogId, array $photoIds, string $nowUtc): void
    {
        // 更新時は並び順も含めて現在の入力に合わせるため、一度既存の紐付けを削除する
        DB::table('health_log_photos')
            ->where('health_log_id', $healthLogId)
            ->delete();

        // 同じ写真が重複して送られても、1つの健康記録には1回だけ紐付ける
        $uniquePhotoIds = array_values(array_unique($photoIds));

        if ($uniquePhotoIds === []) {
            return;
        }

        // 入力順を sort_order として保持し、表示時も同じ順序で返せるようにする
        $rows = array_map(
            fn (string $photoId, int $index) => [
                'health_log_id' => $healthLogId,
                'photo_id' => $photoId,
                'sort_order' => $index,
                'created_at' => $nowUtc,
                'updated_at' => $nowUtc,
            ],
            $uniquePhotoIds,
            array_keys($uniquePhotoIds),
        );

        DB::table('health_log_photos')->insert($rows);

    }
}
