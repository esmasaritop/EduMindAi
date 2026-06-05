<?php

namespace App\Repositories\Interfaces;

use App\Models\StudySession;
use Illuminate\Pagination\LengthAwarePaginator;

interface StudySessionRepositoryInterface
{
    public function getAllForUser(int $userId, int $perPage = 15): LengthAwarePaginator;

    public function findForUser(int $id, int $userId): ?StudySession;

    public function create(array $data): StudySession;

    public function update(StudySession $session, array $data): StudySession;

    public function delete(StudySession $session): bool;

    public function restore(int $id, int $userId): bool;

    public function getTotalDurationForDate(int $userId, string $date): int;

    public function getSessionCountForDate(int $userId, string $date): int;

    public function getTotalDurationBetweenDates(int $userId, string $startDate, string $endDate): int;

    public function getTotalDurationBetweenDatesForSubject(int $userId, int $subjectId, string $startDate, string $endDate): int;
}
