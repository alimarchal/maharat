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
        Schema::create('equity_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('account_code')->unique();
            $table->enum('type', ['owner_capital', 'retained_earnings', 'drawings', 'contributed_capital', 'treasury_stock', 'other_equity']);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->userTracking();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equity_accounts');
    }
};
