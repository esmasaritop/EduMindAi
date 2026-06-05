<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $type = $request->query('type');
        $perPage = min(100, max(1, (int) $request->query('per_page', 50)));

        $notifications = $this->notificationService->getNotificationsForUser(
            $request->user(),
            is_string($type) && $type !== 'all' ? $type : null,
            $perPage
        );

        return NotificationResource::collection($notifications);
    }

    public function summary(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->notificationService->getSummary($request->user()),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $this->notificationService->markAllAsRead($request->user());

        return response()->json(['message' => 'Tüm bildirimler okundu olarak işaretlendi.']);
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $updated = $this->notificationService->markAsRead($request->user(), $id);

        if (!$updated) {
            return response()->json(['message' => 'Bildirim bulunamadı.'], 404);
        }

        return response()->json(['message' => 'Bildirim okundu olarak işaretlendi.']);
    }
}
