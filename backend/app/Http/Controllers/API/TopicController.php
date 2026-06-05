<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\Topic;
use App\Services\QuestionStatService;
use App\Services\TopicWeeklyStatsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TopicController extends Controller
{
    public function __construct(
        private readonly TopicWeeklyStatsService $topicWeeklyStatsService,
        private readonly QuestionStatService $questionStatService
    ) {}

    public function index(Request $request, int $subjectId): JsonResponse
    {
        $topics = Topic::where('user_id', $request->user()->id)
            ->where('subject_id', $subjectId)
            ->withTrashed(false)
            ->with('questionStat')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $topics]);
    }

    public function store(Request $request, int $subjectId): JsonResponse
    {
        $validated = $request->validate([
            'name'            => ['required', 'string', 'max:200'],
            'track_questions' => ['boolean'],
        ]);

        $topic = Topic::create([
            'user_id'         => $request->user()->id,
            'subject_id'      => $subjectId,
            'name'            => $validated['name'],
            'track_questions' => $validated['track_questions'] ?? false,
            'study_time_minutes' => 0,
        ]);

        if ($topic->track_questions) {
            $this->questionStatService->ensureStatForTopic($request->user()->id, $topic->id);
        }

        return response()->json(['data' => $topic], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $topic = Topic::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'name'                => ['sometimes', 'string', 'max:200'],
            'track_questions'     => ['sometimes', 'boolean'],
            'study_time_minutes'  => ['sometimes', 'integer', 'min:0'],
        ]);

        $topic->update($validated);

        if (!empty($validated['track_questions'])) {
            $this->questionStatService->ensureStatForTopic($request->user()->id, $topic->id);
        }

        return response()->json(['data' => $topic->fresh()]);
    }

    public function addTime(Request $request, int $id): JsonResponse
    {
        $topic = Topic::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'minutes' => ['required', 'integer', 'min:1'],
        ]);

        $topic->increment('study_time_minutes', $validated['minutes']);
        $this->topicWeeklyStatsService->logStudyTime(
            $request->user()->id,
            $topic->id,
            $validated['minutes']
        );

        return response()->json(['data' => $topic->fresh()]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $topic = Topic::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $topic->delete();

        return response()->json(['message' => 'Konu silindi.']);
    }
}
