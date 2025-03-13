<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Department;
use App\Models\Designation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
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
                'name' => 'Sami Al Musalli',
                'firstname' => 'Sami',
                'lastname' => 'Al Musalli',
                'username' => $generateUsername('Sami Al Musalli'),
                'employee_id' => $generateEmployeeId(),
                'landline' => $generateLandline(),
                'mobile' => $generateMobile(),
                'password' => Hash::make('password'),
            ]
        );
        $admin->assignRole('Admin');

        // Create Director
        $director = User::firstOrCreate(
            ['email' => 'director@example.com'],
            [
                'name' => 'Department Director',
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

        // Fixed Users
        $users = [
            ['email' => 'alice@example.com', 'firstname' => 'Alice', 'lastname' => 'Johnson', 'name' => 'Alice Johnson', 'parent_id' => null, 'hierarchy_level' => 0],
            ['email' => 'bob@example.com', 'firstname' => 'Bob', 'lastname' => 'Williams', 'name' => 'Bob Williams', 'parent_id' => 5, 'hierarchy_level' => 1],
            ['email' => 'charlie@example.com', 'firstname' => 'Charlie', 'lastname' => 'Davis', 'name' => 'Charlie Davis', 'parent_id' => 5, 'hierarchy_level' => 1],
            ['email' => 'david@example.com', 'firstname' => 'David', 'lastname' => 'Brown', 'name' => 'David Brown', 'parent_id' => 6, 'hierarchy_level' => 2],
            ['email' => 'eva@example.com', 'firstname' => 'Eva', 'lastname' => 'Smith', 'name' => 'Eva Smith', 'parent_id' => 7, 'hierarchy_level' => 2],
            ['email' => 'john@example.com', 'firstname' => 'John', 'lastname' => 'Doe', 'name' => 'John Doe', 'parent_id' => 6, 'hierarchy_level' => 2],
            ['email' => 'seniorofficer@example.com', 'firstname' => 'Senior', 'lastname' => 'Officer', 'name' => 'Senior Officer', 'parent_id' => 8, 'hierarchy_level' => 3],
        ];

        foreach ($users as $data) {

            User::firstOrCreate(
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
                    'designation_id' => $designationIds[array_rand($designationIds)] ?? null,
                    'department_id' => $departmentIds[array_rand($departmentIds)] ?? null,
                ]
            );
        }
    }
}
