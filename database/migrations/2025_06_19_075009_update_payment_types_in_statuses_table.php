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
        // First, delete the existing payment types
        DB::table('statuses')->where('type', 'Payment')->delete();
        
        // Insert the new payment types
        DB::table('statuses')->insert([
            [
                'type' => 'Payment',
                'name' => 'Cash',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 'Payment',
                'name' => 'Credit upto 30 days',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 'Payment',
                'name' => 'Credit up to 60 days',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 'Payment',
                'name' => 'Credit upto 90 days',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 'Payment',
                'name' => 'Credit upto 120 days',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Delete the new payment types
        DB::table('statuses')->where('type', 'Payment')->delete();
        
        // Restore the original payment types
        DB::table('statuses')->insert([
            [
                'type' => 'Payment',
                'name' => 'Cash',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 'Payment',
                'name' => 'Card',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 'Payment',
                'name' => 'Cheque',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 'Payment',
                'name' => 'Bank Transfer',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
};
