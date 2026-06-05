<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Interfaces\NotificationRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class NotificationService
{
    public function __construct(
        private readonly NotificationRepositoryInterface $notificationRepository,
        private readonly NotificationGeneratorService $notificationGeneratorService
    ) {}

    public function getNotificationsForUser(User $user, ?string $type = null, int $perPage = 15): LengthAwarePaginator
    {
        $this->notificationGeneratorService->syncForUser($user);

        return $this->notificationRepository->getAllForUser($user->id, $perPage, $type);
    }

    public function markAllAsRead(User $user): void
    {
        $this->notificationRepository->markAllAsRead($user->id);
    }

    public function markAsRead(User $user, int $notificationId): bool
    {
        return $this->notificationRepository->markAsRead($user->id, $notificationId);
    }

    public function getSummary(User $user): array
    {
        $this->notificationGeneratorService->syncForUser($user);

        return [
            'unread_count' => $this->notificationRepository->getUnreadCountForUser($user->id),
        ];
    }
}
