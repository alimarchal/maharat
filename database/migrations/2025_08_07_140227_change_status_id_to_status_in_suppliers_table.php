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
        // Use raw SQL to handle foreign key constraint
        $connection = Schema::getConnection();
        
        // Check if status_id column exists
        if (Schema::hasColumn('suppliers', 'status_id')) {
            // Drop foreign key constraint if it exists
            $foreignKeys = $connection->select("
                SELECT CONSTRAINT_NAME 
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'suppliers' 
                AND COLUMN_NAME = 'status_id' 
                AND REFERENCED_TABLE_NAME IS NOT NULL
            ");
            
            if (!empty($foreignKeys)) {
                $foreignKeyName = $foreignKeys[0]->CONSTRAINT_NAME;
                $connection->statement("ALTER TABLE suppliers DROP FOREIGN KEY {$foreignKeyName}");
            }
            
            // Drop the status_id column
            $connection->statement("ALTER TABLE suppliers DROP COLUMN status_id");
        }
        
        // Add the new status column
        if (!Schema::hasColumn('suppliers', 'status')) {
            $connection->statement("ALTER TABLE suppliers ADD COLUMN status VARCHAR(255) NULL DEFAULT 'Active'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $connection = Schema::getConnection();
        
        // Drop the status column if it exists
        if (Schema::hasColumn('suppliers', 'status')) {
            $connection->statement("ALTER TABLE suppliers DROP COLUMN status");
        }
        
        // Add back the status_id column
        if (!Schema::hasColumn('suppliers', 'status_id')) {
            $connection->statement("ALTER TABLE suppliers ADD COLUMN status_id BIGINT UNSIGNED NULL");
            $connection->statement("ALTER TABLE suppliers ADD CONSTRAINT suppliers_status_id_foreign FOREIGN KEY (status_id) REFERENCES statuses(id)");
        }
    }
};
