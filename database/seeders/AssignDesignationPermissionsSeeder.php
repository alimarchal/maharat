<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AssignDesignationPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if required tables exist
        if (!Schema::hasTable('users') || !Schema::hasTable('designations')) {
            $this->command->error('Required tables (users, designations) do not exist. Please run migrations first.');
            return;
        }

        // Check if we have any users
        if (DB::table('users')->count() === 0) {
            $this->command->warn('No users found in the database.');
            return;
        }

        $users = User::with('designation')->get();
        $updatedCount = 0;
        $skippedCount = 0;
        $errorCount = 0;

        $this->command->info('Starting permission assignment for ' . $users->count() . ' users...');

        foreach ($users as $user) {
            try {
                if (!$user->designation) {
                    $this->command->warn("User {$user->id} ({$user->name}) has no designation assigned");
                    $skippedCount++;
                    continue;
                }

                $user->assignPermissionsBasedOnDesignation();
                $updatedCount++;
                
                $this->command->info("Updated permissions for user {$user->id} ({$user->name}) with designation {$user->designation->designation}");
            } catch (\Exception $e) {
                $this->command->error("Failed to update permissions for user {$user->id}: " . $e->getMessage());
                Log::error("Failed to update permissions for user {$user->id}: " . $e->getMessage());
                $errorCount++;
            }
        }

        $this->command->info("Permission update completed:");
        $this->command->info("- Updated: {$updatedCount}");
        $this->command->info("- Skipped: {$skippedCount}");
        $this->command->info("- Errors: {$errorCount}");
    }
} 