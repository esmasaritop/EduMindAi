<?php

namespace App\Repositories;

use App\Models\Goal;
use App\Repositories\Interfaces\GoalRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

class GoalRepository implements GoalRepositoryInterface
{
    public function __construct(private readonly Goal $model) {}

    public function getAllForUser(int $userId): Collection
    {
        return $this->model
            ->where('user_id', $userId)
            ->with(['subject', 'topic'])
            ->orderByDesc('created_at')
            ->get();
    }

    public function create(array $data): Goal
    {
        return $this->model->create($data);
    }

    public function getActiveGoalsForUser(int $userId): Collection
    {
        $today = Carbon::today()->toDateString();

        return $this->model
            ->where('user_id', $userId)
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->with(['subject', 'topic'])
            ->get();
    }
}
