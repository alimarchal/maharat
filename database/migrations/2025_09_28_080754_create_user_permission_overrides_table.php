<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_permission_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('permission_name');
            $table->boolean('is_enabled')->default(true);
            $table->boolean('overrides_role')->default(false);
            $table->timestamps();
            
            // Ensure one override per user per permission
            $table->unique(['user_id', 'permission_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_permission_overrides');
    }
};