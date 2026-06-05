<?php

namespace App\Repositories\Interfaces;

use App\Models\Streak;

interface StreakRepositoryInterface
{
    public function getForUser(int $userId): ?Streak;

    public function updateStreak(int $userId, string $studyDate): Streak;

    public function createForUser(int $userId): Streak;
}
