<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GoalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'scope'             => $this->scope ?? 'general',
            'subject_id'        => $this->subject_id,
            'topic_id'          => $this->topic_id,
            'subject_name'      => $this->subject?->name,
            'topic_name'        => $this->topic?->name,
            'type'              => $this->type,
            'target_duration'   => $this->target_duration,
            'start_date'        => $this->start_date?->toDateString(),
            'end_date'          => $this->end_date?->toDateString(),
            'current_duration'  => $this->when(isset($this->current_duration), $this->current_duration),
            'progress_percent'  => $this->when(isset($this->progress_percent), $this->progress_percent),
            'remaining_minutes' => $this->when(isset($this->remaining_minutes), $this->remaining_minutes),
            'status'            => $this->when(isset($this->status), $this->status),
            'created_at'        => $this->created_at?->toIso8601String(),
        ];
    }
}
