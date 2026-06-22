<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class GeminiService
{
    private const MAX_ATTEMPTS = 3;

    public function generateJson(string $systemPrompt, string $userPrompt, ?array $responseSchema = null): array
    {
        $apiKey = config('services.gemini.api_key');
        $model = config('services.gemini.model', 'gemini-2.5-flash');

        if (empty($apiKey)) {
            throw new RuntimeException('Gemini API anahtarı yapılandırılmamış.');
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

        $generationConfig = [
            'temperature'      => 0.7,
            'maxOutputTokens'  => 2048,
            'responseMimeType' => 'application/json',
            'thinkingConfig'   => [
                'thinkingBudget' => 0,
            ],
        ];

        if ($responseSchema !== null) {
            $generationConfig['responseSchema'] = $responseSchema;
        }

        $lastError = 'AI yanıtı işlenemedi.';

        for ($attempt = 1; $attempt <= self::MAX_ATTEMPTS; $attempt++) {
            $response = Http::timeout(90)
                ->withQueryParameters(['key' => $apiKey])
                ->post($url, [
                    'system_instruction' => [
                        'parts' => [['text' => $systemPrompt]],
                    ],
                    'contents' => [
                        [
                            'role' => 'user',
                            'parts' => [['text' => $userPrompt]],
                        ],
                    ],
                    'generationConfig' => $generationConfig,
                ]);

            if (!$response->successful()) {
                $lastError = $this->mapHttpError($response->status(), $response->body());

                Log::warning('Gemini API hatası', [
                    'attempt' => $attempt,
                    'status'  => $response->status(),
                    'body'    => substr($response->body(), 0, 500),
                ]);

                if ($this->shouldRetryHttp($response->status()) && $attempt < self::MAX_ATTEMPTS) {
                    usleep(500_000 * $attempt);

                    continue;
                }

                throw new RuntimeException($lastError);
            }

            $decoded = $this->parseResponse($response->json());

            if ($decoded !== null) {
                return $decoded;
            }

            Log::warning('Gemini JSON ayrıştırma hatası', [
                'attempt'      => $attempt,
                'finishReason' => $response->json('candidates.0.finishReason'),
                'rawText'      => substr($this->extractRawText($response->json()) ?? '', 0, 500),
            ]);

            if ($attempt < self::MAX_ATTEMPTS) {
                usleep(500_000 * $attempt);

                continue;
            }
        }

        throw new RuntimeException($lastError);
    }

    private function parseResponse(?array $payload): ?array
    {
        $rawText = $this->extractRawText($payload);

        if ($rawText === null || trim($rawText) === '') {
            return null;
        }

        return $this->decodeJsonText($rawText);
    }

    private function extractRawText(?array $payload): ?string
    {
        $parts = $payload['candidates'][0]['content']['parts'] ?? [];

        if (!is_array($parts) || $parts === []) {
            return null;
        }

        $texts = [];

        foreach ($parts as $part) {
            if (!is_array($part)) {
                continue;
            }

            $text = $part['text'] ?? null;

            if (is_string($text) && trim($text) !== '') {
                $texts[] = trim($text);
            }
        }

        if ($texts === []) {
            return null;
        }

        return end($texts);
    }

    private function decodeJsonText(string $text): ?array
    {
        $candidates = [
            $text,
            $this->stripMarkdownFence($text),
            $this->extractJsonObject($text),
        ];

        foreach (array_filter($candidates) as $candidate) {
            $decoded = json_decode($candidate, true);

            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    private function stripMarkdownFence(string $text): string
    {
        $trimmed = trim($text);

        if (!str_starts_with($trimmed, '```')) {
            return $trimmed;
        }

        return trim(preg_replace('/^```(?:json)?\s*|\s*```$/s', '', $trimmed) ?? $trimmed);
    }

    private function extractJsonObject(string $text): ?string
    {
        $start = strpos($text, '{');
        $end = strrpos($text, '}');

        if ($start === false || $end === false || $end <= $start) {
            return null;
        }

        return substr($text, $start, $end - $start + 1);
    }

    private function shouldRetryHttp(int $status): bool
    {
        return in_array($status, [429, 500, 503], true);
    }

    private function mapHttpError(int $status, string $body): string
    {
        if ($status === 429) {
            return 'AI kotası dolmuş. Biraz sonra tekrar dene.';
        }

        if ($status === 503) {
            return 'AI servisi şu an yoğun. Birkaç saniye sonra tekrar dene.';
        }

        Log::error('Gemini API hatası', ['status' => $status, 'body' => substr($body, 0, 500)]);

        return 'AI servisi şu anda yanıt veremiyor.';
    }
}
