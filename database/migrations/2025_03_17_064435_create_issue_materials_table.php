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
        Schema::create('issue_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_request_id')->nullable()->constrained('material_requests', 'id');
            $table->foreignId('cost_center_id')->nullable()->constrained('cost_centers', 'id');
            $table->foreignId('sub_cost_center_id')->nullable()->comment('in cost center we are using parent_id for sub cost center')->constrained('cost_centers', 'id');
            $table->foreignId('department_id')->nullable()->constrained('departments', 'id');
            $table->enum('priority', ['High', 'Medium','Low'])->default('Low');
            $table->enum('status', ['Pending', 'Issue Material'])->default('Pending');
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users', 'id');
            $table->foreignId('updated_by')->nullable()->constrained('users', 'id');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('issue_materials');
    }
};
