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
            'Manager',
            'Direct Manager',
            'Supervisor',
            'Warehouse Manager',
            'Officer',
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
