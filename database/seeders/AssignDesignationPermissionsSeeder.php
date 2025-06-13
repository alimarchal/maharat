<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

class AssignDesignationPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::with('designation')->get();
        $updatedCount = 0;
        $skippedCount = 0;

        foreach ($users as $user) {
            try {
                if (!$user->designation) {
                    Log::warning("User {$user->id} ({$user->name}) has no designation assigned");
                    $skippedCount++;
                    continue;
                }

                $user->assignPermissionsBasedOnDesignation();
                $updatedCount++;
                
                Log::info("Updated permissions for user {$user->id} ({$user->name}) with designation {$user->designation->designation}");
            } catch (\Exception $e) {
                Log::error("Failed to update permissions for user {$user->id}: " . $e->getMessage());
                $skippedCount++;
            }
        }

        Log::info("Permission update completed. Updated: {$updatedCount}, Skipped: {$skippedCount}");
    }
} 