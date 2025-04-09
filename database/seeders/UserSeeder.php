<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Department;
use App\Models\Designation;
use App\Services\NotificationSettingsService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{

    protected $notificationSettingsService;

    public function __construct(NotificationSettingsService $notificationSettingsService)
    {
        $this->notificationSettingsService = $notificationSettingsService;
    }


    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        // Ensure notification types and channels are seeded
        $this->call([
            NotificationTypesSeeder::class,
            NotificationChannelsSeeder::class,
        ]);


        // Fetch valid department and designation IDs
        $departmentIds = Department::pluck('id')->toArray();
        $designationIds = Designation::pluck('id')->toArray();

        if (empty($departmentIds)) {
            throw new \Exception("No departments found! Run DepartmentSeeder first.");
        }

        if (empty($designationIds)) {
            throw new \Exception("No designations found! Run DesignationSeeder first.");
        }

        // Helper functions
        $generateEmployeeId = fn() => 'MAH-' . str_pad(mt_rand(1, 999999), 6, '0', STR_PAD_LEFT);
        $generateLandline = fn() => '011' . mt_rand(1000000, 9999999);
        $generateMobile = fn() => '05' . mt_rand(10000000, 99999999);
        $generateUsername = fn($name) => strtolower(str_replace(' ', '_', $name));

        // Create Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Mr. Sami Al Musalli',
                'firstname' => 'Mr. Sami',
                'lastname' => 'Al Musalli',
                'username' => $generateUsername('Sami Al Musalli'),
                'employee_id' => $generateEmployeeId(),
                'landline' => $generateLandline(),
                'mobile' => $generateMobile(),
                'parent_id' => null,
                'hierarchy_level' => 0,
                'designation_id' => 1,
                'department_id' => 1,
                'password' => Hash::make('password'),
            ]
        );
        $admin->assignRole('Admin');
        $this->notificationSettingsService->setupDefaultSettingsForUser($admin);


        // Create Director
        $director = User::firstOrCreate(
            ['email' => 'director@example.com'],
            [
                'name' => 'Managing Director',
                'firstname' => 'Department',
                'lastname' => 'Director',
                'username' => $generateUsername('Department Director'),
                'employee_id' => $generateEmployeeId(),
                'landline' => $generateLandline(),
                'mobile' => $generateMobile(),
                'password' => Hash::make('password'),
            ]
        );
        $director->assignRole('Director');
        $this->notificationSettingsService->setupDefaultSettingsForUser($director);


        // Create Manager
        $manager = User::firstOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'Team Manager',
                'firstname' => 'Team',
                'lastname' => 'Manager',
                'username' => $generateUsername('Team Manager'),
                'employee_id' => $generateEmployeeId(),
                'landline' => $generateLandline(),
                'mobile' => $generateMobile(),
                'password' => Hash::make('password'),
            ]
        );
        $manager->assignRole('Manager');
        $this->notificationSettingsService->setupDefaultSettingsForUser($manager);


        // Create Supervisor
        $supervisor = User::firstOrCreate(
            ['email' => 'supervisor@example.com'],
            [
                'name' => 'Team Supervisor',
                'firstname' => 'Team',
                'lastname' => 'Supervisor',
                'username' => $generateUsername('Team Supervisor'),
                'employee_id' => $generateEmployeeId(),
                'landline' => $generateLandline(),
                'mobile' => $generateMobile(),
                'password' => Hash::make('password'),
            ]
        );
        $supervisor->assignRole('Supervisor');
        $this->notificationSettingsService->setupDefaultSettingsForUser($supervisor);


        // Fixed Users
        $users = [
                ['email' => 'omar@example.com', 'firstname' => 'Omar', 'lastname' => 'Saud', 'name' => 'Omar Saud', 'parent_id' => 1, 'hierarchy_level' => 1, 'designation_id' => 3, 'department_id' => 4],
                ['email' => 'khalid@example.com', 'firstname' => 'Khalid', 'lastname' => 'Farooq', 'name' => 'Khalid Farooq', 'parent_id' => 1, 'hierarchy_level' => 1, 'designation_id' => 3, 'department_id' => 3],
                ['email' => 'yousef@example.com', 'firstname' => 'Yousef', 'lastname' => 'Qahtani', 'name' => 'Yousef Qahtani', 'parent_id' => 1, 'hierarchy_level' => 1, 'designation_id' => 3, 'department_id' => 5],
                ['email' => 'ibrahim@example.com', 'firstname' => 'Ibrahim', 'lastname' => 'Mansour', 'name' => 'Ibrahim Mansour', 'parent_id' => 1, 'hierarchy_level' => 1, 'designation_id' => 3, 'department_id' => 6],
                ['email' => 'mohammed@example.com', 'firstname' => 'Mohammed', 'lastname' => 'Sheikh', 'name' => 'Mohammed Sheikh', 'parent_id' => 6, 'hierarchy_level' => 2, 'designation_id' => 4, 'department_id' => 3],
                ['email' => 'fatima@example.com', 'firstname' => 'Fatima', 'lastname' => 'Khalid', 'name' => 'Fatima Khalid', 'parent_id' => 6, 'hierarchy_level' => 2, 'designation_id' => 5, 'department_id' => 6],
                ['email' => 'abdullah@example.com', 'firstname' => 'Abdullah', 'lastname' => 'Mohsen', 'name' => 'Abdullah Mohsen', 'parent_id' => 9, 'hierarchy_level' => 3, 'designation_id' => 6, 'department_id' => 4],
                ['email' => 'salman@example.com', 'firstname' => 'Salman', 'lastname' => 'Rashid', 'name' => 'Salman Rashid', 'parent_id' => 10, 'hierarchy_level' => 3, 'designation_id' => 7, 'department_id' => 4],
        ];

        $filteredDesignationIds = array_filter($designationIds, fn($id) => $id !== 1);
        $filteredDepartmentIds = array_filter($departmentIds, fn($id) => $id !== 1);

        foreach ($users as $data) {

            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'firstname' => $data['firstname'],
                    'lastname' => $data['lastname'],
                    'username' => $generateUsername($data['name']),
                    'employee_id' => $generateEmployeeId(),
                    'landline' => $generateLandline(),
                    'mobile' => $generateMobile(),
                    'password' => Hash::make('password'),
                    'parent_id' => $data['parent_id'] ?? null,
                    'hierarchy_level' => $data['hierarchy_level'] ?? null,
                    'designation_id' => isset($data['designation_id']) ? $data['designation_id'] : (!empty($filteredDesignationIds) ? $filteredDesignationIds[array_rand($filteredDesignationIds)] : null),
                    'department_id' => isset($data['department_id']) ? $data['department_id'] : (!empty($filteredDepartmentIds) ? $filteredDepartmentIds[array_rand($filteredDepartmentIds)] : null),

                ]
            );

            $user->assignRole('User');
            $this->notificationSettingsService->setupDefaultSettingsForUser($user);

        }

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

    }
}
