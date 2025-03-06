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
        Schema::create('ledgers', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('description')->nullable();
            $table->foreignId('cost_center_id')->nullable()->constrained('cost_centers')->nullOnDelete();
            $table->enum('status', ['Approved', 'Pending'])->default(NULL);
            $table->foreignId('created_by')->nullable()->comment('User who created this record')->constrained('users', 'id');
            $table->foreignId('updated_by')->nullable()->comment('User who last updated this record')->constrained('users', 'id');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ledgers');
    }
};
