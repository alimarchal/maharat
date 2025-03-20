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

class RfqController extends Controller
{
    public function index()
    {
        try {
            $rfqs = Rfq::with(['status', 'items', 'department', 'costCenter', 'subCostCenter', 'requester', 'warehouse', 'paymentType', 'categories'])
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

    public function show(string $id)
    {
        try {
            Log::info("Fetching RFQ with ID: $id");

            // Find the RFQ with all necessary relationships
            $rfq = Rfq::with([
                'status',
                'items.unit',
                'items.brand',
                'warehouse',
                'requester',
                'paymentType',
                'categories'
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
        Log::info("Latest RFQ from database:", ['rfq' => $latestRfq]);

        $lastNumber = 0;

        // Ensure we got a valid RFQ and extract its last numeric part
        if ($latestRfq && isset($latestRfq->rfq_number)) {
            // Extract the last number part using a regex pattern
            if (preg_match('/RFQ-\d{4}-(\d+)/', $latestRfq->rfq_number, $matches)) {
                $lastNumber = intval($matches[1]); // Convert to integer
                Log::info("Extracted last number from RFQ:", ['lastNumber' => $lastNumber]);
            } else {
                Log::warning("Regex did not match, RFQ format might be incorrect.");
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
        Log::info('RFQ Creation request received');
        Log::info('Request data:', $request->except(['attachments'])); // Log everything except file data
        
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
                'requester_id' => auth()->id() ?? 1,
                'created_at' => now(),
                'updated_at' => now()
            ];
            
            Log::info('Creating RFQ with data:', $rfqData);
            
            // Insert RFQ directly with query builder
            $rfqId = DB::table('rfqs')->insertGetId($rfqData);
            
            if (!$rfqId) {
                throw new \Exception("Failed to create RFQ record");
            }
            
            Log::info("RFQ created with ID: $rfqId");
            
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
                        
                        Log::info("Creating RFQ item for RFQ ID: $rfqId", $itemData);
                        
                        // Direct DB insert
                        $itemId = DB::table('rfq_items')->insertGetId($itemData);
                        Log::info("Item created with ID: $itemId");
                        
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
        Log::info("RFQ Update request received for ID: $id");
        Log::info('Request data:', $request->except(['attachments']));

        // First verify the RFQ exists
        $rfq = Rfq::findOrFail($id);

        DB::beginTransaction();
        try {
            $oldStatus = $rfq->status_id;

            // Prepare data for updating
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

            // Remove null/empty values
            $updateData = array_filter($updateData, fn($value) => $value !== null && $value !== '');

            Log::info('Updating RFQ with data:', $updateData);

            // Update RFQ record
            $rfq->update($updateData);

            // Process category update
            $categoryId = $request->input('category_id');
            if (!empty($categoryId)) {
                Log::info("Updating category for RFQ ID: $id to category ID: $categoryId");

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