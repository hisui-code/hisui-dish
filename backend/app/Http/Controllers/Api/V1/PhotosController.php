<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Photo;
use Carbon\CarbonImmutable;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PhotosController extends Controller
{
    /**
     * 画像表示用の一時URLを発行する
     */
    public function downloadUrl(Request $request, Photo $photo): JsonResponse
    {
        // 表示URLの発行可否を判断するため、認証済みユーザーを取得する
        $user = $request->user() ?? Auth::user();

        if (! $user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        // アップロード完了前の画像は表示対象にしない
        if ((string) $photo->status !== 'completed') {
            return response()->json(['error' => 'photo is not completed'], 409);
        }

        // 画像表示用URLに短い有効期限を設定する
        $expiresAt = CarbonImmutable::now('UTC')->addMinutes(10);

        // S3互換storageの画像は、storage側で発行する一時URLを返す
        if ((string) $photo->disk === 's3') {
            /** @var FilesystemAdapter $storage */
            $storage = Storage::disk((string) $photo->disk);

            return response()->json([
                'download' => [
                    'url' => $storage->temporaryUrl(
                        (string) $photo->object_key,
                        $expiresAt,
                    ),
                    'expiresAt' => $expiresAt->toIso8601String(),
                ],
            ]);
        }

        // local disk は直接公開しないため、署名付きのBackend配信URLを返す
        return response()->json([
            'download' => [
                'url' => URL::temporarySignedRoute(
                    'api.v1.photos.content',
                    $expiresAt,
                    ['photo' => (string) $photo->id],
                ),
                'expiresAt' => $expiresAt->toIso8601String(),
            ],
        ]);
    }

    /**
     * local disk の画像本体を署名付きURL経由で返す
     */
    public function content(Photo $photo): StreamedResponse|JsonResponse
    {
        // S3画像はstorage側の一時URLで配信するため、Backend配信はlocalだけ許可する
        if ((string) $photo->disk !== 'local') {
            return response()->json(['error' => 'unsupported disk'], 400);
        }

        // アップロード完了前の画像は表示対象にしない
        if ((string) $photo->status !== 'completed') {
            return response()->json(['error' => 'photo is not completed'], 409);
        }

        /** @var FilesystemAdapter $storage */
        $storage = Storage::disk((string) $photo->disk);

        // DBメタデータだけが残っている状態では画像を返せないため、実体の存在を確認する
        if (! $storage->exists((string) $photo->object_key)) {
            return response()->json(['error' => 'object not found'], 404);
        }

        return $storage->response(
            (string) $photo->object_key,
            (string) $photo->original_name,
            [
                'Content-Type' => (string) $photo->mime_type,
            ],
        );
    }
}
