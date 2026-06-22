<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\AiRecommendationResource;
use App\Services\AiRecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

class AiRecommendationController extends Controller
{
    public function __construct(private readonly AiRecommendationService $aiRecommendationService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $recommendations = $this->aiRecommendationService->getRecentForUser($request->user());

        return AiRecommendationResource::collection($recommendations);
    }

    public function generate(Request $request): JsonResponse|AnonymousResourceCollection
    {
        try {
            $recommendations = $this->aiRecommendationService->generateForUser(
                $request->user(),
                $request->boolean('force')
            );
        } catch (RuntimeException $e) {
            $isCooldown = str_contains($e->getMessage(), 'beklemen gerekiyor');
            $status = $isCooldown ? 429 : 502;

            return response()->json([
                'message' => $e->getMessage(),
                'cooldown_remaining_minutes' => $this->aiRecommendationService
                    ->getCooldownRemainingMinutes($request->user()),
            ], $status);
        }

        return response()->json([
            'data' => AiRecommendationResource::collection($recommendations),
            'message' => 'AI önerileri oluşturuldu.',
        ]);
    }

    public function status(Request $request): JsonResponse
    {
        $cooldown = $this->aiRecommendationService->getCooldownRemainingMinutes($request->user());

        return response()->json([
            'data' => [
                'can_generate'               => $cooldown === 0,
                'cooldown_remaining_minutes' => $cooldown,
            ],
        ]);
    }
}
