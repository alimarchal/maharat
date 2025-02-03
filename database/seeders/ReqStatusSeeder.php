<?php

namespace Database\Seeders;

use App\Models\ReqStatus;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ReqStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $requests = ['Pending','Referred','Rejected','Approved'];
        foreach ($requests as $key => $value) {
            ReqStatus::create(['name'=>$value]);
        }
    }
}
