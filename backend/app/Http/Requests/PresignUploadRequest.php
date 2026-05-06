<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PresignUploadRequest extends FormRequest
{
    /**
     * 画像アップロード開始リクエストを検証する
     */
    public function rules(): array
    {
        return [
            'filename' => ['required', 'string', 'max:255'],
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
