<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\DailyStatRepository;
use App\Repositories\Interfaces\GoalRepositoryInterface;
use App\Repositories\Interfaces\NotificationRepositoryInterface;
use App\Repositories\Interfaces\StudySessionRepositoryInterface;
use App\Repositories\StreakRepository;
use Illuminate\Support\Carbon;

class DashboardService
{
    public function __construct(
        private readonly StudySessionRepositoryInterface $studySessionRepository,
        private readonly GoalRepositoryInterface $goalRepository,
        private readonly DailyStatRepository $dailyStatRepository,
        private readonly StreakRepository $streakRepository,
        private readonly NotificationRepositoryInterface $notificationRepository,
        private readonly GoalProgressService $goalProgressService,
        private readonly TopicWeeklyStatsService $topicWeeklyStatsService,
        private readonly NotificationGeneratorService $notificationGeneratorService
    ) {}

    public function getDashboardData(User $user): array
    {
        $this->notificationGeneratorService->syncForUser($user);

        $today = Carbon::today()->toDateString();
        $todayDuration = $this->studySessionRepository->getTotalDurationForDate($user->id, $today);
        $todaySessionCount = $this->studySessionRepository->getSessionCountForDate($user->id, $today);
        $activeGoals = $this->goalRepository->getActiveGoalsForUser($user->id)
            ->map(fn ($goal) => $this->goalProgressService->applyToGoal($goal));
        $recentStats = $this->dailyStatRepository->getRecentForUser($user->id, 7);
        $streak = $this->streakRepository->getForUser($user->id);
        $unreadNotificationCount = $this->notificationRepository->getUnreadCountForUser($user->id);
        $weeklyTopicStats = $this->topicWeeklyStatsService->getWeeklyStatsForUser($user);

        return [
            'today' => [
                'total_duration'  => $todayDuration,
                'session_count'   => $todaySessionCount,
            ],
            'streak' => [
                'current_streak'  => $streak?->current_streak ?? 0,
                'longest_streak'  => $streak?->longest_streak ?? 0,
                'last_study_date' => $streak?->last_study_date,
            ],
            'active_goals'               => $activeGoals,
            'weekly_stats'               => $recentStats,
            'weekly_topic_stats'         => $weeklyTopicStats,
            'unread_notification_count'  => $unreadNotificationCount,
        ];
    }
}
