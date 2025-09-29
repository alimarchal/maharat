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
        Schema::create('purchase_order_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->onDelete('cascade');
            $table->foreignId('grn_id')->nullable()->constrained('grns')->onDelete('set null');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null')
                  ->comment('User who made the adjustment');
            
            $table->enum('adjustment_type', [
                'quantity_shortage', 
                'quality_issue', 
                'supplier_cancellation',
                'other'
            ])->comment('Type of adjustment');
            
            $table->text('adjustment_reason')->comment('Detailed reason for adjustment');
            $table->date('adjustment_date')->comment('Date when adjustment was made');
            
            $table->decimal('original_amount', 15, 2)->comment('Original PO amount');
            $table->decimal('adjusted_amount', 15, 2)->comment('New adjusted amount');
            $table->decimal('adjustment_value', 15, 2)->comment('Amount of adjustment (positive or negative)');
            
            $table->json('affected_items')->nullable()
                  ->comment('JSON array of items affected by adjustment');
            
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('approval_notes')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_order_adjustments');
    }
};
