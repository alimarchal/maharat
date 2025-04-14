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
            $table->foreignId('client_id')->nullable()->constrained('customers')->onDelete('cascade');
            $table->enum('status', ['Draft', 'Approved', 'Pending', 'Paid', 'Overdue', 'Cancelled'])->default('Draft');
            $table->string('invoice_document')->nullable()->comment('Path to the PDF document');
            $table->string('payment_method')->nullable();
            $table->string('representative_id')->nullable();
            $table->string('representative_email')->nullable();
            $table->date('issue_date');
            $table->date('due_date')->nullable();
            $table->integer('discounted_days')->nullable();
            $table->decimal('vat_rate', 15, 2)->default(0);
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->string('currency', 3)->default('SAR');
            $table->text('notes')->nullable();
            $table->foreignId('account_code_id')->default(4)->constrained('account_codes', 'id');
            $table->softDeletes();
            $table->userTracking();
            $table->timestamps();

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
