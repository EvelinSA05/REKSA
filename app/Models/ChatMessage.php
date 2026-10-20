<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasFactory;

    protected $table = 'chat_messages';

    protected $fillable = [
        'channel',
        'sender_name',
        'sender_role',
        'sender_org',
        'message',
        'tag',
        'kebutuhan_id',
        'posko_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function posko()
    {
        return $this->belongsTo(PoskoWilayah::class, 'posko_id');
    }

    public function kebutuhan()
    {
        return $this->belongsTo(KebutuhanWarga::class, 'kebutuhan_id');
    }
}
