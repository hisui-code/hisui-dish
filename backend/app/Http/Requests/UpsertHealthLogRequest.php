<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertHealthLogRequest extends FormRequest
{
    /**
     * 健康記録の作成・更新リクエストを検証する。
     */
    public function rules(): array
    {
        return [
            'device_id' => ['required', 'uuid', 'exists:devices,id'],
            'type' => [
                'required',
                'string',
                Rule::in([
                    'vomit',
                    'diarrhea',
                    'bloody_stool',
                    'injury',
                    'hospital_visit',
                    'medication',
                    'weight',
                    'other',
                ]),
            ],
            'occurred_at' => ['required', 'date'],
            'note' => ['nullable', 'string'],
            'weight_kg' => ['nullable', 'numeric', 'gt:0'],
            'photos' => ['array'],
            'photos.*' => ['uuid', 'exists:photos,id'],
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
