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
        Schema::create('external_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->comment('Created By')->constrained('users', 'id');
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders', 'id');
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers', 'id');
            $table->string('invoice_id')->nullable()->comment("This is not from Invoices Table it is from supplier quotaion")->unique();
            $table->decimal('amount',15,2)->comment("amount without vat")->default(0);
            $table->decimal('vat_amount',15,2)->comment("VAT amount")->default(0);
            $table->enum('status',['Draft','Verified','Paid','UnPaid','Partially Paid'])->default('UnPaid');
            $table->enum('type',['Cash','Credit'])->default(NULL);
            $table->date('payable_date')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('external_invoices');
    }
};
