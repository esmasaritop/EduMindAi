<?php

namespace App\Services;

use App\Models\Goal;
use App\Models\User;
use App\Repositories\Interfaces\GoalRepositoryInterface;
use App\Repositories\Interfaces\NotificationRepositoryInterface;
use Illuminate\Support\Carbon;

class NotificationGeneratorService
{
    private const APPROACHING_THRESHOLD = 75;

    public function __construct(
        private readonly NotificationRepositoryInterface $notificationRepository,
        private readonly GoalRepositoryInterface $goalRepository,
        private readonly GoalProgressService $goalProgressService,
        private readonly TopicWeeklyStatsService $topicWeeklyStatsService
    ) {}

    public function syncForUser(User $user): void
    {
        $this->syncGoalNotifications($user);
        $this->syncTopicNotifications($user);
    }

    private function syncGoalNotifications(User $user): void
    {
        $goals = $this->goalRepository->getActiveGoalsForUser($user->id);

        foreach ($goals as $goal) {
            $this->goalProgressService->applyToGoal($goal);
            $this->createGoalNotifications($user->id, $goal);
        }
    }

    private function createGoalNotifications(int $userId, Goal $goal): void
    {
        $percent = (int) $goal->progress_percent;
        $typeLabel = match ($goal->type) {
            'daily'   => 'Günlük',
            'weekly'  => 'Haftalık',
            'monthly' => 'Aylık',
            default   => 'Hedef',
        };
        $scopeLabel = $this->goalScopeLabel($goal);

        if ($percent >= 100) {
            $this->createIfNotExists($userId, 'goal_completed', "goal_completed_{$goal->id}", [
                'title'   => '🎉 Hedef tamamlandı!',
                'message' => "{$scopeLabel} {$typeLabel} hedefinizi tamamladınız: {$goal->target_duration} dakika.",
                'metadata' => [
                    'goal_id' => $goal->id,
                    'progress_percent' => $percent,
                ],
            ]);

            return;
        }

        if ($percent >= self::APPROACHING_THRESHOLD) {
            $this->createIfNotExists($userId, 'goal_approaching', "goal_approaching_{$goal->id}", [
                'title'   => '🎯 Hedefe yaklaşıyorsunuz',
                'message' => "{$scopeLabel} {$typeLabel} hedefinizin %{$percent}'ine ulaştınız. Kalan: {$goal->remaining_minutes} dakika.",
                'metadata' => [
                    'goal_id' => $goal->id,
                    'progress_percent' => $percent,
                    'remaining_minutes' => $goal->remaining_minutes,
                ],
            ]);
        }

        $daysLeft = Carbon::today()->diffInDays(Carbon::parse($goal->end_date), false);

        if ($daysLeft <= 1 && $percent < self::APPROACHING_THRESHOLD) {
            $this->createIfNotExists($userId, 'goal_deadline', "goal_deadline_{$goal->id}_" . Carbon::today()->toDateString(), [
                'title'   => '⏰ Hedef süresi doluyor',
                'message' => "{$scopeLabel} {$typeLabel} hedefinizin bitiş tarihi yaklaşıyor. Henüz %{$percent} tamamlandı, {$goal->remaining_minutes} dakika kaldı.",
                'metadata' => [
                    'goal_id' => $goal->id,
                    'progress_percent' => $percent,
                    'days_left' => max(0, $daysLeft),
                ],
            ]);
        }

        if ($goal->status === 'behind') {
            $this->createIfNotExists($userId, 'goal_behind', "goal_behind_{$goal->id}_" . Carbon::today()->startOfWeek()->toDateString(), [
                'title'   => '📉 Haftalık hedef geride',
                'message' => "Hafta sonuna yaklaştınız; haftalık hedefinizin yalnızca %{$percent}'ine ulaştınız.",
                'metadata' => [
                    'goal_id' => $goal->id,
                    'progress_percent' => $percent,
                ],
            ]);
        }
    }

    private function syncTopicNotifications(User $user): void
    {
        $stats = $this->topicWeeklyStatsService->getWeeklyStatsForUser($user);

        if ($stats->isEmpty()) {
            return;
        }

        $weekKey = Carbon::today()->startOfWeek()->toDateString();
        $unstudied = $stats->filter(fn ($item) => $item['weekly_minutes'] === 0);

        foreach ($unstudied->take(3) as $topic) {
            $this->createIfNotExists($user->id, 'topic_weekly_reminder', "topic_reminder_{$topic['topic_id']}_{$weekKey}", [
                'title'   => '📚 Konuya çalışma zamanı',
                'message' => "Bu hafta \"{$topic['topic_name']}\" ({$topic['subject_name']}) konusuna henüz çalışmadınız.",
                'metadata' => [
                    'topic_id' => $topic['topic_id'],
                    'subject_id' => $topic['subject_id'],
                    'weekly_minutes' => 0,
                ],
            ]);
        }

        $studied = $stats->filter(fn ($item) => $item['weekly_minutes'] > 0);

        if ($studied->isNotEmpty()) {
            $top = $studied->first();
            $totalWeekly = $studied->sum('weekly_minutes');

            $this->createIfNotExists($user->id, 'topic_weekly_summary', "topic_summary_{$weekKey}", [
                'title'   => '📊 Haftalık konu özeti',
                'message' => "Bu hafta toplam {$totalWeekly} dakika çalıştınız. En çok: \"{$top['topic_name']}\" ({$top['weekly_minutes']} dk).",
                'metadata' => [
                    'total_weekly_minutes' => $totalWeekly,
                    'top_topic' => $top['topic_name'],
                    'topics' => $studied->take(5)->values()->all(),
                ],
            ], 168);
        }
    }

    private function goalScopeLabel(Goal $goal): string
    {
        return match ($goal->scope ?? 'general') {
            'subject' => ($goal->subject?->name ?? 'Ders') . ' dersi',
            'topic'   => ($goal->topic?->name ?? 'Konu') . ' konusu',
            default   => 'Genel',
        };
    }

    private function createIfNotExists(int $userId, string $type, string $key, array $payload, int $hours = 24): void
    {
        if ($this->notificationRepository->existsWithKey($userId, $key, $hours)) {
            return;
        }

        $this->notificationRepository->create([
            'user_id'  => $userId,
            'type'     => $type,
            'title'    => $payload['title'],
            'message'  => $payload['message'],
            'metadata' => array_merge($payload['metadata'] ?? [], ['key' => $key]),
            'is_read'  => false,
        ]);
    }
}
