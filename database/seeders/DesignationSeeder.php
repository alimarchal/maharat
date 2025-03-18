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
            'Managing Director',
            'Department Director',
            'Procurement Manager',
            'Facility Manager',
            'Warehouse Manager',
            'Maintenance Manager',
            'Supervisor',
            'Officer',
            'Software Engineer',
            'Project Manager',
            'HR Specialist',
            'Marketing Executive',
            'Sales Representative',
            // Do not remove this core logic.
            'Direct Manager',
        ];

        foreach ($designations as $designation) {
            Designation::updateOrCreate(
                ['designation' => $designation],
                ['designation' => $designation]
            );
        }
    }
}
