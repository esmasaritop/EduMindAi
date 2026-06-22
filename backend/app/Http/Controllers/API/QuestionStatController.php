<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Topic;
use App\Services\QuestionStatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuestionStatController extends Controller
{
    public function __construct(private readonly QuestionStatService $questionStatService) {}

    public function index(Request $request): JsonResponse
    {
        $stats = $this->questionStatService->getTrackedStatsForUser($request->user());

        return response()->json(['data' => $stats->values()]);
    }

    public function upsert(Request $request, int $topicId): JsonResponse
    {
        $topic = Topic::where('id', $topicId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'total_questions' => ['required', 'integer', 'min:0'],
            'correct'         => ['required', 'integer', 'min:0'],
            'wrong'           => ['required', 'integer', 'min:0'],
            'empty'           => ['required', 'integer', 'min:0'],
        ]);

        $stat = $this->questionStatService->ensureStatForTopic($request->user()->id, $topicId);
        $stat->update($validated);

        if (!$topic->track_questions) {
            $topic->update(['track_questions' => true]);
        }

        $stat->load(['topic.subject']);

        return response()->json(['data' => $stat]);
    }

    public function add(Request $request, int $topicId): JsonResponse
    {
        $topic = Topic::where('id', $topicId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'total_questions' => ['sometimes', 'integer', 'min:0'],
            'correct'         => ['sometimes', 'integer', 'min:0'],
            'wrong'           => ['sometimes', 'integer', 'min:0'],
            'empty'           => ['sometimes', 'integer', 'min:0'],
        ]);

        $hasIncrement = collect(['total_questions', 'correct', 'wrong', 'empty'])
            ->some(fn (string $key) => ($validated[$key] ?? 0) > 0);

        if (!$hasIncrement) {
            return response()->json(['message' => 'En az bir alan 0\'dan büyük olmalı.'], 422);
        }

        $stat = $this->questionStatService->ensureStatForTopic($request->user()->id, $topicId);
        $stat = $this->questionStatService->addToStat($stat, $validated);

        if (!$topic->track_questions) {
            $topic->update(['track_questions' => true]);
        }

        $stat->load(['topic.subject']);

        return response()->json(['data' => $stat]);
    }
}
