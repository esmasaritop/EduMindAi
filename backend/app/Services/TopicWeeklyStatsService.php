<?php

namespace App\Services;

use App\Models\Topic;
use App\Models\TopicStudyLog;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class TopicWeeklyStatsService
{
    public function getWeeklyStatsForUser(User $user): Collection
    {
        $weekStart = Carbon::today()->startOfWeek(Carbon::MONDAY)->toDateString();
        $weekEnd = Carbon::today()->endOfWeek(Carbon::SUNDAY)->toDateString();

        $minutesByTopic = TopicStudyLog::query()
            ->where('user_id', $user->id)
            ->whereBetween('studied_at', [$weekStart, $weekEnd])
            ->selectRaw('topic_id, SUM(minutes) as weekly_minutes')
            ->groupBy('topic_id')
            ->pluck('weekly_minutes', 'topic_id');

        return Topic::query()
            ->where('user_id', $user->id)
            ->with('subject:id,name')
            ->orderBy('name')
            ->get()
            ->map(fn (Topic $topic) => [
                'topic_id'       => $topic->id,
                'topic_name'     => $topic->name,
                'subject_id'     => $topic->subject_id,
                'subject_name'   => $topic->subject?->name,
                'weekly_minutes' => (int) ($minutesByTopic[$topic->id] ?? 0),
                'total_minutes'  => (int) $topic->study_time_minutes,
            ])
            ->sortByDesc('weekly_minutes')
            ->values();
    }

    public function logStudyTime(int $userId, int $topicId, int $minutes, ?string $date = null): void
    {
        TopicStudyLog::create([
            'user_id'    => $userId,
            'topic_id'   => $topicId,
            'minutes'    => $minutes,
            'studied_at' => $date ?? Carbon::today()->toDateString(),
        ]);
    }

    public function getTopicDurationBetweenDates(int $userId, int $topicId, string $startDate, string $endDate): int
    {
        return (int) TopicStudyLog::query()
            ->where('user_id', $userId)
            ->where('topic_id', $topicId)
            ->whereBetween('studied_at', [$startDate, $endDate])
            ->sum('minutes');
    }
}
