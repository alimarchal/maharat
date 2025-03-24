<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Department;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $companyIds = DB::table('companies')->pluck('id')->toArray();
        if (empty($companyIds)) {
            $this->command->warn('No companies found. Skipping DepartmentSeeder.');
            return;
        }

        DB::table('cost_centers')->whereIn('department_id', DB::table('departments')->pluck('id'))->delete();

        DB::table('departments')->delete();

        if (!DB::table('departments')->exists()) {
            DB::statement('ALTER TABLE departments AUTO_INCREMENT = 1;');
        }

        try {
            DB::beginTransaction();

            $departments = [
                ['name' => 'General Management', 'code' => 'GM'],
                ['name' => 'Human Resources', 'code' => 'HR'],
                ['name' => 'Finance', 'code' => 'FIN'],
                ['name' => 'Engineering', 'code' => 'ENG'],
                ['name' => 'Marketing', 'code' => 'MKT'],
                ['name' => 'Sales', 'code' => 'SLS'],
            ];

            $data = [];
            foreach ($departments as $department) {
                $data[] = [
                    'name'       => $department['name'],
                    'code'       => $department['code'],
                    'parent_id'  => null,
                    'is_active'  => 1,
                    'company_id' => $companyIds[array_rand($companyIds)], 
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            DB::table('departments')->insert($data);
            DB::commit();

            $this->command->info('Departments table seeded successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Error seeding departments: ' . $e->getMessage());
        }
    }
}
