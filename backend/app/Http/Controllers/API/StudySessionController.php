<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StudySession\StoreStudySessionRequest;
use App\Http\Requests\StudySession\UpdateStudySessionRequest;
use App\Http\Resources\StudySessionResource;
use App\Services\StudySessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StudySessionController extends Controller
{
    public function __construct(private readonly StudySessionService $studySessionService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $sessions = $this->studySessionService->getSessionsForUser($request->user());

        return StudySessionResource::collection($sessions);
    }

    public function store(StoreStudySessionRequest $request): JsonResponse
    {
        $session = $this->studySessionService->createSession($request->user(), $request->validated());

        return response()->json([
            'message' => 'Seans başarıyla oluşturuldu.',
            'data'    => new StudySessionResource($session),
        ], 201);
    }

    public function update(UpdateStudySessionRequest $request, int $id): JsonResponse
    {
        $session = $this->studySessionService->updateSession($request->user(), $id, $request->validated());

        return response()->json([
            'message' => 'Seans başarıyla güncellendi.',
            'data'    => new StudySessionResource($session),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->studySessionService->deleteSession($request->user(), $id);

        return response()->json(['message' => 'Seans başarıyla silindi.']);
    }

    public function restore(Request $request, int $id): JsonResponse
    {
        $restored = $this->studySessionService->restoreSession($request->user(), $id);

        abort_if(!$restored, 404, 'Seans bulunamadı.');

        return response()->json(['message' => 'Seans başarıyla geri yüklendi.']);
    }
}
