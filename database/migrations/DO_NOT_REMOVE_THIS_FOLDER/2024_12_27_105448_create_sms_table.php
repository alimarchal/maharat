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
        Schema::create('sms', function (Blueprint $table) {
            $table->id();
            $table->string('template_name');
            $table->string('template_code')->unique();
            $table->text('content');
            $table->enum('type', ['transactional', 'promotional', 'otp']);
            $table->text('placeholders')->nullable();
            $table->text('recipients')->nullable();
            $table->string('sender_id')->nullable();
            $table->enum('status', ['draft', 'active', 'inactive'])->default('draft');
            $table->integer('retry_attempts')->default(3);
            $table->integer('validity_period')->default(15); // in minutes
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sms');
    }
};
