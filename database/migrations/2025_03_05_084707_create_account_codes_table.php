<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('account_codes', function (Blueprint $table) {
            $table->id();
            $table->integer('account_code')->unique();
            $table->enum('account_type', ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Seed initial account codes
        $this->seedAccountCodes();
    }

    /**
     * Seed the account codes table with initial data.
     */
    private function seedAccountCodes(): void
    {
        $accountCodes = [
            [
                'account_code' => 1000,
                'account_type' => 'Asset',
                'is_active' => true,
                'description' => 'Asset account',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'account_code' => 2000,
                'account_type' => 'Liability',
                'is_active' => true,
                'description' => 'Liability account',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'account_code' => 3000,
                'account_type' => 'Equity',
                'is_active' => true,
                'description' => 'Equity account',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'account_code' => 4000,
                'account_type' => 'Revenue',
                'is_active' => true,
                'description' => 'Revenue account',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'account_code' => 5000,
                'account_type' => 'Expense',
                'is_active' => true,
                'description' => 'Expense account',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        DB::table('account_codes')->insert($accountCodes);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('account_codes');
    }
};
