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
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfq_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_id')->nullable()->comment('Supplier who submitted the quotation')->constrained();
            $table->string('quotation_number')->comment("Quotation ID (e.g., QUO-2023-001)")->unique();
            $table->date('issue_date')->nullable()->comment("Quotation issue date");
            $table->date('valid_until')->nullable()->comment("Quotation valid until");
            $table->decimal('total_amount', 15, 2)->nullable()->comment("Quotation total amount");
            $table->foreignId('status_id')->nullable()->comment("pending', 'accepted', 'rejected', 'expired'")->constrained('statuses', 'id');
            $table->text('terms_and_conditions')->nullable();
            $table->text('notes')->nullable()->comment("Additional notes");
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
