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
        Schema::create('budget_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_budget_id')->constrained('request_budgets', 'id')->onDelete('cascade');
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders', 'id')->onDelete('set null');
            $table->string('action'); // 'reserve', 'release', 'transfer', 'consume'
            $table->decimal('amount', 15, 2);
            $table->decimal('approved_amount_before', 15, 2)->nullable();
            $table->decimal('approved_amount_after', 15, 2)->nullable();
            $table->decimal('reserved_amount_before', 15, 2)->nullable();
            $table->decimal('reserved_amount_after', 15, 2)->nullable();
            $table->decimal('balance_amount_before', 15, 2)->nullable();
            $table->decimal('balance_amount_after', 15, 2)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users', 'id')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budget_audit_logs');
    }
};
