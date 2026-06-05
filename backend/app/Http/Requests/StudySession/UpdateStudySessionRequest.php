<?php

namespace App\Http\Requests\StudySession;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudySessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'subject_id'   => ['sometimes', 'integer', 'exists:subjects,id'],
            'duration'     => ['sometimes', 'integer', 'min:1'],
            'started_at'   => ['sometimes', 'date'],
            'ended_at'     => ['nullable', 'date', 'after:started_at'],
            'session_type' => ['sometimes', 'in:manual,timer'],
            'notes'        => ['nullable', 'string', 'max:1000'],
        ];
    }
}
