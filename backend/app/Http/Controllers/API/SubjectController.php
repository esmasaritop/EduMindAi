<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Subject\StoreSubjectRequest;
use App\Http\Requests\Subject\UpdateSubjectRequest;
use App\Http\Resources\SubjectResource;
use App\Services\SubjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SubjectController extends Controller
{
    public function __construct(private readonly SubjectService $subjectService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $subjects = $this->subjectService->getSubjectsForUser($request->user());

        return SubjectResource::collection($subjects);
    }

    public function store(StoreSubjectRequest $request): JsonResponse
    {
        $subject = $this->subjectService->createSubject($request->user(), $request->validated());

        return response()->json([
            'message' => 'Ders başarıyla oluşturuldu.',
            'data'    => new SubjectResource($subject),
        ], 201);
    }

    public function update(UpdateSubjectRequest $request, int $id): JsonResponse
    {
        $subject = $this->subjectService->updateSubject($request->user(), $id, $request->validated());

        return response()->json([
            'message' => 'Ders başarıyla güncellendi.',
            'data'    => new SubjectResource($subject),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->subjectService->deleteSubject($request->user(), $id);

        return response()->json(['message' => 'Ders başarıyla silindi.']);
    }
}
