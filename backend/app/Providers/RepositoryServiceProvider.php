<?php

namespace App\Providers;

use App\Repositories\DailyStatRepository;
use App\Repositories\GoalRepository;
use App\Repositories\Interfaces\DailyStatRepositoryInterface;
use App\Repositories\Interfaces\GoalRepositoryInterface;
use App\Repositories\Interfaces\NotificationRepositoryInterface;
use App\Repositories\Interfaces\StreakRepositoryInterface;
use App\Repositories\Interfaces\StudySessionRepositoryInterface;
use App\Repositories\Interfaces\SubjectRepositoryInterface;
use App\Repositories\NotificationRepository;
use App\Repositories\StreakRepository;
use App\Repositories\StudySessionRepository;
use App\Repositories\SubjectRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(StudySessionRepositoryInterface::class, StudySessionRepository::class);
        $this->app->bind(GoalRepositoryInterface::class, GoalRepository::class);
        $this->app->bind(NotificationRepositoryInterface::class, NotificationRepository::class);
        $this->app->bind(DailyStatRepositoryInterface::class, DailyStatRepository::class);
        $this->app->bind(StreakRepositoryInterface::class, StreakRepository::class);
        $this->app->bind(SubjectRepositoryInterface::class, SubjectRepository::class);
    }
}
