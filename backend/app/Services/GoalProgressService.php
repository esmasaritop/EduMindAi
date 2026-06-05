<?php

namespace App\Services;

use App\Models\Goal;
use App\Repositories\Interfaces\StudySessionRepositoryInterface;
use Illuminate\Support\Carbon;

class GoalProgressService
{
    public function __construct(
        private readonly StudySessionRepositoryInterface $studySessionRepository,
        private readonly TopicWeeklyStatsService $topicWeeklyStatsService
    ) {}

    public function applyToGoal(Goal $goal): Goal
    {
        $progress = $this->calculate($goal);

        $goal->setAttribute('current_duration', $progress['current_duration']);
        $goal->setAttribute('progress_percent', $progress['progress_percent']);
        $goal->setAttribute('remaining_minutes', $progress['remaining_minutes']);
        $goal->setAttribute('status', $progress['status']);

        return $goal;
    }

    public function calculate(Goal $goal): array
    {
        [$periodStart, $periodEnd] = $this->resolvePeriod($goal);
        $currentDuration = $this->resolveCurrentDuration($goal, $periodStart, $periodEnd);

        $target = max(1, (int) $goal->target_duration);
        $percent = min(100, (int) round(($currentDuration / $target) * 100));
        $remaining = max(0, $target - $currentDuration);

        return [
            'current_duration'    => $currentDuration,
            'progress_percent'    => $percent,
            'remaining_minutes' => $remaining,
            'status'              => $this->resolveStatus($percent, $goal),
        ];
    }

    private function resolveCurrentDuration(Goal $goal, string $periodStart, string $periodEnd): int
    {
        return match ($goal->scope ?? 'general') {
            'subject' => $this->studySessionRepository->getTotalDurationBetweenDatesForSubject(
                $goal->user_id,
                (int) $goal->subject_id,
                $periodStart,
                $periodEnd
            ),
            'topic' => $this->topicWeeklyStatsService->getTopicDurationBetweenDates(
                $goal->user_id,
                (int) $goal->topic_id,
                $periodStart,
                $periodEnd
            ),
            default => $this->studySessionRepository->getTotalDurationBetweenDates(
                $goal->user_id,
                $periodStart,
                $periodEnd
            ),
        };
    }

    private function resolvePeriod(Goal $goal): array
    {
        $today = Carbon::today();
        $goalStart = Carbon::parse($goal->start_date)->startOfDay();
        $goalEnd = Carbon::parse($goal->end_date)->endOfDay();

        $periodStart = match ($goal->type) {
            'daily'   => $today->copy()->startOfDay(),
            'weekly'  => $today->copy()->startOfWeek(Carbon::MONDAY),
            'monthly' => $today->copy()->startOfMonth(),
            default   => $goalStart,
        };

        $periodEnd = match ($goal->type) {
            'daily'   => $today->copy()->endOfDay(),
            'weekly'  => $today->copy()->endOfWeek(Carbon::SUNDAY),
            'monthly' => $today->copy()->endOfMonth(),
            default   => $goalEnd,
        };

        if ($periodStart->lt($goalStart)) {
            $periodStart = $goalStart->copy();
        }

        if ($periodEnd->gt($goalEnd)) {
            $periodEnd = $goalEnd->copy();
        }

        return [$periodStart->toDateString(), $periodEnd->toDateString()];
    }

    private function resolveStatus(int $percent, Goal $goal): string
    {
        if ($percent >= 100) {
            return 'completed';
        }

        $daysLeft = Carbon::today()->diffInDays(Carbon::parse($goal->end_date), false);

        if ($percent >= 75) {
            return 'approaching';
        }

        if ($daysLeft <= 1) {
            return 'deadline';
        }

        if ($goal->type === 'weekly' && Carbon::today()->isWeekend() && $percent < 50) {
            return 'behind';
        }

        return 'on_track';
    }
}
