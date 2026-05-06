<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PresignUploadRequest;
use Carbon\CarbonImmutable;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadsController extends Controller
{
    /**
     * 画像アップロード開始情報を発行する
     */
    public function presign(PresignUploadRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $user = $request->user() ?? Auth::user();

        if (! $user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        // 保存先は環境ごとに切り替えるため、画像専用の disk 設定から取得する
        $disk = (string) config('filesystems.photos_disk', 'local');

        // object key は Backend 側で生成し、ユーザーごとの保存領域を固定する
        $objectKey = $this->buildObjectKey(
            (string) $user->id,
            (string) $payload['filename'],
            (string) $payload['mime_type'],
        );

        // 本番想定のS3互換storageでは、Frontendが直接PUTできる署名付きURLを返す
        if ($disk === 's3') {
            return response()->json([
                'upload' => $this->buildS3UploadResponse($disk, $objectKey, (string) $payload['mime_type']),
            ]);
        }

        // local disk は署名付きPUTに対応しないため、Backend経由アップロード用の情報を返す
        return response()->json([
            'upload' => $this->buildLocalUploadResponse($disk, $objectKey),
        ]);
    }

    /**
     * ユーザー領域内の一時保存 object key を生成する
     */
    private function buildObjectKey(string $userId, string $filename, string $mimeType): string
    {
        $extension = $this->guessExtension($filename, $mimeType);

        return sprintf(
            'users/%s/tmp/%s.%s',
            $userId,
            (string) Str::uuid(),
            $extension,
        );
    }

    /**
     * S3互換storageへ直接PUTするための署名付きURL情報を作る
     */
    private function buildS3UploadResponse(string $disk, string $objectKey, string $mimeType): array
    {
        /** @var FilesystemAdapter $storage */
        $storage = Storage::disk($disk);

        // 発行したURLを長く使い回されないよう、短い有効期限にする
        $expiresAt = CarbonImmutable::now('UTC')->addMinutes(10);

        $temporaryUpload = $storage->temporaryUploadUrl(
            $objectKey,
            $expiresAt,
            [
                'ContentType' => $mimeType,
            ],
        );

        return [
            'disk' => $disk,
            'objectKey' => $objectKey,
            'method' => 'PUT',
            'url' => $temporaryUpload['url'],
            'headers' => $temporaryUpload['headers'] ?? [],
            'expiresAt' => $expiresAt->toIso8601String(),
        ];
    }

    /**
     * 開発環境のlocal diskへBackend経由で送るための情報を作る
     */
    private function buildLocalUploadResponse(string $disk, string $objectKey): array
    {
        // local disk は直接PUTできないため、次タスクのBackend受け口へ送る前提にする
        return [
            'disk' => $disk,
            'objectKey' => $objectKey,
            'method' => 'POST',
            'url' => url('/api/v1/uploads/local'),
            'headers' => [],
            'expiresAt' => CarbonImmutable::now('UTC')->addMinutes(10)->toIso8601String(),
        ];
    }

    /**
     * MIMEと元ファイル名から保存拡張子を決める
     */
    private function guessExtension(string $filename, string $mimeType): string
    {
        // MIMEを優先して拡張子を決め、偽装されたファイル名への依存を避ける
        return match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/heic' => 'heic',
            'image/heif' => 'heif',
            default => strtolower(pathinfo($filename, PATHINFO_EXTENSION)) ?: 'bin',
        };
    }
}
