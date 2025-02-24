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
        Schema::create('rfqs', function (Blueprint $table) {
            $table->id();
            $table->string('rfq_number')->unique();
            $table->foreignId('requester_id')->nullable()->constrained('users');
            $table->foreignId('company_id')->nullable()->constrained('companies');
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses');

            // Organization Details
            $table->string('organization_name')->nullable();
            $table->string('organization_email')->nullable();
            $table->string('city')->nullable();
            $table->string('contact_number')->nullable();

            // Request Details using Status References
            $table->foreignId('request_type')->constrained('statuses', 'id');  // References RFQ Request Type
            $table->foreignId('payment_type')->constrained('statuses', 'id');  // References RFQ Payment Type
            $table->date('request_date')->nullable();
            $table->date('expected_delivery_date')->nullable();
            $table->date('closing_date')->nullable();

            // Attachments and Notes
            $table->string('attachments')->nullable();
            $table->text('notes')->nullable();

            // Status and Tracking
            $table->foreignId('status_id')->constrained('statuses', 'id');  // References Purchase RFQ Status
            $table->foreignId('assigned_to')->nullable()->constrained('users');
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('rejected_at')->nullable();
            $table->foreignId('rejected_by')->nullable()->constrained('users');
            $table->text('rejection_reason')->nullable();

            // Quotation Response
            $table->boolean('quotation_sent')->default(false);
            $table->timestamp('quotation_sent_at')->nullable();
            $table->string('quotation_document')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });


        Schema::create('rfq_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfq_id')->constrained()->cascadeOnDelete();
            $table->foreignId('status_id')->constrained('statuses', 'id');
            $table->foreignId('changed_by')->constrained('users');
            $table->text('remarks')->nullable();

            // Status-specific tracking
            $table->foreignId('assigned_to')->nullable()->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->foreignId('rejected_by')->nullable()->constrained('users');
            $table->text('rejection_reason')->nullable();

            // Document tracking
            $table->string('documents')->nullable();
            $table->boolean('quotation_sent')->default(false);

            $table->timestamps();
        });


    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rfqs');
    }
};
