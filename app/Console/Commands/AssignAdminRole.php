<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

class AssignAdminRole extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:assign-admin {email?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Assign Admin role to specific users (director@example.com, manager@example.com, supervisor@example.com)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Get or create Admin role
        $adminRole = Role::firstOrCreate(['name' => 'Admin'], ['guard_name' => 'web']);
        
        // Default emails to update
        $emails = [
            'director@example.com',
            'manager@example.com',
            'supervisor@example.com'
        ];
        
        // If specific email provided, use that instead
        if ($this->argument('email')) {
            $emails = [$this->argument('email')];
        }
        
        $this->info('Assigning Admin role to users...');
        $this->newLine();
        
        foreach ($emails as $email) {
            $user = User::where('email', $email)->first();
            
            if (!$user) {
                $this->warn("User with email '{$email}' not found. Skipping...");
                continue;
            }
            
            // Get current roles
            $currentRoles = $user->roles->pluck('name')->toArray();
            
            // Assign Admin role (this will sync roles, replacing existing ones)
            $user->syncRoles(['Admin']);
            
            $this->info("✓ Updated {$email}");
            if (!empty($currentRoles)) {
                $this->line("  Previous roles: " . implode(', ', $currentRoles));
            }
            $this->line("  New role: Admin");
        }
        
        // Clear permission cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
        
        $this->newLine();
        $this->info('Done! Admin role has been assigned. Permissions cache cleared.');
        $this->info('Users should log out and log back in to see all permissions.');
        
        return Command::SUCCESS;
    }
}



