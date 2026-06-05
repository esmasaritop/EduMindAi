<?php

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\DashboardController;
use App\Http\Controllers\API\GoalController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\QuestionStatController;
use App\Http\Controllers\API\StudySessionController;
use App\Http\Controllers\API\SubjectController;
use App\Http\Controllers\API\TopicController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
        });
    });

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {

        // Dashboard
        Route::get('dashboard', [DashboardController::class, 'index']);

        // Study Sessions
        Route::apiResource('study-sessions', StudySessionController::class)
            ->only(['index', 'store', 'update', 'destroy']);
        Route::patch('study-sessions/{id}/restore', [StudySessionController::class, 'restore']);

        // Subjects
        Route::get('subjects', [SubjectController::class, 'index']);
        Route::post('subjects', [SubjectController::class, 'store']);
        Route::delete('subjects/{id}', [SubjectController::class, 'destroy']);

        // Goals
        Route::get('goals', [GoalController::class, 'index']);
        Route::post('goals', [GoalController::class, 'store']);
        Route::put('goals/{id}', [GoalController::class, 'update']);

        // Topics
        Route::get('subjects/{subjectId}/topics', [TopicController::class, 'index']);
        Route::post('subjects/{subjectId}/topics', [TopicController::class, 'store']);
        Route::put('topics/{id}', [TopicController::class, 'update']);
        Route::patch('topics/{id}/add-time', [TopicController::class, 'addTime']);
        Route::delete('topics/{id}', [TopicController::class, 'destroy']);

        // Question Stats
        Route::get('questions', [QuestionStatController::class, 'index']);
        Route::post('questions/topics/{topicId}', [QuestionStatController::class, 'upsert']);

        // Notifications
        Route::get('notifications/summary', [NotificationController::class, 'summary']);
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
        Route::patch('notifications/{id}/read', [NotificationController::class, 'markRead']);
    });
});
