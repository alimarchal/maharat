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
            $table->foreignId('user_id')->comment('Employee assigned to this workflow step')->constrained('users');
            $table->integer('order')->default(0)->comment('Step sequence in workflow');
            //$table->string('name')->nullable()->comment('Step name like "Manager Approval", "Finance Review"');
            $table->text('description')->nullable();
            // $table->text('conditions')->nullable()->comment('Conditional logic for approval');
            // $table->enum('status', ['Pending', 'In Progress', 'Approved', 'Rejected', 'Skipped'])->default('Pending');
            // $table->json('required_fields')->nullable()->comment('Fields that must be filled before proceeding');
            $table->boolean('is_active')->default(true);
            $table->integer('timeout_days')->nullable()->comment('Auto-expire after X days');
            $table->foreignId('created_by')->nullable()->constrained('users', 'id');
            $table->foreignId('updated_by')->nullable()->constrained('users', 'id');
            $table->timestamps();
            $table->softDeletes();

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
