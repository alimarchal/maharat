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
        Schema::create('payment_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->comment('Created By')->constrained('users', 'id');
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders', 'id');
            $table->string('payment_order_number')->unique();
            $table->date('date')->nullable();
            $table->string('attachment')->nullable();
            $table->decimal('total_amount','15,2')->nullable()->default(0);
            $table->decimal('paid_amount','15,2')->nullable()->default(0);
            $table->enum('status', ['Draft', 'Approved','Overdue', 'Cancelled','Paid', 'Pending', 'Partially Paid'])->default('Draft');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_orders');
    }
};
