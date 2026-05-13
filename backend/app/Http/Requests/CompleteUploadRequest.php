<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompleteUploadRequest extends FormRequest
{
    /**
     * 画像アップロード完了リクエストを検証する
     */
    public function rules(): array
    {
        return [
            'disk' => ['required', 'string', Rule::in(['local', 's3'])],
            'object_key' => ['required', 'string', 'max:1024'],
            'original_name' => ['required', 'string', 'max:255'],
            'mime_type' => [
                'required',
                'string',
                Rule::in([
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                    'image/heic',
                    'image/heif',
                ]),
            ],
            'bytes' => ['required', 'integer', 'min:1', 'max:10485760'],
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
