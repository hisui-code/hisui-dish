<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DeviceBowlSnapshotsController extends Controller
{
    /**
     * デバイスから送信されたbowl_snapshotを保存する
     * 同一snapshot_idは冪等に扱う
     */
    public function store(Request $request): JsonResponse
    {
        /**
         * 送信payloadの検証ルール
         * - snapshot_id: デバイス側で生成する冪等キー
         * - device_id: 送信元デバイス識別子
         * - weight_g: 現在のfood重量
         * - recorded_at: デバイス側で記録した時刻
         */
        $payload = $request->validate([
            'snapshot_id' => ['required', 'string', 'max:64'],
            'device_id' => ['required', 'string', 'max:64'],
            'weight_g' => ['required', 'numeric', 'min:0'],
            'recorded_at' => ['required', 'date'],
        ]);

        // 存在しないdevice_idは保存しない
        $deviceExists = DB::table('devices')
            ->where('id', $payload['device_id'])
            ->exists();

        if (! $deviceExists) {
            return response()->json(['error' => 'device_not_found'], 404);
        }

        // snapshot_id（= bowl_snapshots.id）で冪等性を担保する
        $exists = DB::table('bowl_snapshots')
            ->where('id', $payload['snapshot_id'])
            ->exists();

        if ($exists) {
            return response()->json(['status' => 'already_processed'], 200);
        }

        $now = now();

        DB::table('bowl_snapshots')->insert([
            'id' => $payload['snapshot_id'],
            'device_id' => $payload['device_id'],
            'weight_g' => (int) round((float) $payload['weight_g']),
            'recorded_at' => $payload['recorded_at'],
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return response()->json(['status' => 'created'], 201);
    }
}
