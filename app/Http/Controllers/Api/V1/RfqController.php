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

class RfqController extends Controller
{
    public function index()
    {
        try {
            $rfqs = Rfq::with(['status', 'items', 'department', 'costCenter', 'subCostCenter'])
                ->orderBy('created_at', 'desc')
                ->paginate(10);

            return response()->json([
                'data' => RfqResource::collection($rfqs),
                'meta' => [
                    'total' => $rfqs->total(),
                    'per_page' => $rfqs->perPage(),
                    'current_page' => $rfqs->currentPage(),
                    'last_page' => $rfqs->lastPage(),
                    'from' => $rfqs->firstItem(),
                    'to' => $rfqs->lastItem(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch RFQs: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch RFQs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function getNewRFQNumber()
    {
        $currentYear = date('Y');
        $latestRfq = Rfq::where('rfq_number', 'like', "RFQ-$currentYear-%")
            ->orderBy('rfq_number', 'desc')
            ->first();

        // Fetch the latest RFQ based on ID (most recent entry)
        $latestRfq = Rfq::orderBy('id', 'desc')->first();

        $lastNumber = 0;
        
        // Check if there's an existing RFQ and extract the last number
        if ($latestRfq && preg_match('/RFQ-\d{4}-(\d{4})/', $latestRfq->rfq_number, $matches)) {
            $lastNumber = intval($matches[1]);
        }

        // Generate new number with 4 digits
        $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        $rfqNumber = "RFQ-$currentYear-$newNumber";

        Log::info("Generated new RFQ number: $rfqNumber");

        return $rfqNumber;
    }

    public function store(Request $request)
    {
        Log::info('RFQ Creation request received');
        Log::info('Request data:', $request->all());
        
        DB::beginTransaction();
        try {
            // Generate a unique RFQ number
            $rfq_number = $this->getNewRFQNumber();
            
            // Create base RFQ data array
            $rfqData = [
                'organization_email' => $request->input('organization_email'),
                'city' => $request->input('city'),
                'request_date' => $request->input('request_date'),
                'closing_date' => $request->input('closing_date'),
                'payment_type' => $request->input('payment_type'),
                'contact_number' => $request->input('contact_number'),
                'status_id' => $request->input('status_id', 47),
                'rfq_number' => $rfq_number,
                'warehouse_id' => $request->input('warehouse_id'),
                // Set default requester_id to authenticated user if not provided
                'requester_id' => auth()->id() ?? 1
            ];
            
            Log::info('Creating RFQ with data:', $rfqData);
            
            // Create RFQ with an explicit insert to make sure we have an ID
            $rfq = new Rfq();
            foreach ($rfqData as $key => $value) {
                $rfq->$key = $value;
            }
            $rfq->save();
            
            // Get the ID from the newly created RFQ
            $rfqId = $rfq->id;
            Log::info("RFQ created with ID: $rfqId");
            
            // Only attach category if it's a valid ID
            $categoryId = $request->input('category_id');
            if (!empty($categoryId)) {
                Log::info("Attaching category ID: $categoryId to RFQ ID: $rfqId");
                
                // Try-catch specifically for category attachment
                try {
                    // Direct DB query to attach category with hard-coded values for debugging
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

            // Create RFQ items with direct DB insertion for more reliability
            if ($request->has('items') && is_array($request->input('items'))) {
                foreach ($request->input('items') as $index => $item) {
                    try {
                        $itemData = [
                            'rfq_id' => $rfqId, // Use the actual rfqId, not a placeholder
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
                            $path = $file->store('rfq-attachments', 'public');
                            $itemData['attachment'] = $path;
                        }
                        
                        // Remove null values
                        $itemData = array_filter($itemData, function ($value) {
                            return $value !== null;
                        });
                        
                        Log::info("Creating RFQ item for RFQ ID: $rfqId", $itemData);
                        
                        // Direct DB insert instead of using the relationship
                        $itemInserted = DB::table('rfq_items')->insert($itemData);
                        Log::info("Item insertion result: " . ($itemInserted ? "Success" : "Failed"));
                        
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
                    'status_id' => $rfq->status_id,
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

            // Return response with loaded relationships
            return response()->json([
                'success' => true,
                'message' => 'RFQ created successfully',
                'data' => new RfqResource(
                    $rfq->load(['status', 'warehouse', 'items.unit', 'items.brand'])
                )
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
    
    public function show(string $id)
    {
        try {
            Log::info("Fetching RFQ with ID: $id");
            
            $rfq = Rfq::with(['status', 'items.unit', 'items.brand', 'warehouse'])
                ->findOrFail($id);
                
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

    public function update(Request $request, $id)
    {
        Log::info("RFQ Update request received for ID: $id");
        Log::info('Request data:', $request->all());
        
        DB::beginTransaction();
        try {
            // Find the RFQ
            $rfq = Rfq::findOrFail($id);
            $oldStatus = $rfq->status_id;

            // Get data to update RFQ table
            $updateData = [
                'organization_email' => $request->input('organization_email'),
                'city' => $request->input('city'),
                'warehouse_id' => $request->input('warehouse_id'),
                'request_date' => $request->input('request_date'),
                'closing_date' => $request->input('closing_date'),
                'rfq_number' => $request->input('rfq_number'),
                'payment_type' => $request->input('payment_type'),
                'contact_number' => $request->input('contact_number'),
                'status_id' => $request->input('status_id', 47),
            ];

            // Filter out null/empty values
            $updateData = array_filter($updateData, function($value) {
                return $value !== null && $value !== '';
            });

            Log::info('Updating RFQ with data:', $updateData);
            
            // Update the RFQ record
            $updated = $rfq->update($updateData);
            Log::info("RFQ update result: " . ($updated ? 'success' : 'failed'));
            
            // Handle category if provided
            $categoryId = $request->input('category_id');
            if (!empty($categoryId)) {
                Log::info("Updating category for RFQ ID: $id to category ID: $categoryId");
                
                // Delete existing categories
                $deleted = DB::table('rfq_categories')->where('rfq_id', $id)->delete();
                Log::info("Deleted $deleted existing categories");
                
                // Insert new category
                $inserted = DB::table('rfq_categories')->insert([
                    'rfq_id' => $id,
                    'category_id' => $categoryId,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
                Log::info("Category insert result: " . ($inserted ? 'success' : 'failed'));
            }

            // Handle items if provided
            if ($request->has('items') && is_array($request->input('items'))) {
                $itemCount = count($request->input('items'));
                Log::info("Processing $itemCount items");
                $existingItemIds = [];

                foreach ($request->input('items') as $index => $item) {
                    Log::info("Processing item at index $index");
                    
                    $itemData = [
                        'rfq_id' => $id,
                        'item_name' => $item['item_name'] ?? null,
                        'description' => $item['description'] ?? null,
                        'unit_id' => $item['unit_id'] ?? null,
                        'quantity' => $item['quantity'] ?? null,
                        'brand_id' => $item['brand_id'] ?? null,
                        'expected_delivery_date' => $item['expected_delivery_date'] ?? null,
                        'status_id' => $item['status_id'] ?? 47
                    ];

                    // Handle file upload if exists
                    if ($request->hasFile("attachments.{$index}")) {
                        Log::info("Attachment found for item $index");
                        $file = $request->file("attachments.{$index}");
                        $path = $file->store('rfq-attachments', 'public');
                        $itemData['attachment'] = $path;
                    }

                    // Remove null values
                    $itemData = array_filter($itemData, function ($value) {
                        return $value !== null;
                    });

                    // If item has an ID, update it; otherwise create a new one
                    if (isset($item['id']) && !empty($item['id'])) {
                        $itemId = $item['id'];
                        Log::info("Updating existing item with ID: $itemId");
                        
                        // Use direct query for update for better visibility
                        $updated = DB::table('rfq_items')
                            ->where('id', $itemId)
                            ->where('rfq_id', $id)
                            ->update($itemData);
                            
                        Log::info("Item update result: " . ($updated ? 'success' : 'failed'));
                        $existingItemIds[] = $itemId;
                    } else {
                        Log::info("Creating new item");
                        // Ensure rfq_id is included
                        $itemData['rfq_id'] = $id;
                        
                        // Use direct query for insert
                        $newItemId = DB::table('rfq_items')->insertGetId($itemData);
                        Log::info("New item created with ID: $newItemId");
                        $existingItemIds[] = $newItemId;
                    }
                }

                // Remove items that were not included in the update
                if (!empty($existingItemIds)) {
                    $deleted = DB::table('rfq_items')
                        ->where('rfq_id', $id)
                        ->whereNotIn('id', $existingItemIds)
                        ->delete();
                    Log::info("Removed $deleted items not in the update");
                }
            }

            // Record status change if status was updated
            if ($oldStatus != $rfq->status_id) {
                $rfq->statusLogs()->create([
                    'status_id' => $rfq->status_id,
                    'changed_by' => auth()->id() ?? 1,
                    'remarks' => 'RFQ Status Updated'
                ]);
            }

            DB::commit();
            Log::info("RFQ $id updated successfully");

            // Reload RFQ with fresh data
            $refreshedRfq = Rfq::with(['status', 'warehouse', 'items.unit', 'items.brand'])
                ->findOrFail($id);

            // Return response with loaded relationships and success flag
            return response()->json([
                'success' => true,
                'message' => 'RFQ updated successfully',
                'data' => new RfqResource($refreshedRfq)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to update RFQ $id: " . $e->getMessage());
            Log::error($e->getTraceAsString());
            
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
            $rfq->items()->delete();
            
            // Delete RFQ
            $rfq->delete();
            
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

    public function getFormData()
    {
        try {
            // Get a new RFQ number
            $rfqNumber = $this->getNewRFQNumber();
            
            // Prepare response data
            $responseData = [
                'organization_email' => '',
                'city' => '',
                'rfq_number' => $rfqNumber,
                'request_date' => now()->format('Y-m-d'),
                'expected_delivery_date' => now()->addDays(7)->format('Y-m-d'),
                'status_id' => 47
            ];
            
            // Try to get authenticated user data if available
            if (auth()->check() && auth()->user()->company) {
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

}