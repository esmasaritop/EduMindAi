<?php

namespace App\Services;

use App\Models\Goal;
use App\Models\User;
use App\Repositories\Interfaces\GoalRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class GoalService
{
    public function __construct(
        private readonly GoalRepositoryInterface $goalRepository,
        private readonly GoalProgressService $goalProgressService
    ) {}

    public function getGoalsForUser(User $user): Collection
    {
        return $this->goalRepository->getAllForUser($user->id)
            ->map(fn (Goal $goal) => $this->goalProgressService->applyToGoal($goal));
    }

    public function createGoal(User $user, array $data): Goal
    {
        $data['user_id'] = $user->id;
        $data = $this->normalizeScopeData($data);
        $goal = $this->goalRepository->create($data);
        $goal->load(['subject', 'topic']);

        return $this->goalProgressService->applyToGoal($goal);
    }

    private function normalizeScopeData(array $data): array
    {
        $scope = $data['scope'] ?? 'general';

        if ($scope === 'general') {
            $data['subject_id'] = null;
            $data['topic_id'] = null;
        } elseif ($scope === 'subject') {
            $data['topic_id'] = null;
        }

        return $data;
    }
}
