<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('topic_study_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('topic_id')->constrained()->onDelete('cascade');
            $table->unsignedInteger('minutes');
            $table->date('studied_at');
            $table->timestamps();

            $table->index(['user_id', 'studied_at']);
            $table->index(['topic_id', 'studied_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('topic_study_logs');
    }
};
