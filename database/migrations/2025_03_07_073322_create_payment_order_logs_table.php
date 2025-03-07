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
        Schema::create('payment_order_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_order_id')->nullable()->constrained('payment_orders', 'id');
            $table->text('description')->nullable();
            $table->enum('action',['Approved','Reject','Refer'])->nullable();
            $table->enum('priority',['Urgent','High','Standard','Low'])->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_order_logs');
    }
};
