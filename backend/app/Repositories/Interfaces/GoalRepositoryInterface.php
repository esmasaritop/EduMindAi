<?php

namespace App\Repositories\Interfaces;

use App\Models\Goal;
use Illuminate\Database\Eloquent\Collection;

interface GoalRepositoryInterface
{
    public function getAllForUser(int $userId): Collection;

    public function create(array $data): Goal;

    public function getActiveGoalsForUser(int $userId): Collection;
}
