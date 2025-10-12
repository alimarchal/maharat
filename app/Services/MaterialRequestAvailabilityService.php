<?php

namespace App\Services;

use App\Models\MaterialRequest;
use App\Models\MaterialRequestItem;
use App\Models\Inventory;
use Illuminate\Support\Facades\Log;

class MaterialRequestAvailabilityService
{
    /**
     * Check if a material request can be fulfilled with current inventory
     * 
     * @param MaterialRequest $materialRequest
     * @return array
     */
    public function checkAvailability(MaterialRequest $materialRequest): array
    {
        $canFulfill = true;
        $missingItems = [];
        $availableItems = [];
        
        Log::info('=== INVENTORY AVAILABILITY CHECK STARTED ===', [
            'material_request_id' => $materialRequest->id,
            'warehouse_id' => $materialRequest->warehouse_id,
            'current_status_id' => $materialRequest->status_id
        ]);

        // Get all items for this material request
        $items = $materialRequest->items()->with('product')->get();
        
        Log::info('=== MATERIAL REQUEST ITEMS ===', [
            'material_request_id' => $materialRequest->id,
            'items_count' => $items->count(),
            'items' => $items->map(function($item) {
                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product->name ?? 'Unknown',
                    'requested_quantity' => $item->quantity
                ];
            })->toArray()
        ]);
        
        foreach ($items as $item) {
            $productId = $item->product_id;
            $warehouseId = $materialRequest->warehouse_id;
            $requestedQty = (float) $item->quantity;
            
            Log::info('=== CHECKING INVENTORY FOR ITEM ===', [
                'material_request_id' => $materialRequest->id,
                'item_id' => $item->id,
                'product_id' => $productId,
                'product_name' => $item->product->name ?? 'Unknown',
                'warehouse_id' => $warehouseId,
                'requested_quantity' => $requestedQty
            ]);
            
            // Get current inventory for this product in this warehouse
            $inventory = Inventory::where('warehouse_id', $warehouseId)
                ->where('product_id', $productId)
                ->first();
            
            if (!$inventory) {
                $canFulfill = false;
                $missingItems[] = [
                    'product_id' => $productId,
                    'product_name' => $item->product->name ?? 'Unknown Product',
                    'requested_quantity' => $requestedQty,
                    'available_quantity' => 0,
                    'shortage' => $requestedQty
                ];
                
                Log::warning('=== NO INVENTORY FOUND ===', [
                    'material_request_id' => $materialRequest->id,
                    'product_id' => $productId,
                    'product_name' => $item->product->name ?? 'Unknown',
                    'warehouse_id' => $warehouseId,
                    'requested_quantity' => $requestedQty,
                    'available_quantity' => 0
                ]);
            } else {
                $availableQty = (float) $inventory->quantity;
                
                Log::info('=== INVENTORY FOUND ===', [
                    'material_request_id' => $materialRequest->id,
                    'product_id' => $productId,
                    'product_name' => $item->product->name ?? 'Unknown',
                    'warehouse_id' => $warehouseId,
                    'requested_quantity' => $requestedQty,
                    'available_quantity' => $availableQty,
                    'inventory_id' => $inventory->id
                ]);
                
                if ($availableQty < $requestedQty) {
                    $canFulfill = false;
                    $shortage = $requestedQty - $availableQty;
                    
                    $missingItems[] = [
                        'product_id' => $productId,
                        'product_name' => $item->product->name ?? 'Unknown Product',
                        'requested_quantity' => $requestedQty,
                        'available_quantity' => $availableQty,
                        'shortage' => $shortage
                    ];
                    
                    Log::warning('=== INSUFFICIENT INVENTORY ===', [
                        'material_request_id' => $materialRequest->id,
                        'product_id' => $productId,
                        'product_name' => $item->product->name ?? 'Unknown',
                        'warehouse_id' => $warehouseId,
                        'requested_quantity' => $requestedQty,
                        'available_quantity' => $availableQty,
                        'shortage' => $shortage
                    ]);
                } else {
                    $availableItems[] = [
                        'product_id' => $productId,
                        'product_name' => $item->product->name ?? 'Unknown Product',
                        'requested_quantity' => $requestedQty,
                        'available_quantity' => $availableQty
                    ];
                    
                    Log::info('=== SUFFICIENT INVENTORY ===', [
                        'material_request_id' => $materialRequest->id,
                        'product_id' => $productId,
                        'product_name' => $item->product->name ?? 'Unknown',
                        'warehouse_id' => $warehouseId,
                        'requested_quantity' => $requestedQty,
                        'available_quantity' => $availableQty
                    ]);
                }
            }
        }

        $result = [
            'can_fulfill' => $canFulfill,
            'missing_items' => $missingItems,
            'available_items' => $availableItems,
            'total_items' => $items->count(),
            'fulfillable_items' => count($availableItems),
            'missing_items_count' => count($missingItems)
        ];

        Log::info('=== INVENTORY AVAILABILITY CHECK COMPLETED ===', [
            'material_request_id' => $materialRequest->id,
            'can_fulfill' => $canFulfill,
            'total_items' => $result['total_items'],
            'fulfillable_items' => $result['fulfillable_items'],
            'missing_items_count' => $result['missing_items_count'],
            'missing_items' => $missingItems,
            'available_items' => $availableItems
        ]);

        return $result;
    }

    /**
     * Check if material request can be set to pending status
     * Only set to pending if all items can be fulfilled
     * 
     * @param MaterialRequest $materialRequest
     * @return bool
     */
    public function canSetToPending(MaterialRequest $materialRequest): bool
    {
        $availability = $this->checkAvailability($materialRequest);
        return $availability['can_fulfill'];
    }

    /**
     * Get detailed availability report for a material request
     * 
     * @param MaterialRequest $materialRequest
     * @return array
     */
    public function getAvailabilityReport(MaterialRequest $materialRequest): array
    {
        $availability = $this->checkAvailability($materialRequest);
        
        return [
            'material_request_id' => $materialRequest->id,
            'warehouse_id' => $materialRequest->warehouse_id,
            'warehouse_name' => $materialRequest->warehouse->name ?? 'Unknown Warehouse',
            'can_fulfill' => $availability['can_fulfill'],
            'summary' => [
                'total_items' => $availability['total_items'],
                'fulfillable_items' => $availability['fulfillable_items'],
                'missing_items_count' => $availability['missing_items_count']
            ],
            'items' => [
                'available' => $availability['available_items'],
                'missing' => $availability['missing_items']
            ],
            'recommendation' => $availability['can_fulfill'] 
                ? 'Material request can be set to pending status' 
                : 'Material request should remain in current status until inventory is available'
        ];
    }
}