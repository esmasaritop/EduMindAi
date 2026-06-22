<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\DailyStatRepository;
use App\Repositories\Interfaces\GoalRepositoryInterface;
use App\Repositories\Interfaces\StudySessionRepositoryInterface;
use App\Repositories\StreakRepository;
use Illuminate\Support\Carbon;

class StudentContextService
{
    public function __construct(
        private readonly StudySessionRepositoryInterface $studySessionRepository,
        private readonly GoalRepositoryInterface $goalRepository,
        private readonly DailyStatRepository $dailyStatRepository,
        private readonly StreakRepository $streakRepository,
        private readonly GoalProgressService $goalProgressService,
        private readonly TopicWeeklyStatsService $topicWeeklyStatsService,
        private readonly QuestionStatService $questionStatService,
    ) {}

    public function buildForUser(User $user): array
    {
        $today = Carbon::today()->toDateString();
        $streak = $this->streakRepository->getForUser($user->id);

        $activeGoals = $this->goalRepository->getActiveGoalsForUser($user->id)
            ->map(fn ($goal) => $this->goalProgressService->applyToGoal($goal))
            ->map(fn ($goal) => [
                'scope'              => $goal->scope,
                'type'               => $goal->type,
                'target_duration'    => $goal->target_duration,
                'current_duration'   => $goal->current_duration,
                'progress_percent'   => $goal->progress_percent,
                'remaining_minutes'  => $goal->remaining_minutes,
                'status'             => $goal->status,
                'subject_name'       => $goal->subject?->name,
                'topic_name'         => $goal->topic?->name,
            ])
            ->values()
            ->all();

        $weeklyTopicStats = $this->topicWeeklyStatsService->getWeeklyStatsForUser($user)
            ->map(fn ($item) => [
                'topic'          => $item['topic_name'],
                'subject'        => $item['subject_name'],
                'weekly_minutes' => $item['weekly_minutes'],
                'total_minutes'  => $item['total_minutes'],
            ])
            ->values()
            ->all();

        $questionStats = $this->questionStatService->getTrackedStatsForUser($user)
            ->map(function ($stat) {
                $total = max(1, (int) $stat->total_questions);

                return [
                    'topic'            => $stat->topic?->name,
                    'subject'          => $stat->topic?->subject?->name,
                    'total_questions'  => $stat->total_questions,
                    'correct'          => $stat->correct,
                    'wrong'            => $stat->wrong,
                    'empty'            => $stat->empty,
                    'accuracy_percent' => (int) round(($stat->correct / $total) * 100),
                ];
            })
            ->values()
            ->all();

        $weeklyStats = $this->dailyStatRepository->getRecentForUser($user->id, 7)
            ->map(fn ($stat) => [
                'date'           => $stat->date,
                'total_duration' => $stat->total_duration,
                'session_count'  => $stat->session_count,
            ])
            ->values()
            ->all();

        return [
            'student_name' => $this->firstName($user->name),
            'timezone'     => $user->timezone ?? 'UTC',
            'today'        => [
                'total_duration' => $this->studySessionRepository->getTotalDurationForDate($user->id, $today),
                'session_count'  => $this->studySessionRepository->getSessionCountForDate($user->id, $today),
            ],
            'streak' => [
                'current_streak'  => $streak?->current_streak ?? 0,
                'longest_streak'  => $streak?->longest_streak ?? 0,
                'last_study_date' => $streak?->last_study_date,
            ],
            'weekly_stats'       => $weeklyStats,
            'weekly_topic_stats' => $weeklyTopicStats,
            'active_goals'       => $activeGoals,
            'question_stats'     => $questionStats,
        ];
    }

    private function firstName(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name));

        return $parts[0] ?? 'Öğrenci';
    }
}
