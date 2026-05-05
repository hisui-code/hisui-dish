<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Photo extends Model
{
    /**
     * 文字列UUIDを主キーとして扱う
     */
    public $incrementing = false;

    /**
     * 主キーの型
     */
    protected $keyType = 'string';

    /**
     * 一括代入を許可する画像メタデータ
     */
    protected $fillable = [
        'id',
        'user_id',
        'disk',
        'object_key',
        'original_name',
        'mime_type',
        'bytes',
        'visibility',
        'status',
    ];
}
