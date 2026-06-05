<?php

namespace App\Http\Requests\Goal;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user()->id;
        $scope = $this->input('scope', 'general');

        $typeRule = match ($scope) {
            'general' => ['required', 'in:daily,weekly,monthly'],
            default   => ['required', 'in:weekly,monthly'],
        };

        return [
            'scope'           => ['required', 'in:general,subject,topic'],
            'subject_id'      => [
                Rule::requiredIf(in_array($scope, ['subject', 'topic'], true)),
                'nullable',
                'integer',
                Rule::exists('subjects', 'id')->where(fn ($q) => $q->where('user_id', $userId)),
            ],
            'topic_id'        => [
                Rule::requiredIf($scope === 'topic'),
                'nullable',
                'integer',
                Rule::exists('topics', 'id')->where(fn ($q) => $q->where('user_id', $userId)),
            ],
            'type'            => $typeRule,
            'target_duration' => ['required', 'integer', 'min:1'],
            'start_date'      => ['required', 'date'],
            'end_date'        => ['required', 'date', 'after_or_equal:start_date'],
        ];
    }

    public function messages(): array
    {
        return [
            'subject_id.required' => 'Ders seçimi zorunludur.',
            'topic_id.required'   => 'Konu seçimi zorunludur.',
        ];
    }
}
