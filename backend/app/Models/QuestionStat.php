<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestionStat extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'topic_id',
        'total_questions',
        'correct',
        'wrong',
        'empty',
    ];

    protected function casts(): array
    {
        return [
            'total_questions' => 'integer',
            'correct'         => 'integer',
            'wrong'           => 'integer',
            'empty'           => 'integer',
        ];
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
