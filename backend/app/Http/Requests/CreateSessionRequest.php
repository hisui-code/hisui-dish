<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * ログインAPIで受け取る認証情報を検証するFormRequest
 */
class CreateSessionRequest extends FormRequest
{
    /**
     * このリクエストを許可する
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * ログインに必要な入力ルールを返す
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ];
    }
}
