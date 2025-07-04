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
        Schema::create('item_requests', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('quantity');
            $table->string('photo')->nullable();
            $table->text('description');
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('status_id')->nullable()->constrained('statuses')->default(1); // 1 = Pending
            $table->foreignId('approved_by')->nullable()->constrained('users'); // Who approved it
            $table->foreignId('product_id')->nullable()->constrained('products'); // Link to created product
            $table->timestamp('approved_at')->nullable(); // When it was approved
            $table->text('rejection_reason')->nullable(); // If rejected
            $table->boolean('is_added')->default(false); // Keep for backward compatibility
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_requests');
    }
};
