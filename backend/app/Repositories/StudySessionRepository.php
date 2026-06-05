<?php

namespace App\Repositories;

use App\Models\StudySession;
use App\Repositories\Interfaces\StudySessionRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class StudySessionRepository implements StudySessionRepositoryInterface
{
    public function __construct(private readonly StudySession $model) {}

    public function getAllForUser(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->where('user_id', $userId)
            ->with('subject')
            ->orderByDesc('started_at')
            ->paginate($perPage);
    }

    public function findForUser(int $id, int $userId): ?StudySession
    {
        return $this->model
            ->where('id', $id)
            ->where('user_id', $userId)
            ->with('subject')
            ->first();
    }

    public function create(array $data): StudySession
    {
        return $this->model->create($data);
    }

    public function update(StudySession $session, array $data): StudySession
    {
        $session->update($data);
        return $session->fresh('subject');
    }

    public function delete(StudySession $session): bool
    {
        return $session->delete();
    }

    public function restore(int $id, int $userId): bool
    {
        $session = $this->model
            ->onlyTrashed()
            ->where('id', $id)
            ->where('user_id', $userId)
            ->first();

        if (!$session) {
            return false;
        }

        return $session->restore();
    }

    public function getTotalDurationForDate(int $userId, string $date): int
    {
        return (int) $this->model
            ->where('user_id', $userId)
            ->whereDate('started_at', $date)
            ->sum('duration');
    }

    public function getSessionCountForDate(int $userId, string $date): int
    {
        return $this->model
            ->where('user_id', $userId)
            ->whereDate('started_at', $date)
            ->count();
    }

    public function getTotalDurationBetweenDates(int $userId, string $startDate, string $endDate): int
    {
        return (int) $this->model
            ->where('user_id', $userId)
            ->whereDate('started_at', '>=', $startDate)
            ->whereDate('started_at', '<=', $endDate)
            ->sum('duration');
    }

    public function getTotalDurationBetweenDatesForSubject(int $userId, int $subjectId, string $startDate, string $endDate): int
    {
        return (int) $this->model
            ->where('user_id', $userId)
            ->where('subject_id', $subjectId)
            ->whereDate('started_at', '>=', $startDate)
            ->whereDate('started_at', '<=', $endDate)
            ->sum('duration');
    }
}
