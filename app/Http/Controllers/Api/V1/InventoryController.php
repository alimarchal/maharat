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
        $inventory = QueryBuilder::for(Inventory::class)
            ->allowedIncludes(InventoryParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new InventoryResource($inventory)
        ], Response::HTTP_OK);
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
    public function adjustInventory(UpdateInventoryRequest $request, Inventory $inventory, string $type): JsonResponse
    {
        try {
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
                // For adjustment, the quantity in request can be positive or negative
                $newQuantity = $inventory->quantity + $request->quantity;
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
}
