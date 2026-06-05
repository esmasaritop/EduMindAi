<?php

namespace App\Services;

use App\Models\Subject;
use App\Models\User;
use App\Repositories\Interfaces\SubjectRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class SubjectService
{
    public function __construct(
        private readonly SubjectRepositoryInterface $subjectRepository
    ) {}

    public function getSubjectsForUser(User $user): Collection
    {
        return $this->subjectRepository->getAllForUser($user->id);
    }

    public function createSubject(User $user, array $data): Subject
    {
        return $this->subjectRepository->create([
            'name'    => $data['name'],
            'user_id' => $user->id,
        ]);
    }

    public function deleteSubject(User $user, int $subjectId): void
    {
        $subject = $this->subjectRepository->findForUser($subjectId, $user->id);

        abort_if(!$subject, 404, 'Ders bulunamadı.');

        $this->subjectRepository->delete($subject);
    }
}
