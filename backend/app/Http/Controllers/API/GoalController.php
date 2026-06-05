<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Goal\StoreGoalRequest;
use App\Http\Resources\GoalResource;
use App\Models\Goal;
use App\Services\GoalProgressService;
use App\Services\GoalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class GoalController extends Controller
{
    public function __construct(
        private readonly GoalService $goalService,
        private readonly GoalProgressService $goalProgressService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $goals = $this->goalService->getGoalsForUser($request->user());

        return GoalResource::collection($goals);
    }

    public function store(StoreGoalRequest $request): JsonResponse
    {
        $goal = $this->goalService->createGoal($request->user(), $request->validated());

        return response()->json([
            'message' => 'Hedef başarıyla oluşturuldu.',
            'data'    => new GoalResource($goal),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $goal = Goal::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'type'            => ['sometimes', 'in:daily,weekly,monthly'],
            'target_duration' => ['sometimes', 'integer', 'min:1'],
            'start_date'      => ['sometimes', 'date'],
            'end_date'        => ['sometimes', 'date', 'after_or_equal:start_date'],
        ]);

        $goal->update($validated);

        return response()->json([
            'message' => 'Hedef güncellendi.',
            'data'    => new GoalResource($this->goalProgressService->applyToGoal($goal->fresh())),
        ]);
    }
}
