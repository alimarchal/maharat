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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('process_step_id')->nullable()->comment('Task Name')->constrained('process_steps', 'id');
            $table->foreignId('process_id')->nullable()->comment('Type RFQ or Material Type')->constrained('processes', 'id');
            $table->dateTime('assigned_at')->nullable();
            $table->dateTime('deadline')->nullable();
            $table->enum('urgency', ['Normal', 'Medium', 'High', 'Low', 'ASAP'])->default('Normal');
            $table->foreignId('assigned_from_user_id')->nullable()->comment('from')->constrained('users', 'id');
            $table->foreignId('assigned_to_user_id')->nullable()->comment('to')->constrained('users', 'id');

            $table->integer('order_no')->comment('order_or_sequence_no')->default(1);
            $table->foreignId('material_request_id')->nullable()->constrained('material_requests', 'id');
            $table->foreignId('rfq_id')->nullable()->constrained('rfqs', 'id');
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders', 'id');
            $table->foreignId('payment_order_id')->nullable()->constrained('payment_orders', 'id');
            $table->foreignId('invoice_id')->nullable()->comment('maharat invoices')->constrained('invoices', 'id');

            $table->dateTime('read_status')->nullable();
            $table->enum('status',['Pending','Approved','Rejected','Referred'])->default('Pending');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
