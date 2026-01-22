<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * @description
 * アプリケーションのユーザーを表す Eloquent モデル
 *
 * 方針
 * - 認証用パスワードは `password` を使用
 * - `password` は Laravel の casts `hashed` により代入時に自動でハッシュ化
 * - `auth_token` は簡易トークン用途で、JSON には出さない
 */
class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * @description
     * 一括代入で受け取ってよい属性
     * 受け付けない属性はここに入れない
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'auth_token',
    ];

    /**
     * @description
     * シリアライズ時に隠す属性
     * API レスポンスに漏れると危険な値を含める
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'auth_token',
        'remember_token',
    ];

    /**
     * @description
     * 属性の型変換ルール
     * - `password: hashed` は代入時に自動でハッシュ化される
     *   例: `$user->password = 'plain'` の保存時にハッシュ化
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];
}
