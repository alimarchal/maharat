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
        Schema::create('document_sequences', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('prefix')->nullable();
            $table->string('suffix')->nullable();
            $table->enum('sequence_type', ['manual', 'auto']);
            $table->string('module');
            $table->string('document_type');
            $table->integer('starting_number');
            $table->integer('current_number');
            $table->integer('increment_by')->default(1);
            $table->integer('padding_length')->default(8);
            $table->boolean('is_active')->default(true);
            $table->string('fiscal_year');
            $table->string('format_pattern')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_sequences');
    }
};
