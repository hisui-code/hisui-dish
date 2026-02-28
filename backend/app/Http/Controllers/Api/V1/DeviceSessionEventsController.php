<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DeviceSessionEventsController extends Controller
{
    /**
     * デバイスから送信された食事セッション結果を受け取り保存する
     * 同一session_idは冪等に扱う
     */
    public function store(Request $request): JsonResponse
    {
        /**
         * デバイス送信payloadの検証ルール
         * - session_id: デバイス側で生成するセッション識別子（再送時の冪等キー）
         * - device_id: 送信元デバイス識別子（将来の複数デバイス運用向け）
         * - event: セッション結果種別（eat_finished / eat_discarded）
         * - eaten: 算出した摂取量（g）
         * - recorded_at: デバイス側で記録したイベント時刻
         */
        $payload = $request->validate([
            'session_id' => ['required', 'string', 'max:64'],
            'device_id' => ['required', 'string', 'max:64'],
            'event' => ['required', 'string', 'in:eat_finished,eat_discarded'],
            'eaten' => ['required', 'numeric'],
            'recorded_at' => ['required', 'date'],
        ]);

        $now = now();

        // session_idで既存レコードの有無を判定して冪等性を担保する
        $exists = DB::table('device_session_events')
            ->where('session_id', $payload['session_id'])
            ->exists();

        // 既に登録済みなら成功として返し重複insertを避ける
        if ($exists) {
            return response()->json(['status' => 'already_processed'], 200);
        }

        // 新規セッションは1レコード作成する
        DB::table('device_session_events')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'session_id' => $payload['session_id'],
            'device_id' => $payload['device_id'],
            'event' => $payload['event'],
            'eaten_grams' => $payload['eaten'],
            'recorded_at' => $payload['recorded_at'],
            'raw_payload' => json_encode($request->all(), JSON_UNESCAPED_UNICODE),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // 新規作成として201を返す
        return response()->json(['status' => 'created'], 201);
    }
}
