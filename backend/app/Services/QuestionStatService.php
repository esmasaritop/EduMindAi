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
