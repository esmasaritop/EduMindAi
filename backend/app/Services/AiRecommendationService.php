<?php

namespace App\Services;

use App\Models\AiRecommendation;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use RuntimeException;

class AiRecommendationService
{
    private const COOLDOWN_HOURS = 1;

    private const SYSTEM_PROMPT = <<<'PROMPT'
Sen EduMindAI adlı bir öğrenci çalışma koçusun. Öğrencinin çalışma verilerine bakarak kısa, somut ve motive edici öneriler üretiyorsun.

Kurallar:
- Yanıtı yalnızca geçerli JSON olarak ver.
- Türkçe yaz.
- Öğrenciye "sen" diye hitap et.
- Veriye dayalı konuş; uydurma istatistik kullanma.
- Her öneri en fazla 2 cümle olsun.
- 2 ile 4 arasında öneri üret.
- type alanı yalnızca "suggestion" veya "warning" olabilir.
- Zayıf konular, ihmal edilen konular, hedef geride kalma veya düşük doğruluk oranı için "warning" kullan.
- İyi gidişat veya fırsatlar için "suggestion" kullan.

JSON şeması:
{
  "recommendations": [
    { "type": "suggestion", "content": "..." }
  ]
}
PROMPT;

    public function __construct(
        private readonly StudentContextService $studentContextService,
        private readonly GeminiService $geminiService,
    ) {}

    public function getRecentForUser(User $user, int $limit = 5): Collection
    {
        return AiRecommendation::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function generateForUser(User $user, bool $force = false): Collection
    {
        if (!$force && $this->isOnCooldown($user)) {
            throw new RuntimeException('Yeni öneri almak için biraz beklemen gerekiyor.');
        }

        $context = $this->studentContextService->buildForUser($user);
        $userPrompt = "Öğrenci çalışma verileri:\n" . json_encode($context, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        $result = $this->geminiService->generateJson(
            self::SYSTEM_PROMPT,
            $userPrompt,
            self::responseSchema()
        );
        $items = $result['recommendations'] ?? [];

        if (!is_array($items) || count($items) === 0) {
            throw new RuntimeException('AI öneri üretemedi.');
        }

        $saved = collect();

        foreach (array_slice($items, 0, 4) as $item) {
            $type = ($item['type'] ?? '') === 'warning' ? 'warning' : 'suggestion';
            $content = trim((string) ($item['content'] ?? ''));

            if ($content === '') {
                continue;
            }

            $saved->push(
                AiRecommendation::create([
                    'user_id' => $user->id,
                    'type'    => $type,
                    'content' => $content,
                ])
            );
        }

        if ($saved->isEmpty()) {
            throw new RuntimeException('AI öneri üretemedi.');
        }

        return $saved;
    }

    public function getCooldownRemainingMinutes(User $user): int
    {
        $latest = AiRecommendation::query()
            ->where('user_id', $user->id)
            ->latest()
            ->first();

        if (!$latest) {
            return 0;
        }

        $nextAllowed = $latest->created_at->copy()->addHours(self::COOLDOWN_HOURS);

        if (Carbon::now()->gte($nextAllowed)) {
            return 0;
        }

        return (int) Carbon::now()->diffInMinutes($nextAllowed, false);
    }

    private function isOnCooldown(User $user): bool
    {
        return $this->getCooldownRemainingMinutes($user) > 0;
    }

    private static function responseSchema(): array
    {
        return [
            'type'       => 'object',
            'properties' => [
                'recommendations' => [
                    'type'  => 'array',
                    'items' => [
                        'type'       => 'object',
                        'properties' => [
                            'type'    => ['type' => 'string', 'enum' => ['suggestion', 'warning']],
                            'content' => ['type' => 'string'],
                        ],
                        'required' => ['type', 'content'],
                    ],
                ],
            ],
            'required' => ['recommendations'],
        ];
    }
}
