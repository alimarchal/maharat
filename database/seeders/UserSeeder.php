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

        // Ensure departments and designations exist before proceeding
        if (empty($departmentIds)) {
            throw new \Exception("No departments found! Run DepartmentSeeder first.");
        }

        if (empty($designationIds)) {
            throw new \Exception("No designations found! Run DesignationSeeder first.");
        }

        // Create Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Sami Al Musalli',
                'password' => Hash::make('password'),
            ]
        );
        $admin->assignRole('Admin');

        // Create Director
        $director = User::firstOrCreate(
            ['email' => 'director@example.com'],
            [
                'name' => 'Department Director',
                'password' => Hash::make('password'),
            ]
        );
        $director->assignRole('Director');

        // Create Manager
        $manager = User::firstOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'Team Manager',
                'password' => Hash::make('password'),
            ]
        );
        $manager->assignRole('Manager');

        // Create Supervisor
        $supervisor = User::firstOrCreate(
            ['email' => 'supervisor@example.com'],
            [
                'name' => 'Team Supervisor',
                'password' => Hash::make('password'),
            ]
        );
        $supervisor->assignRole('Supervisor');

        // Create fixed users
        $alice = User::firstOrCreate(
            ['email' => 'alice@example.com'],
            [
                'name' => 'Alice Johnson',
                'password' => Hash::make('password'),
                'parent_id' => null,
                'hierarchy_level' => 0, // Ensure it remains NULL
                'designation_id' => $designationIds[0] ?? null,
                'department_id' => $departmentIds[0] ?? null,
            ]
        );

        $bob = User::firstOrCreate(
            ['email' => 'bob@example.com'],
            [
                'name' => 'Bob Williams',
                'password' => Hash::make('password'),
                'parent_id' => $alice->id, // Assign dynamically
                'hierarchy_level' => 1,
                'designation_id' => $designationIds[1] ?? null,
                'department_id' => $departmentIds[1] ?? null,
            ]
        );

        $charlie = User::firstOrCreate(
            ['email' => 'charlie@example.com'],
            [
                'name' => 'Charlie Davis',
                'password' => Hash::make('password'),
                'parent_id' => $alice->id,
                'hierarchy_level' => 1,
                'designation_id' => $designationIds[2] ?? null,
                'department_id' => $departmentIds[2] ?? null,
            ]
        );

        $david = User::firstOrCreate(
            ['email' => 'david@example.com'],
            [
                'name' => 'David Brown',
                'password' => Hash::make('password'),
                'parent_id' => $bob->id, // Assign dynamically
                'hierarchy_level' => 2,
                'designation_id' => $designationIds[3] ?? null,
                'department_id' => $departmentIds[3] ?? null,
            ]
        );

        $eva = User::firstOrCreate(
            ['email' => 'eva@example.com'],
            [
                'name' => 'Eva Smith',
                'password' => Hash::make('password'),
                'parent_id' => $bob->id,
                'hierarchy_level' => 2,
                'designation_id' => $designationIds[4] ?? null,
                'department_id' => $departmentIds[4] ?? null,
            ]
        );

        $john = User::firstOrCreate(
            ['email' => 'john@example.com'],
            [
                'name' => 'John Doe',
                'password' => Hash::make('password'),
                'parent_id' => $charlie->id,
                'hierarchy_level' => 2,
                'designation_id' => $designationIds[4] ?? null,
                'department_id' => $departmentIds[4] ?? null,
            ]
        );
    }
}