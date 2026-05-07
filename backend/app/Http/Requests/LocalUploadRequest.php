<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LocalUploadRequest extends FormRequest
{
    /**
     * 開発環境の画像アップロードリクエストを検証する
     */
    public function rules(): array
    {
        return [
            'object_key' => ['required', 'string', 'max:1024'],
            'file' => [
                'required',
                'file',
                'mimetypes:image/jpeg,image/png,image/webp,image/heic,image/heif',
                'max:10240',
            ],
        ];
    }

    /**
     * このリクエストを許可する
     */
    public function authorize(): bool
    {
        return true;
    }
}
