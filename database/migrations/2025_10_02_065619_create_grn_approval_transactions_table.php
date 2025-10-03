<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grn_approval_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grn_id')->constrained('grns')->onDelete('cascade');
            $table->foreignId('requester_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('assigned_to')->constrained('users')->onDelete('cascade');
            $table->foreignId('referred_to')->nullable()->constrained('users')->onDelete('set null');
            $table->integer('order');
            $table->text('description')->nullable();
            $table->enum('status', ['Pending', 'Approve', 'Reject'])->default('Pending');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('grn_id');
            $table->index('status');
            $table->index('order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grn_approval_transactions');
    }
};
