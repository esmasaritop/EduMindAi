<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudySessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'subject'      => $this->whenLoaded('subject', fn () => [
                'id'   => $this->subject->id,
                'name' => $this->subject->name,
            ]),
            'duration'     => $this->duration,
            'started_at'   => $this->started_at?->toIso8601String(),
            'ended_at'     => $this->ended_at?->toIso8601String(),
            'session_type' => $this->session_type,
            'notes'        => $this->notes,
            'created_at'   => $this->created_at?->toIso8601String(),
        ];
    }
}
