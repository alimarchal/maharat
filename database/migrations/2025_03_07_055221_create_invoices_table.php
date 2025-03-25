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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique()->comment('Maharat Invoice Table');
            $table->foreignId('vendor_id')->constrained('suppliers')->onDelete('cascade');
            $table->foreignId('client_id')->nullable()->constrained('customers')->onDelete('cascade');
            $table->enum('status', ['Draft', 'Pending', 'Paid', 'Overdue', 'Cancelled'])->default('Draft'); // Directly store status as string field
            $table->string('payment_method')->nullable();
            $table->date('issue_date');
            $table->date('due_date')->nullable();
            $table->integer('discounted_days')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('currency', 3)->default('SAR');
            $table->text('notes')->nullable();
            $table->foreignId('account_code_id')->default(4)->constrained('account_codes', 'id');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
