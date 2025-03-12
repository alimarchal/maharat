<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Designation;

class DesignationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $designations = [
            'Direct Manager',
            'Department Director',
            'Managing Director',
            'Manager',
            'Supervisor',
            'Warehouse Manager',
            'Software Engineer',
            'Project Manager',
            'HR Specialist',
            'Marketing Executive',
            'Sales Representative',
        ];

        foreach ($designations as $designation) {
            Designation::updateOrCreate(
                ['designation' => $designation],
                ['designation' => $designation]
            );
        }
    }
}
