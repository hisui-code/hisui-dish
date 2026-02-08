<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateUserRequest extends FormRequest
{
    /**
    * このリクエストを許可する
    * @return bool 許可する場合はtrue
    */
    public function authorize(): bool
    {
        return true;
    }
    /**
     * バリデーションルールを返す
     * @return array<string, mixed> バリデーションルール
     */
    public function rules(): array
    {
        $userId = (string) $this->route('user_id');

        return [
            'name' => ['sometimes','string','max:50'],
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password' => ['sometimes','string','min:8'],
            'role' => ['sometimes',Rule::in(['admin','user','guest'])],
        ];
    }

    /**
     * 更新対象フィールドが1つ以上あることを検証する
     * @param Validator $validator バリデータ
     * @return void
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            //更新可能な４項目いずれかが含まれていることをチェック
            $hasAnyField = $this->hasAny(['name','email','password','role']);

            if (!$hasAnyField) {
                $validator->errors()->add('payload', 'No updatable fields');
            }
        });
    }
}
