<?php

namespace Database\Seeders;

use App\Models\User;
use App\Services\DesignationPermissionService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AssignDesignationPermissionsSeeder extends Seeder
{
    protected $designationPermissionService;

    public function __construct(DesignationPermissionService $designationPermissionService)
    {
        $this->designationPermissionService = $designationPermissionService;
    }

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

        $this->command->info('Starting role and permission assignment for ' . $users->count() . ' users...');

        foreach ($users as $user) {
            try {
                if (!$user->designation) {
                    $this->command->warn("User {$user->id} ({$user->name}) has no designation assigned");
                    $skippedCount++;
                    continue;
                }

                // Assign role and permissions using the service
                $this->designationPermissionService->assignRoleAndPermissions($user);
                
                $updatedCount++;
                $this->command->info("Updated roles and permissions for user {$user->id} ({$user->name}) with designation {$user->designation->designation}");
            } catch (\Exception $e) {
                $this->command->error("Failed to update roles and permissions for user {$user->id}: " . $e->getMessage());
                Log::error("Failed to update roles and permissions for user {$user->id}: " . $e->getMessage());
                $errorCount++;
            }
        }

        $this->command->info("Role and permission update completed:");
        $this->command->info("- Updated: {$updatedCount}");
        $this->command->info("- Skipped: {$skippedCount}");
        $this->command->info("- Errors: {$errorCount}");
    }
} 