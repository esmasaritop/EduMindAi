<?php

namespace App\Repositories\Interfaces;

use App\Models\DailyStat;
use Illuminate\Database\Eloquent\Collection;

interface DailyStatRepositoryInterface
{
    public function getForUserAndDate(int $userId, string $date): ?DailyStat;

    public function upsert(int $userId, string $date, int $totalDuration, int $sessionCount): DailyStat;

    public function getRecentForUser(int $userId, int $days = 7): Collection;
}
