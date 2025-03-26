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
        Schema::create('cash_flow_transactions', function (Blueprint $table) {
            $table->id();
            $table->dateTime('transaction_date')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->enum('transaction_type', ['Debit','Credit']); // "Debit" or "Credit"
            $table->foreignId('chart_of_account_id')->nullable()->constrained('chart_of_accounts', 'id');
            $table->foreignId('sub_cost_center_id')->nullable()->constrained('cost_centers', 'id');
            $table->foreignId('account_id')->nullable()->constrained('accounts', 'id');
            $table->decimal('amount', 15, 2)->default(0);
            $table->decimal('balance_amount', 15, 2)->default(0);
            $table->enum('payment_method', ['Cash','Bank Transfer','Credit Card']);
            $table->string('reference_number', 50)->nullable();
            $table->string('reference_type', 50)->nullable();
            $table->text('description')->nullable();
            $table->userTracking();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_flow_transactions');
    }
};
