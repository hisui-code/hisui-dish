<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * ユーザー新規作成APIの入力を検証する
 */
class CreateUserRequest extends FormRequest
{
    /**
     * このリクエストを許可する
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * 作成時に必要な入力ルールを返す
     *
     * @return array<string, mixed> バリデーションルール
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['admin', 'user', 'guest'])],
        ];
    }
}
