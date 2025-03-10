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
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chart_of_account_id')->nullable()->constrained('chart_of_accounts', 'id');
            $table->foreignId('cost_center_id')->nullable()->constrained('cost_centers')->nullOnDelete();
            $table->string('name')->nullable();
            $table->string('description')->nullable();
            $table->enum('status', ['Approved', 'Pending'])->default('Approved');
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
        Schema::dropIfExists('accounts');
    }
};
