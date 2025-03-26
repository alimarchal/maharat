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
        Schema::create('rfq_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfq_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('product_categories');
            $table->foreignId('product_id')->nullable()->constrained('products', 'id');
            $table->foreignId('unit_id')->nullable()->constrained('units');
            $table->decimal('quantity', 15, 4);
            $table->foreignId('brand_id')->nullable()->constrained('brands');
            $table->string('model')->nullable();
            $table->string('specifications')->nullable();
            $table->string('original_filename')->nullable();
            $table->string('attachment')->nullable();
            $table->date('expected_delivery_date')->nullable();
            $table->decimal('quoted_price', 15, 4)->nullable();
            $table->decimal('negotiated_price', 15, 4)->nullable();
            $table->foreignId('status_id')->constrained('statuses', 'id');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rfq_items');
    }
};
