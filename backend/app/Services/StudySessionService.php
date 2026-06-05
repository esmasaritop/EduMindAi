<?php

namespace App\Services;

use App\Models\StudySession;
use App\Models\User;
use App\Repositories\DailyStatRepository;
use App\Repositories\Interfaces\StudySessionRepositoryInterface;
use App\Repositories\StreakRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class StudySessionService
{
    public function __construct(
        private readonly StudySessionRepositoryInterface $studySessionRepository,
        private readonly DailyStatRepository $dailyStatRepository,
        private readonly StreakRepository $streakRepository
    ) {}

    public function getSessionsForUser(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return $this->studySessionRepository->getAllForUser($user->id, $perPage);
    }

    public function createSession(User $user, array $data): StudySession
    {
        $data['user_id'] = $user->id;
        $session = $this->studySessionRepository->create($data);

        $this->recalculateDailyStats($user->id, Carbon::parse($data['started_at'])->toDateString());
        $this->streakRepository->updateStreak($user->id, Carbon::parse($data['started_at'])->toDateString());

        return $session->load('subject');
    }

    public function updateSession(User $user, int $sessionId, array $data): StudySession
    {
        $session = $this->studySessionRepository->findForUser($sessionId, $user->id);

        abort_if(!$session, 404, 'Seans bulunamadı.');

        $oldDate = $session->started_at->toDateString();
        $updatedSession = $this->studySessionRepository->update($session, $data);

        $this->recalculateDailyStats($user->id, $oldDate);

        if (isset($data['started_at'])) {
            $newDate = Carbon::parse($data['started_at'])->toDateString();
            if ($newDate !== $oldDate) {
                $this->recalculateDailyStats($user->id, $newDate);
            }
        }

        return $updatedSession;
    }

    public function deleteSession(User $user, int $sessionId): void
    {
        $session = $this->studySessionRepository->findForUser($sessionId, $user->id);

        abort_if(!$session, 404, 'Seans bulunamadı.');

        $date = $session->started_at->toDateString();
        $this->studySessionRepository->delete($session);
        $this->recalculateDailyStats($user->id, $date);
    }

    public function restoreSession(User $user, int $sessionId): bool
    {
        return $this->studySessionRepository->restore($sessionId, $user->id);
    }

    private function recalculateDailyStats(int $userId, string $date): void
    {
        $totalDuration = $this->studySessionRepository->getTotalDurationForDate($userId, $date);
        $sessionCount = $this->studySessionRepository->getSessionCountForDate($userId, $date);

        $this->dailyStatRepository->upsert($userId, $date, $totalDuration, $sessionCount);
    }
}
