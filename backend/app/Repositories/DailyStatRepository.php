<?php

namespace App\Repositories;

use App\Models\DailyStat;
use App\Repositories\Interfaces\DailyStatRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

class DailyStatRepository implements DailyStatRepositoryInterface
{
    public function __construct(private readonly DailyStat $model) {}

    public function getForUserAndDate(int $userId, string $date): ?DailyStat
    {
        return $this->model
            ->where('user_id', $userId)
            ->whereDate('date', $date)
            ->first();
    }

    public function upsert(int $userId, string $date, int $totalDuration, int $sessionCount): DailyStat
    {
        return $this->model->updateOrCreate(
            ['user_id' => $userId, 'date' => $date],
            ['total_duration' => $totalDuration, 'session_count' => $sessionCount]
        );
    }

    public function getRecentForUser(int $userId, int $days = 7): Collection
    {
        return $this->model
            ->where('user_id', $userId)
            ->where('date', '>=', Carbon::today()->subDays($days - 1)->toDateString())
            ->orderBy('date')
            ->get();
    }
}
