<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('quotation_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->comment('Link to the quotation')->constrained();
            $table->string('file_path')->comment('Path to the stored file');
            $table->string('original_name')->comment('Original filename');
            $table->string('type')->comment("e.g., 'quotation', 'terms_and_conditions'")->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotation_documents');
    }
};
