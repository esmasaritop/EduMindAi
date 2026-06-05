<?php

namespace App\Repositories;

use App\Models\Streak;
use App\Repositories\Interfaces\StreakRepositoryInterface;
use Illuminate\Support\Carbon;

class StreakRepository implements StreakRepositoryInterface
{
    public function __construct(private readonly Streak $model) {}

    public function getForUser(int $userId): ?Streak
    {
        return $this->model->where('user_id', $userId)->first();
    }

    public function createForUser(int $userId): Streak
    {
        return $this->model->create([
            'user_id'          => $userId,
            'current_streak'   => 0,
            'longest_streak'   => 0,
            'last_study_date'  => null,
        ]);
    }

    public function updateStreak(int $userId, string $studyDate): Streak
    {
        $streak = $this->getForUser($userId) ?? $this->createForUser($userId);
        $today = Carbon::parse($studyDate)->toDateString();
        $yesterday = Carbon::parse($studyDate)->subDay()->toDateString();

        if ($streak->last_study_date === $today) {
            return $streak;
        }

        if ($streak->last_study_date === $yesterday) {
            $streak->current_streak += 1;
        } else {
            $streak->current_streak = 1;
        }

        if ($streak->current_streak > $streak->longest_streak) {
            $streak->longest_streak = $streak->current_streak;
        }

        $streak->last_study_date = $today;
        $streak->save();

        return $streak;
    }
}
