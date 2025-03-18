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
        Schema::create('process_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('process_id')->constrained()->onDelete('cascade');
            $table->foreignId('approver_id')->nullable()->comment('approver_id is user id employee who assigned to this workflow')->constrained('users');
            $table->foreignId('designation_id')->nullable()->comment('Get ID From Designation')->constrained('designations', 'id');
            $table->integer('order')->default(0)->comment('Step sequence in workflow');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('timeout_days')->nullable()->comment('Auto-expire after X days');
            $table->foreignId('created_by')->nullable()->constrained('users', 'id');
            $table->foreignId('updated_by')->nullable()->constrained('users', 'id');
            $table->timestamps();
            $table->index(['process_id', 'order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('process_steps');
    }
};
