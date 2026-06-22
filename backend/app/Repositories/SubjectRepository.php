<?php

namespace App\Repositories;

use App\Models\Subject;
use App\Repositories\Interfaces\SubjectRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class SubjectRepository implements SubjectRepositoryInterface
{
    public function __construct(private readonly Subject $model) {}

    public function getAllForUser(int $userId): Collection
    {
        return $this->model
            ->where('user_id', $userId)
            ->orderBy('name')
            ->get();
    }

    public function findForUser(int $id, int $userId): ?Subject
    {
        return $this->model
            ->where('id', $id)
            ->where('user_id', $userId)
            ->first();
    }

    public function create(array $data): Subject
    {
        return $this->model->create($data);
    }

    public function update(Subject $subject, array $data): Subject
    {
        $subject->update($data);

        return $subject->fresh();
    }

    public function delete(Subject $subject): bool
    {
        return $subject->delete();
    }
}
