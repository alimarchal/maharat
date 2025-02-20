<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;


class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Admin
        $admin = User::factory()->create([
            'email' => 'admin@example.com',
            'name' => 'System Admin',
            'password' => Hash::make('password'),
        ]);
        $admin->assignRole('Admin');

        // Create Director
        $director = User::factory()->create([
            'email' => 'director@example.com',
            'name' => 'Department Director',
            'password' => Hash::make('password'),
        ]);
        $director->assignRole('Director');

        // Create Manager
        $manager = User::factory()->create([
            'email' => 'manager@example.com',
            'name' => 'Team Manager',
            'password' => Hash::make('password'),
        ]);
        $manager->assignRole('Manager');

        // Create Supervisor
        $supervisor = User::factory()->create([
            'email' => 'supervisor@example.com',
            'name' => 'Team Supervisor',
            'password' => Hash::make('password'),
        ]);
        $supervisor->assignRole('Supervisor');

        // Create Regular Users
        User::factory(5)->create()->each(function ($user) {
            $user->assignRole('User');
        });
    }

}
