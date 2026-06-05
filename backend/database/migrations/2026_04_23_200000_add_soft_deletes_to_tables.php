<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('study_sessions', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('goals', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('subjects', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('ai_recommendations', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('study_sessions', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('goals', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('ai_recommendations', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
