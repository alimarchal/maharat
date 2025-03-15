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
        Schema::create('budget_request_approval_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_budgets_id')->nullable()->constrained('request_budgets', 'id');
            $table->foreignId('requester_id')->nullable()->comment('Requester User ID')->constrained('users', 'id');
            $table->foreignId('assigned_to')->nullable()->comment('Assigned To User ID')->constrained('users', 'id');
            $table->foreignId('referred_to')->nullable()->comment('Referred To User ID')->constrained('users', 'id');
            $table->integer('order')->default(0)->comment('Order sequence in workflow');
            $table->text('description')->nullable()->comment('reason for referred or other');
            $table->enum('status',['Approve','Reject','Refer','Pending'])->default('Pending')->comment('Approved, Reject, Refer, Pending');
            $table->foreignId('created_by')->nullable()->comment('User who created this record auto get get via controller')->constrained('users', 'id');
            $table->foreignId('updated_by')->nullable()->comment('User who last updated this record auto get via controller')->constrained('users', 'id');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budget_request_approval_transactions');
    }
};
