<?php

namespace App\Repositories;

use App\Models\Notification;
use App\Repositories\Interfaces\NotificationRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class NotificationRepository implements NotificationRepositoryInterface
{
    public function __construct(private readonly Notification $model) {}

    public function getAllForUser(int $userId, int $perPage = 15, ?string $type = null): LengthAwarePaginator
    {
        return $this->model
            ->where('user_id', $userId)
            ->when($type && $type !== 'all', fn ($query) => $query->where('type', $type))
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function markAllAsRead(int $userId): void
    {
        $this->model
            ->where('user_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);
    }

    public function markAsRead(int $userId, int $notificationId): bool
    {
        return (bool) $this->model
            ->where('user_id', $userId)
            ->where('id', $notificationId)
            ->update(['is_read' => true]);
    }

    public function getUnreadCountForUser(int $userId): int
    {
        return $this->model
            ->where('user_id', $userId)
            ->where('is_read', false)
            ->count();
    }

    public function create(array $data): Notification
    {
        return $this->model->create($data);
    }

    public function existsWithKey(int $userId, string $key, int $hours = 24): bool
    {
        return $this->model
            ->where('user_id', $userId)
            ->where('metadata->key', $key)
            ->where('created_at', '>=', Carbon::now()->subHours($hours))
            ->exists();
    }
}
