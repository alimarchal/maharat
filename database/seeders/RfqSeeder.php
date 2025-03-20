<?php

namespace Database\Seeders;

use App\Models\Rfq;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class RfqSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if the rfqs table exists
        if (!Schema::hasTable('rfqs')) {
            $this->command->warn('The rfqs table does not exist. Skipping RfqSeeder.');
            return;
        }

        DB::beginTransaction();

        try {
            // Delete existing RFQs safely
            DB::table('rfqs')->delete();

            // Retrieve valid warehouse IDs
            $warehouses = [];
            try {
                $warehouses = Warehouse::pluck('id', 'name')->toArray();
            } catch (\Exception $e) {
                $this->command->warn('Could not load Warehouse model. Using fixed warehouse IDs.');
            }

            // Define RFQ data with explicit IDs
            $rfqs = [
                [
                    'id' => 1, // Explicit ID for reference in other seeders
                    'rfq_number' => 'RFQ-2025-001',
                    'requester_id' => 1,
                    'department_id' => 1,
                    'cost_center_id' => 1,
                    'sub_cost_center_id' => 1,
                    'company_id' => 1,
                    'warehouse_id' => 201,
                    'organization_name' => 'Tech Solutions Ltd.',
                    'organization_email' => 'contact@techsolutions.com',
                    'city' => 'Dammam',
                    'contact_number' => '0584125744',
                    'request_type' => 1,
                    'payment_type' => 43,
                    'request_date' => '2025-03-10',
                    'expected_delivery_date' => '2025-03-20',
                    'closing_date' => '2025-03-15',
                    'attachments' => 'uploads/rfq/rfq_001.pdf',
                    'notes' => 'Urgent request for IT equipment.',
                    'status_id' => 47,
                    'assigned_to' => 5,
                    'assigned_at' => Carbon::now(),
                    'approved_at' => Carbon::now(),
                    'approved_by' => 2,
                    'rejected_at' => null,
                    'rejected_by' => null,
                    'rejection_reason' => null,
                    'quotation_sent' => 1,
                    'quotation_sent_at' => Carbon::now(),
                    'quotation_document' => null,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 2,
                    'rfq_number' => 'RFQ-2025-002',
                    'requester_id' => 8,
                    'department_id' => 1,
                    'cost_center_id' => 1,
                    'sub_cost_center_id' => 1,
                    'company_id' => 2,
                    'warehouse_id' => 202,
                    'organization_name' => 'Fast Supplies Pvt Ltd.',
                    'organization_email' => 'sales@fastsupplies.com',
                    'city' => 'Riyadh',
                    'contact_number' => '0542158963',
                    'request_type' => 2,
                    'payment_type' => 44,
                    'request_date' => '2025-03-12',
                    'expected_delivery_date' => '2025-03-25',
                    'closing_date' => '2025-03-18',
                    'attachments' => null,
                    'notes' => 'Request for bulk order of office furniture.',
                    'status_id' => 48,
                    'assigned_to' => 6,
                    'assigned_at' => Carbon::now(),
                    'approved_at' => null,
                    'approved_by' => null,
                    'rejected_at' => Carbon::now(),
                    'rejected_by' => 7,
                    'rejection_reason' => 'Insufficient budget.',
                    'quotation_sent' => 0,
                    'quotation_sent_at' => null,
                    'quotation_document' => null,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 3,
                    'rfq_number' => 'RFQ-2025-003',
                    'requester_id' => 10,
                    'department_id' => 1,
                    'cost_center_id' => 1,
                    'sub_cost_center_id' => 1,
                    'company_id' => 3,
                    'warehouse_id' => 204,
                    'organization_name' => 'Global Traders',
                    'organization_email' => 'info@globaltraders.com',
                    'city' => 'Jeddah',
                    'contact_number' => '0532146587',
                    'request_type' => 3,
                    'payment_type' => 45,
                    'request_date' => '2025-03-14',
                    'expected_delivery_date' => '2025-03-28',
                    'closing_date' => '2025-03-20',
                    'attachments' => 'uploads/rfq/rfq_003.pdf',
                    'notes' => 'Request for medical supplies.',
                    'status_id' => 49,
                    'assigned_to' => 8,
                    'assigned_at' => Carbon::now(),
                    'approved_at' => Carbon::now(),
                    'approved_by' => 3,
                    'rejected_at' => null,
                    'rejected_by' => null,
                    'rejection_reason' => null,
                    'quotation_sent' => 1,
                    'quotation_sent_at' => Carbon::now(),
                    'quotation_document' => null,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 4,
                    'rfq_number' => 'RFQ-2025-004',
                    'requester_id' => 5,
                    'department_id' => 1,
                    'cost_center_id' => 1,
                    'sub_cost_center_id' => 1,
                    'company_id' => 4,
                    'warehouse_id' => 203,
                    'organization_name' => 'Elite Constructions',
                    'organization_email' => 'contact@eliteconstructions.com',
                    'city' => 'Taif',
                    'contact_number' => '0564782155',
                    'request_type' => 1,
                    'payment_type' => 46,
                    'request_date' => '2025-03-16',
                    'expected_delivery_date' => '2025-03-30',
                    'closing_date' => '2025-03-22',
                    'attachments' => null,
                    'notes' => 'Request for heavy machinery parts.',
                    'status_id' => 50,
                    'assigned_to' => 9,
                    'assigned_at' => Carbon::now(),
                    'approved_at' => null,
                    'approved_by' => null,
                    'rejected_at' => Carbon::now(),
                    'rejected_by' => 6,
                    'rejection_reason' => 'Supplier unavailability.',
                    'quotation_sent' => 0,
                    'quotation_sent_at' => null,
                    'quotation_document' => null,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
            ];

            // Insert RFQs into the database
            try {
                Rfq::insert($rfqs);
            } catch (\Exception $e) {
                // Fallback to DB facade if model insertion fails
                DB::table('rfqs')->insert($rfqs);
            }

            DB::commit();
            $this->command->info('RFQs seeded successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Error seeding RFQs: ' . $e->getMessage());
        }
    }
}
