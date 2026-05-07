<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LocalUploadRequest;
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
        // 未検証の入力を混ぜないため、バリデーション済みの値だけを使う
        $payload = $request->validated();
        // 現在ログインしているユーザーを取得
        $user = $request->user() ?? Auth::user();

        // 認証ユーザーが取得できない場合は、保存先のユーザー領域を決められないため拒否する
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

        // 本番環境の保存用処理
        // S3互換storageへ直接PUTできる署名付きURLを返す
        if ($disk === 's3') {
            return response()->json([
                'upload' => $this->buildS3UploadResponse($disk, $objectKey, (string) $payload['mime_type']),
            ]);
        }

        // 開発環境の保存用処理
        // Backend経由アップロード用の情報を返す
        return response()->json([
            'upload' => $this->buildLocalUploadResponse($disk, $objectKey),
        ]);
    }

    /**
     * 開発環境のlocal diskへ画像本体を保存する
     */
    public function uploadLocal(LocalUploadRequest $request): JsonResponse
    {
        // 未検証の入力を混ぜないため、バリデーション済みの値だけを使う
        $payload = $request->validated();

        // 現在ログインしているユーザーを取得
        $user = $request->user() ?? Auth::user();

        // 認証ユーザーが取得できない場合は、保存先のユーザー領域を決められないため拒否する
        if (! $user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        // local upload は開発環境専用の受け口なので、local disk 以外では拒否する
        $disk = (string) config('filesystems.photos_disk', 'local');
        if ($disk !== 'local') {
            return response()->json(['error' => 'unsupported disk'], 400);
        }

        // 他ユーザー領域や不正な相対パスへ保存されないよう、object key を検査する
        $objectKey = (string) $payload['object_key'];
        if (! $this->canUseObjectKey((string) $user->id, $objectKey)) {
            return response()->json(['error' => 'invalid object key'], 403);
        }

        $file = $request->file('file');
        // FormRequest通過後にファイルを取得できない異常系は、保存処理へ進めずに拒否する
        if (! $file) {
            return response()->json(['error' => 'file is required'], 400);
        }

        // complete API で存在確認できるよう、presign で発行した object key の位置へ保存する
        Storage::disk($disk)->put($objectKey, $file->getContent());

        return response()->json([
            'upload' => [
                'disk' => $disk,
                'objectKey' => $objectKey,
                'originalName' => $file->getClientOriginalName(),
                'bytes' => $file->getSize(),
            ],
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

    /**
     * object key が認証ユーザーの一時保存領域に属しているか確認する
     */
    private function canUseObjectKey(string $userId, string $objectKey): bool
    {
        // storage の意図しない階層へ保存されないよう、相対パス記号は拒否する
        if (str_contains($objectKey, '..') || str_starts_with($objectKey, '/') || str_starts_with($objectKey, '\\')) {
            return false;
        }

        // object key は presign で発行したユーザーごとの tmp 領域だけを許可する
        return str_starts_with($objectKey, sprintf('users/%s/tmp/', $userId));
    }
}
