<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TopicStudyLog extends Model
{
    protected $fillable = [
        'user_id',
        'topic_id',
        'minutes',
        'studied_at',
    ];

    protected function casts(): array
    {
        return [
            'studied_at' => 'date',
            'minutes' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }
}
