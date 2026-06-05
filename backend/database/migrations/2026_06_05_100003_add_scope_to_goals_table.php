<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('goals', function (Blueprint $table) {
            $table->string('scope')->default('general')->after('user_id');
            $table->foreignId('subject_id')->nullable()->after('scope')->constrained()->nullOnDelete();
            $table->foreignId('topic_id')->nullable()->after('subject_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('goals', function (Blueprint $table) {
            $table->dropConstrainedForeignId('topic_id');
            $table->dropConstrainedForeignId('subject_id');
            $table->dropColumn('scope');
        });
    }
};
