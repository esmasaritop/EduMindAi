<?php

namespace App\Services;

use App\Models\QuestionStat;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Support\Collection;

class QuestionStatService
{
    public function ensureStatForTopic(int $userId, int $topicId): QuestionStat
    {
        return QuestionStat::firstOrCreate(
            ['user_id' => $userId, 'topic_id' => $topicId],
            [
                'total_questions' => 0,
                'correct'         => 0,
                'wrong'           => 0,
                'empty'           => 0,
            ]
        );
    }

    public function addToStat(QuestionStat $stat, array $increments): QuestionStat
    {
        $correct = $increments['correct'] ?? 0;
        $wrong = $increments['wrong'] ?? 0;
        $empty = $increments['empty'] ?? 0;
        $total = $increments['total_questions'] ?? 0;

        if ($total === 0 && ($correct + $wrong + $empty) > 0) {
            $total = $correct + $wrong + $empty;
        }

        if ($total > 0) {
            $stat->increment('total_questions', $total);
        }
        if ($correct > 0) {
            $stat->increment('correct', $correct);
        }
        if ($wrong > 0) {
            $stat->increment('wrong', $wrong);
        }
        if ($empty > 0) {
            $stat->increment('empty', $empty);
        }

        return $stat->fresh();
    }

    public function getTrackedStatsForUser(User $user): Collection
    {
        $topics = Topic::query()
            ->where('user_id', $user->id)
            ->where('track_questions', true)
            ->with(['subject'])
            ->orderBy('name')
            ->get();

        return $topics->map(function (Topic $topic) use ($user) {
            $stat = $this->ensureStatForTopic($user->id, $topic->id);
            $stat->setRelation('topic', $topic);

            return $stat;
        });
    }
}
