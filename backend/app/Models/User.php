<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * アプリケーションのユーザーを表す Eloquent モデル
 *
 * 方針
 * - 認証用パスワードは `password` を使用
 * - `password` は Laravel の casts `hashed` により代入時に自動でハッシュ化
 */
class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * シリアライズ時に隠す属性
     * API レスポンスに漏れると危険な値を含める
     */
    protected $hidden = [
        'password',
    ];

    /**
     * 属性の型変換ルール
     * - `password: hashed` は代入時に自動でハッシュ化される
     *   例: `$user->password = 'plain'` の保存時にハッシュ化

     */
    protected $casts = [
        'password' => 'hashed',
    ];
}
