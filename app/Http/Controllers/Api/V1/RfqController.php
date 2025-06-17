<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Resources\V1\RfqResource;
use App\Models\Rfq;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use App\Models\Status;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\Schema;
use App\QueryParameters\RfqParameters;

class RfqController extends Controller
{
    public function index()
    {
        try {
            Log::info('Starting RFQ index request');

            // Check if sub_cost_centers table exists
            $hasSubCostCenters = Schema::hasTable('sub_cost_centers');
            Log::info('Sub cost centers table exists: ' . ($hasSubCostCenters ? 'yes' : 'no'));

            // Build the relationships array
            $relationships = ['status', 'supplier', 'department', 'costCenter', 'requester'];
            Log::info('Base relationships: ' . implode(', ', $relationships));

            // Only include subCostCenter if the table exists
            if ($hasSubCostCenters) {
                $relationships[] = 'subCostCenter';
                Log::info('Added subCostCenter to relationships');
            }

            Log::info('Final relationships to load: ' . implode(', ', $relationships));

            $rfqs = QueryBuilder::for(Rfq::class)
                ->allowedFilters(RfqParameters::ALLOWED_FILTERS)
                ->allowedSorts(RfqParameters::ALLOWED_SORTS)
                ->allowedIncludes(RfqParameters::ALLOWED_INCLUDES)
                ->with($relationships)
                ->orderBy('created_at', 'desc')
                ->paginate(10);

            // Log requester information for each RFQ
            foreach ($rfqs as $rfq) {
                Log::info("RFQ ID: {$rfq->id}, Requester ID: {$rfq->requester_id}, Requester Loaded: " . ($rfq->relationLoaded('requester') ? 'yes' : 'no'));
                if ($rfq->relationLoaded('requester') && $rfq->requester) {
                    Log::info("Requester Name: {$rfq->requester->name}");
                }
            }

            Log::info('Successfully fetched RFQs');

            return RfqResource::collection($rfqs);
        } catch (\Exception $e) {
            Log::error('Error in RFQ index: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch RFQs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(string $id)
    {
        try {
            // Log::info("Fetching RFQ with ID: $id");

            // Find the RFQ with all necessary relationships
            $rfq = Rfq::with([
                'status',
                'items.unit',
                'items.brand',
                'warehouse',
                'requester',
                'paymentType',
                'categories',
                'items.product',
                'statusLogs.status',
                'statusLogs.changedBy'
            ])->findOrFail($id);

            // Get category info for this RFQ
            $category = DB::table('rfq_categories')
                ->where('rfq_id', $id)
                ->join('product_categories', 'rfq_categories.category_id', '=', 'product_categories.id')
                ->select('product_categories.*')
                ->first();

            // If category exists, append it to RFQ
            if ($category) {
                $rfq->category_id = $category->id;
                $rfq->category_name = $category->name;
            }

            // Ensure each item includes the specification field as the original filename
            foreach ($rfq->items as $item) {
                if ($item->attachment && empty($item->specifications)) {
                    $item->specifications = basename($item->attachment);
                }
            }

            Log::info("RFQ found and being returned");

            return response()->json([
                'data' => new RfqResource($rfq)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            Log::error("Error fetching RFQ $id: " . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch RFQ',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function getNewRFQNumber()
    {
        $currentYear = date('Y');

        // Fetch the latest RFQ number that follows the correct pattern
        $latestRfq = Rfq::where('rfq_number', 'like', "RFQ-$currentYear-%")
            ->orderByRaw("CAST(SUBSTRING_INDEX(rfq_number, '-', -1) AS UNSIGNED) DESC")
            ->first();

        // Log what we fetched
        //Log::info("Latest RFQ from database:", ['rfq' => $latestRfq]);

        $lastNumber = 0;

        // Ensure we got a valid RFQ and extract its last numeric part
        if ($latestRfq && isset($latestRfq->rfq_number)) {
            // Extract the last number part using a regex pattern
            if (preg_match('/RFQ-\d{4}-(\d+)/', $latestRfq->rfq_number, $matches)) {
                $lastNumber = intval($matches[1]); // Convert to integer
                //Log::info("Extracted last number from RFQ:", ['lastNumber' => $lastNumber]);
            } else {
                //Log::warning("Regex did not match, RFQ format might be incorrect.");
            }
        } else {
            Log::warning("No valid RFQ found in the database, starting from 0001.");
        }

        // Generate new number with 4 digits
        $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        $rfqNumber = "RFQ-$currentYear-$newNumber";

        Log::info("Generated new RFQ number:", ['rfqNumber' => $rfqNumber]);

        return $rfqNumber;
    }

    public function store(Request $request)
    {

        DB::beginTransaction();
        try {
            // Generate a unique RFQ number
            $rfq_number = $this->getNewRFQNumber();

            // Create base RFQ data array
            $rfqData = [
                'organization_name' => $request->input('organization_name'),
                'organization_email' => $request->input('organization_email'),
                'city' => $request->input('city'),
                'request_date' => $request->input('request_date'),
                'closing_date' => $request->input('closing_date'),
                'payment_type' => $request->input('payment_type'),
                'contact_number' => $request->input('contact_number'),
                'status_id' => DB::table('statuses')
                    ->where('type', 'Purchase RFQ Status')
                    ->where('name', 'Pending')
                    ->value('id'),
                'rfq_number' => $rfq_number,
                'warehouse_id' => $request->input('warehouse_id'),
                'cost_center_id' => $request->input('cost_center_id'),
                'sub_cost_center_id' => $request->input('sub_cost_center_id'),
                'requester_id' => auth()->id() ?? 1,
                'created_at' => now(),
                'updated_at' => now()
            ];

            // Insert RFQ directly with query builder
            $rfqId = DB::table('rfqs')->insertGetId($rfqData);

            if (!$rfqId) {
                throw new \Exception("Failed to create RFQ record");
            }


            // Only attach category if it's a valid ID
            $categoryId = $request->input('category_id');
            if (!empty($categoryId)) {
                Log::info("Attaching category ID: $categoryId to RFQ ID: $rfqId");

                try {
                    // Direct DB query to attach category
                    $inserted = DB::table('rfq_categories')->insert([
                        'rfq_id' => $rfqId,
                        'category_id' => (int)$categoryId,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);

                    Log::info("Category attachment result: " . ($inserted ? "Success" : "Failed"));
                } catch (\Exception $categoryException) {
                    Log::error("Error attaching category: " . $categoryException->getMessage());
                    // Continue execution, don't throw the exception
                }
            }

            // Create RFQ items
            if ($request->has('items') && is_array($request->input('items'))) {
                foreach ($request->input('items') as $index => $item) {
                    try {
                        // Build item data
                        $itemData = [
                            'rfq_id' => $rfqId,
                            'product_id' => $item['product_id'] ?? null,
                            'item_name' => $item['item_name'] ?? null,
                            'description' => $item['description'] ?? null,
                            'unit_id' => $item['unit_id'] ?? null,
                            'quantity' => $item['quantity'] ?? null,
                            'brand_id' => $item['brand_id'] ?? null,
                            'expected_delivery_date' => $item['expected_delivery_date'] ?? null,
                            'status_id' => $item['status_id'] ?? 47,
                            'created_at' => now(),
                            'updated_at' => now()
                        ];

                        // Handle file upload if exists
                        if ($request->hasFile("attachments.{$index}")) {
                            $file = $request->file("attachments.{$index}");
                            $originalName = $file->getClientOriginalName();
                            $path = $file->store('rfq-attachments', 'public');

                            // Store file path in attachment column
                            $itemData['attachment'] = $path;

                            // Store original filename in specifications column
                            $itemData['specifications'] = $originalName;

                            Log::info("Saved file with original name: $originalName at path: $path");
                        }

                        // Remove null values
                        $itemData = array_filter($itemData, function ($value) {
                            return $value !== null;
                        });

                        // Direct DB insert
                        $itemId = DB::table('rfq_items')->insertGetId($itemData);

                    } catch (\Exception $itemException) {
                        Log::error("Error creating item: " . $itemException->getMessage());
                        // Continue with other items
                    }
                }
            }

            // Create initial status log
            try {
                DB::table('rfq_status_logs')->insert([
                    'rfq_id' => $rfqId,
                    'status_id' => $request->input('status_id', 47),
                    'changed_by' => auth()->id() ?? 1,
                    'remarks' => 'RFQ Created',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } catch (\Exception $logException) {
                Log::error("Error creating status log: " . $logException->getMessage());
                // Continue execution
            }

            DB::commit();
            Log::info('RFQ created successfully with ID: ' . $rfqId);

            // Get the new RFQ to return
            $rfq = Rfq::with(['status', 'warehouse', 'items.unit', 'items.brand'])
                ->findOrFail($rfqId);

            // Return response with loaded relationships
            return response()->json([
                'success' => true,
                'message' => 'RFQ created successfully',
                'data' => new RfqResource($rfq)
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('RFQ Creation Error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to create RFQ',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function update(Request $request, $id)
    {

        // First verify the RFQ exists
        $rfq = Rfq::findOrFail($id);

        DB::beginTransaction();
        try {
            $oldStatus = $rfq->status_id;

            // Prepare data for updating
            $updateData = [
                'organization_name' => $request->input('organization_name'),
                'organization_email' => $request->input('organization_email'),
                'city' => $request->input('city'),
                'warehouse_id' => $request->input('warehouse_id'),
                'request_date' => $request->input('request_date'),
                'closing_date' => $request->input('closing_date'),
                'rfq_number' => $request->input('rfq_number'),
                'cost_center_id' => $request->input('cost_center_id'),
                'sub_cost_center_id' => $request->input('sub_cost_center_id'),
                'payment_type' => $request->input('payment_type'),
                'contact_number' => $request->input('contact_number'),
                'status_id' => $request->input('status_id', 47),
            ];

            // Remove null/empty values
            $updateData = array_filter($updateData, fn($value) => $value !== null && $value !== '');


            // Update RFQ record
            $rfq->update($updateData);

            // Process category update
            $categoryId = $request->input('category_id');
            if (!empty($categoryId)) {

                // Delete existing category records
                DB::table('rfq_categories')->where('rfq_id', $id)->delete();

                // Insert new category
                DB::table('rfq_categories')->insert([
                    'rfq_id' => $id,
                    'category_id' => $categoryId,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            // Process items if provided
            if ($request->has('items') && is_array($request->input('items'))) {
                $existingItemIds = [];

                foreach ($request->input('items') as $index => $item) {
                    try {
                        $itemData = [
                            'rfq_id' => $id,
                            'product_id' => $item['product_id'] ?? null,
                            'item_name' => $item['item_name'] ?? null,
                            'description' => $item['description'] ?? null,
                            'unit_id' => $item['unit_id'] ?? null,
                            'quantity' => $item['quantity'] ?? null,
                            'brand_id' => $item['brand_id'] ?? null,
                            'expected_delivery_date' => $item['expected_delivery_date'] ?? null,
                            'status_id' => $item['status_id'] ?? 47,
                            'updated_at' => now()
                        ];

                        // Handle file upload
                        if ($request->hasFile("items.{$index}.attachment")) {
                            $file = $request->file("items.{$index}.attachment");
                            $path = $file->store('rfq-attachments', 'public');
                            $itemData['attachment'] = $path;
                        }

                        $itemData = array_filter($itemData, fn($value) => $value !== null);

                        if (isset($item['id']) && !empty($item['id'])) {
                            // Update existing item
                            DB::table('rfq_items')
                                ->where('id', $item['id'])
                                ->update($itemData);
                            $existingItemIds[] = $item['id'];
                        } else {
                            // Create new item
                            $itemData['created_at'] = now();
                            $newItemId = DB::table('rfq_items')->insertGetId($itemData);
                            $existingItemIds[] = $newItemId;
                        }
                    } catch (\Exception $itemErr) {
                        Log::error("Error processing item: " . $itemErr->getMessage());
                    }
                }

                // Remove items that were not included in the update
                if (!empty($existingItemIds)) {
                    DB::table('rfq_items')
                        ->where('rfq_id', $id)
                        ->whereNotIn('id', $existingItemIds)
                        ->delete();
                }
            }

            DB::commit();

            // Reload RFQ with fresh data
            $refreshedRfq = Rfq::with(['status', 'warehouse', 'items.unit', 'items.brand'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'RFQ updated successfully',
                'data' => new RfqResource($refreshedRfq)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to update RFQ $id: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to update RFQ',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }


    public function destroy($id)
    {
        Log::info("RFQ Delete request received for ID: $id");

        $rfq = Rfq::where('id', $id)->first();

        if (!$rfq) {
            Log::warning("RFQ not found with ID: $id");
            return response()->json(['message' => 'RFQ not found'], 404);
        }

        DB::beginTransaction();
        try {
            // Delete categories
            DB::table('rfq_categories')->where('rfq_id', $id)->delete();

            // Delete items
            $rfq->items()->forceDelete();

            // Delete RFQ with forceDelete
            $rfq->forceDelete();

            DB::commit();
            Log::info("RFQ $id deleted successfully");

            return response()->json(['message' => 'RFQ deleted successfully'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to delete RFQ $id: " . $e->getMessage());

            return response()->json([
                'message' => 'Failed to delete RFQ',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload a PDF document for an RFQ
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    
    public function uploadDocument(Request $request, $id)
    {
        try {
            // Find the RFQ
            $rfq = Rfq::findOrFail($id);
            
            // Validate request
            $request->validate([
                'quotation_document' => 'required|file|mimes:pdf|max:10240', // Max 10MB
            ]);
            
            // Get the uploaded file
            $file = $request->file('quotation_document');
            
            // Store the file in the public disk under the 'rfq-documents' directory
            $path = $file->store('rfq-documents', 'public');
            
            // Update the RFQ record with the file path
            $rfq->quotation_document = $path;
            $rfq->save();
            
            // Return success response
            return response()->json([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'document_url' => $path,
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'RFQ not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error uploading document: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload an Excel document for an RFQ
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadExcel(Request $request, $id)
    {
        try {
            // Find the RFQ
            $rfq = Rfq::findOrFail($id);
            
            // Validate request
            $request->validate([
                'excel_attachment' => 'required|file|mimes:xlsx,xls,csv|max:10240', // Max 10MB
            ]);
            
            // Get the uploaded file
            $file = $request->file('excel_attachment');
            
            // Store the file in the public disk under the 'rfq-excel' directory
            $path = $file->store('rfq-excel', 'public');
            
            // Update the RFQ record with the file path
            $rfq->excel_attachment = $path;
            $rfq->save();
            
            // Return success response
            return response()->json([
                'success' => true,
                'message' => 'Excel file uploaded successfully',
                'excel_url' => $path,
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'RFQ not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error uploading Excel file: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload Excel file',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getFormData()
    {
        try {
            // Get a new RFQ number
            $rfqNumber = $this->getNewRFQNumber();

            // Prepare response data
            $responseData = [
                'organization_name' => '',
                'organization_email' => '',
                'city' => '',
                'rfq_number' => $rfqNumber,
                'request_date' => now()->format('Y-m-d'),
                'expected_delivery_date' => now()->addDays(7)->format('Y-m-d'),
                'status_id' => 47
            ];

            // Try to get authenticated user data if available
            if (auth()->check() && auth()->user()->company) {
                $responseData['organization_name'] = auth()->user()->company->name ?? '';
                $responseData['organization_email'] = auth()->user()->company->email ?? '';
                $responseData['city'] = auth()->user()->company->city ?? '';
            }

            Log::info('Form data generated successfully', $responseData);
            return response()->json($responseData);
        } catch (\Exception $e) {
            Log::error('Failed to fetch form data: ' . $e->getMessage());

            return response()->json([
                'message' => 'Failed to fetch RFQ',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getRfqsWithoutPurchaseOrders()
    {
        try {
            $rfqs = DB::select("
                SELECT id, organization_name, rfq_number
                FROM rfqs
                WHERE id NOT IN (
                    SELECT rfq_id
                    FROM purchase_orders
                    WHERE rfq_id IS NOT NULL
                )
                ORDER BY created_at DESC
            ");

            return response()->json([
                'success' => true,
                'data' => $rfqs
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in getRfqsWithoutPurchaseOrders:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch RFQs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        try {
            Log::info('RFQ status update endpoint called', [
                'rfq_id' => $id,
                'request_data' => $request->all(),
                'auth_user' => auth()->id()
            ]);

            $rfq = Rfq::findOrFail($id);
            
            Log::info('Found RFQ for status update', [
                'rfq_id' => $id,
                'current_status_id' => $rfq->status_id,
                'new_status_id' => $request->input('status_id')
            ]);
            
            // Update status
            $rfq->status_id = $request->input('status_id');
            $rfq->approved_at = now();
            $rfq->approved_by = auth()->id();
            
            Log::info('About to save RFQ with new status', [
                'rfq_id' => $id,
                'new_status_id' => $rfq->status_id,
                'is_dirty' => $rfq->isDirty(),
                'changes' => $rfq->getDirty()
            ]);

            $updated = $rfq->save();
            
            Log::info('RFQ status update save result', [
                'rfq_id' => $id,
                'update_success' => $updated,
                'final_status_id' => $rfq->status_id,
                'is_dirty' => $rfq->isDirty(),
                'changes' => $rfq->getDirty()
            ]);

            // Create status log entry
            $logCreated = DB::table('rfq_status_logs')->insert([
                'rfq_id' => $id,
                'status_id' => $request->input('status_id'),
                'changed_by' => auth()->id(),
                'remarks' => 'RFQ Status Updated',
                'approved_by' => auth()->id(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            Log::info('Status log entry created', [
                'rfq_id' => $id,
                'log_created' => $logCreated
            ]);

            // Verify the update
            $refreshedRfq = Rfq::find($id);
            Log::info('Final RFQ status verification', [
                'rfq_id' => $id,
                'status_id' => $refreshedRfq->status_id,
                'expected_status_id' => $request->input('status_id')
            ]);

            return response()->json([
                'success' => true,
                'message' => 'RFQ status updated successfully',
                'data' => new RfqResource($rfq)
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update RFQ status', [
                'rfq_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update RFQ status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

}
