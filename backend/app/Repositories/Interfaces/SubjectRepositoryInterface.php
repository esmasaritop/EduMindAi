<?php

namespace App\Repositories\Interfaces;

use App\Models\Subject;
use Illuminate\Database\Eloquent\Collection;

interface SubjectRepositoryInterface
{
    public function getAllForUser(int $userId): Collection;

    public function findForUser(int $id, int $userId): ?Subject;

    public function create(array $data): Subject;

    public function delete(Subject $subject): bool;
}
