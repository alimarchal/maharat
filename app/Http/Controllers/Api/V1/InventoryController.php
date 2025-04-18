<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Inventory\StoreInventoryRequest;
use App\Http\Requests\V1\Inventory\UpdateInventoryRequest;
use App\Http\Resources\V1\InventoryResource;
use App\Models\Inventory;
use App\QueryParameters\InventoryParameters;
use App\Services\InventoryTransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    protected InventoryTransactionService $transactionService;

    public function __construct(InventoryTransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    public function index(): JsonResponse|ResourceCollection
    {
        $inventories = QueryBuilder::for(Inventory::class)
            ->allowedFilters(InventoryParameters::ALLOWED_FILTERS)
            ->allowedSorts(InventoryParameters::ALLOWED_SORTS)
            ->allowedIncludes(InventoryParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($inventories->isEmpty()) {
            return response()->json([
                'message' => 'No inventories found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return InventoryResource::collection($inventories);
    }

    public function store(StoreInventoryRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $request->merge(['user_id' => auth()->user()->id]);
            // Create new inventory record
            $inventory = Inventory::create($request->validated());

            // Record initial stock transaction if quantity is greater than 0
            if ($inventory->quantity > 0) {
                $this->transactionService->recordTransaction(
                    $inventory,
                    $request->transaction_type,
                    $inventory->quantity,
                    $request->reference_type,
                    $request->reference_id,
                    'INIT-' . $inventory->id,
                    $request->notes,
                );
            }

            DB::commit();

            return response()->json([
                'message' => 'Inventory created successfully',
                'data' => new InventoryResource($inventory->load(['warehouse', 'product']))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create inventory',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        try {
            \Log::info('Inventory show method called with ID: ' . $id);
            
            // Check if the ID is numeric and valid
            if (!is_numeric($id) || $id <= 0) {
                \Log::warning('Invalid inventory ID format: ' . $id);
                return response()->json([
                    'message' => 'Invalid inventory ID format',
                    'error' => 'ID must be a positive number'
                ], Response::HTTP_BAD_REQUEST);
            }
            
            // Check if the inventory exists
            $exists = Inventory::where('id', $id)->exists();
            \Log::info('Inventory exists check for ID ' . $id . ': ' . ($exists ? 'Yes' : 'No'));
            
            $inventory = QueryBuilder::for(Inventory::class)
                ->allowedIncludes(InventoryParameters::ALLOWED_INCLUDES)
                ->findOrFail($id);
            
            \Log::info('Inventory found with ID: ' . $id . ', includes loaded: ' . implode(', ', $inventory->getRelations()));
            
            return response()->json([
                'data' => new InventoryResource($inventory)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            \Log::error('Error in Inventory show method for ID ' . $id . ': ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            return response()->json([
                'message' => 'Failed to fetch inventory data',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function update(UpdateInventoryRequest $request, Inventory $inventory): JsonResponse
    {
        try {
            DB::beginTransaction();

            $quantityChange = $request->quantity;
            $transactionType = $quantityChange >= 0 ? $request->transaction_type : $request->transaction_type;

            // Record the transaction before updating inventory
            if ($inventory->quantity > 0) {
                $this->transactionService->recordTransaction(
                    $inventory,
                    $transactionType,
                    abs($quantityChange),
                    $request->reference_type,
                    $request->reference_id,
                    'UPD-' . $inventory->id,
                    $request->notes .  'Manual inventory update',
                );
            }



            // Update inventory with new values
            $newQuantity = $inventory->quantity + $quantityChange;

            $inventory->update([
                'quantity' => $newQuantity,
                'reorder_level' => $request->reorder_level,
                'description' => $request->description,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Inventory updated successfully',
                'data' => new InventoryResource($inventory->load(['warehouse', 'product']))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update inventory',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(Inventory $inventory): JsonResponse
    {
        try {
            $inventory->delete();

            return response()->json([
                'message' => 'Inventory deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete inventory',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Adjust inventory with specific transaction type
     */
    public function adjustInventory(UpdateInventoryRequest $request, Inventory $inventory): JsonResponse
    {
        try {
            // Get the transaction type from the route
            $type = request()->route()->getName();
            $type = str_replace('inventories.', '', $type); // Extract stock-in, stock-out, or adjustment
            $type = str_replace('-', '_', $type); // Convert stock-in to stock_in if needed

            if (!in_array($type, ['stock_in', 'stock_out', 'adjustment'])) {
                return response()->json([
                    'message' => 'Invalid transaction type',
                ], Response::HTTP_BAD_REQUEST);
            }

            DB::beginTransaction();

            $quantity = abs($request->quantity);

            // Record the transaction with specified type
            $this->transactionService->recordTransaction(
                $inventory,
                $type,
                $quantity,
                $request->reference_type ?? 'manual_' . $type,
                $request->reference_id,
                $request->reference_number ?? strtoupper($type) . '-' . $inventory->id,
                $request->notes ?? ('Manual inventory ' . str_replace('_', ' ', $type))
            );

            // Update inventory quantity based on transaction type
            $newQuantity = $inventory->quantity;

            if ($type === 'stock_in') {
                $newQuantity += $quantity;
            } elseif ($type === 'stock_out') {
                $newQuantity -= $quantity;
            } elseif ($type === 'adjustment') {
                // For adjustment, the quantity in request represents the final quantity
                $newQuantity = $request->quantity;
            }

            $inventory->update([
                'quantity' => $newQuantity,
                'description' => $request->description ?? $inventory->description,
                'reorder_level' => $request->reorder_level ?? $inventory->reorder_level,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Inventory ' . str_replace('_', ' ', $type) . ' processed successfully',
                'data' => new InventoryResource($inventory->load(['warehouse', 'product']))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to process inventory ' . str_replace('_', ' ', $type),
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Adjust inventory for a product with specific transaction type
     */
    public function adjustInventoryByProduct(UpdateInventoryRequest $request, $productId): JsonResponse
    {
        try {
            // Get the transaction type from the route
            $type = request()->route()->getName();
            $type = str_replace('inventories.', '', $type); // Extract stock-in, stock-out, or adjustment
            $type = str_replace('-', '_', $type); // Convert stock-in to stock_in if needed

            if (!in_array($type, ['stock_in', 'stock_out', 'adjustment'])) {
                return response()->json([
                    'message' => 'Invalid transaction type',
                ], Response::HTTP_BAD_REQUEST);
            }

            // Get the warehouse ID from the request
            $warehouseId = $request->warehouse_id;
            if (!$warehouseId) {
                return response()->json([
                    'message' => 'Warehouse ID is required',
                ], Response::HTTP_BAD_REQUEST);
            }

            DB::beginTransaction();

            // Find the inventory record for this product and warehouse
            $inventory = Inventory::where('product_id', $productId)
                ->where('warehouse_id', $warehouseId)
                ->first();

            // If inventory doesn't exist and this is a stock_in operation, create it
            if (!$inventory && $type === 'stock_in') {
                $inventory = Inventory::create([
                    'product_id' => $productId,
                    'warehouse_id' => $warehouseId,
                    'quantity' => 0,
                    'reorder_level' => $request->reorder_level ?? 0,
                    'description' => $request->description ?? null,
                    'user_id' => auth()->id(),
                ]);
            } elseif (!$inventory) {
                return response()->json([
                    'message' => 'No inventory found for this product and warehouse',
                ], Response::HTTP_NOT_FOUND);
            }

            $quantity = abs($request->quantity);

            // Record the transaction with specified type
            $this->transactionService->recordTransaction(
                $inventory,
                $type,
                $quantity,
                $request->reference_type ?? 'manual_' . $type,
                $request->reference_id,
                $request->reference_number ?? strtoupper($type) . '-' . $inventory->id,
                $request->notes ?? ('Manual inventory ' . str_replace('_', ' ', $type))
            );

            // Update inventory quantity based on transaction type
            $newQuantity = $inventory->quantity;

            if ($type === 'stock_in') {
                $newQuantity += $quantity;
            } elseif ($type === 'stock_out') {
                $newQuantity -= $quantity;
            } elseif ($type === 'adjustment') {
                // For adjustment, the quantity in request represents the final quantity
                $newQuantity = $request->quantity;
            }

            $inventory->update([
                'quantity' => $newQuantity,
                'description' => $request->description ?? $inventory->description,
                'reorder_level' => $request->reorder_level ?? $inventory->reorder_level,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Inventory ' . str_replace('_', ' ', $type) . ' processed successfully',
                'data' => new InventoryResource($inventory->load(['warehouse', 'product']))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to process inventory ' . str_replace('_', ' ', $type),
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }


    /**
     * Get inventory for a specific product across all warehouses
     */
    public function getProductInventory(string $productId): JsonResponse
    {
        $inventories = QueryBuilder::for(Inventory::class)
            ->where('product_id', $productId)
            ->allowedIncludes(['warehouse', 'product'])
            ->paginate()
            ->appends(request()->query());

        if ($inventories->isEmpty()) {
            return response()->json([
                'message' => 'No inventory found for this product',
                'data' => []
            ], Response::HTTP_OK);
        }

        return response()->json([
            'data' => InventoryResource::collection($inventories)
        ], Response::HTTP_OK);
    }

    /**
     * Get all inventory items in a specific warehouse
     */
    public function getWarehouseInventory(string $warehouseId): JsonResponse
    {
        $inventories = QueryBuilder::for(Inventory::class)
            ->where('warehouse_id', $warehouseId)
            ->allowedIncludes(['warehouse', 'product'])
            ->paginate()
            ->appends(request()->query());

        if ($inventories->isEmpty()) {
            return response()->json([
                'message' => 'No inventory found in this warehouse',
                'data' => []
            ], Response::HTTP_OK);
        }

        return response()->json([
            'data' => InventoryResource::collection($inventories)
        ], Response::HTTP_OK);
    }

    /**
     * Get all inventory items that are below their reorder level
     */
    public function getLowStockItems()
    {
        $lowStockItems = QueryBuilder::for(Inventory::class)
            ->whereRaw('quantity <= reorder_level')
            ->allowedIncludes(['warehouse', 'product'])
            ->paginate()
            ->appends(request()->query());

        if ($lowStockItems->isEmpty()) {
            return response()->json([
                'message' => 'No low stock items found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return response()->json([
            'data' => InventoryResource::collection($lowStockItems)
        ], Response::HTTP_OK);
    }

    /**
     * Upload an Excel document for an inventory
     */
    public function uploadExcel(Request $request, $id)
    {
        try {
            $inventory = Inventory::findOrFail($id);

            $request->validate([
                'excel_document' => 'required|file|mimes:xlsx,xls|max:10240', // max 10MB
            ]);

            if ($request->hasFile('excel_document')) {
                // Delete old file if exists
                if ($inventory->excel_document && file_exists(public_path('storage/' . $inventory->excel_document))) {
                    unlink(public_path('storage/' . $inventory->excel_document));
                }

                $file = $request->file('excel_document');
                $fileName = 'inventory_' . $inventory->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                $path = 'uploads/inventories/';

                // Make sure the directory exists
                if (!file_exists(public_path('storage/' . $path))) {
                    mkdir(public_path('storage/' . $path), 0777, true);
                }

                // Store the file using Laravel's storage system
                $filePath = $file->storeAs($path, $fileName, 'public');

                // Update the inventory with the document path
                $inventory->excel_document = $filePath;
                $inventory->save();

                return response()->json([
                    'success' => true,
                    'message' => 'Excel document uploaded successfully',
                    'excel_url' => $filePath
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No document found in request'
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload Excel document',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
