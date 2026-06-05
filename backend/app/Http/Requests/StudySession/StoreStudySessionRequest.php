<?php

namespace App\Http\Requests\StudySession;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudySessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'subject_id'   => ['required', 'integer', 'exists:subjects,id'],
            'duration'     => ['required', 'integer', 'min:1'],
            'started_at'   => ['required', 'date'],
            'ended_at'     => ['nullable', 'date', 'after:started_at'],
            'session_type' => ['required', 'in:manual,timer'],
            'notes'        => ['nullable', 'string', 'max:1000'],
        ];
    }
}
