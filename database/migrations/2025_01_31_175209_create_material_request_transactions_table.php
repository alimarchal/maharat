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
        Schema::create('material_request_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_request_id')->nullable()->constrained('material_requests', 'id');
            $table->foreignId('requester_id')->nullable()->comment('Requester User ID')->constrained('users', 'id');
            $table->foreignId('assigned_to')->nullable()->comment('Assigned To User ID')->constrained('users', 'id');
            $table->foreignId('referred_to')->nullable()->comment('Referred To User ID')->constrained('users', 'id');
            $table->integer('order')->default(0)->comment('Order sequence in workflow');
            $table->text('description')->nullable()->comment('reason for referred or other');
            $table->enum('status',['Approve','Reject','Refer','Pending'])->default('Pending')->comment('Approved, Reject, Refer, Pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('material_request_transactions');
    }
};
