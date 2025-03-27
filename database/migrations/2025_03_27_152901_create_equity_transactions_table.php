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
        Schema::create('equity_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equity_account_id')->constrained('equity_accounts');
            $table->enum('transaction_type', [
                'owner_investment',
                'owner_withdrawal',
                'profit_allocation',
                'loss_allocation',
                'dividend_declaration',
                'stock_issuance',
                'stock_buyback',
                'revaluation'
            ]);
            $table->decimal('amount', 15, 2);
            $table->date('transaction_date');
            $table->string('reference_number')->nullable();
            $table->text('description')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->userTracking();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equity_transactions');
    }
};
