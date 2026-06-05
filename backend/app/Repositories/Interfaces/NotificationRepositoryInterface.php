<?php

namespace App\Repositories\Interfaces;

use Illuminate\Pagination\LengthAwarePaginator;

interface NotificationRepositoryInterface
{
    public function getAllForUser(int $userId, int $perPage = 15, ?string $type = null): LengthAwarePaginator;

    public function markAllAsRead(int $userId): void;

    public function markAsRead(int $userId, int $notificationId): bool;

    public function getUnreadCountForUser(int $userId): int;

    public function create(array $data): \App\Models\Notification;

    public function existsWithKey(int $userId, string $key, int $hours = 24): bool;
}
