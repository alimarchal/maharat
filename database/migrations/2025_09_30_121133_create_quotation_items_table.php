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
        Schema::create('quotation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rfq_item_id')->constrained()->cascadeOnDelete();
            $table->decimal('unit_price', 15, 4)->comment('Unit price quoted by supplier');
            $table->decimal('total_price', 15, 4)->comment('Total price (unit_price × quantity from rfq_item)');
            $table->text('notes')->nullable()->comment('Additional notes for this item');
            $table->timestamps();
            
            // Ensure unique combination of quotation and rfq_item
            $table->unique(['quotation_id', 'rfq_item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotation_items');
    }
};
