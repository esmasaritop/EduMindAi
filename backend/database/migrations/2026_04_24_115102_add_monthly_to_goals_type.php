<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Laravel PostgreSQL'de enum() bir CHECK constraint olarak oluşturulur.
        // Mevcut constraint'i kaldırıp monthly değerini ekleyerek yeniden oluşturuyoruz.
        DB::statement("ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_type_check");
        DB::statement("ALTER TABLE goals ADD CONSTRAINT goals_type_check CHECK (type IN ('daily', 'weekly', 'monthly'))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_type_check");
        DB::statement("ALTER TABLE goals ADD CONSTRAINT goals_type_check CHECK (type IN ('daily', 'weekly'))");
    }
};
