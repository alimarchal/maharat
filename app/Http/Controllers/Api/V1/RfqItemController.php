<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\RfqItem\StoreRfqItemRequest;
use App\Http\Requests\V1\RfqItem\UpdateRfqItemRequest;
use App\Http\Resources\V1\RfqItemResource;
use App\Models\RfqItem;
use App\QueryParameters\RfqItemParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class RfqItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = QueryBuilder::for(RfqItem::class)
            ->with(['unit', 'brand'])
            ->get();

        return response()->json([
            'data' => RfqItemResource::collection($items)
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Decode the items JSON string
            $items = json_decode($request->input('items'), true);
            
            if (!is_array($items)) {
                throw new \Exception('Invalid items data');
            }

            foreach ($items as $index => $item) {
                $itemData = [
                    'item_name' => $item['item_name'] ?? null,
                    'description' => $item['description'] ?? null,
                    'unit_id' => $item['unit_id'] ?? null,
                    'quantity' => $item['quantity'] ?? null,
                    'brand_id' => $item['brand_id'] ?? null,
                    'expected_delivery_date' => $item['expected_delivery_date'] ?? null,
                    'status_id' => $item['status_id'] ?? null
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

                // Create or update the item
                RfqItem::updateOrCreate(
                    ['id' => $item['id'] ?? null],
                    $itemData
                );
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Items saved successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('RFQ Items Save Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to save items: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        $item = QueryBuilder::for(RfqItem::class)
            ->with(['unit', 'brand'])
            ->findOrFail($id);

        return response()->json([
            'data' => new RfqItemResource($item)
        ]);
    }

    public function update(Request $request)
    {
        try {
            DB::beginTransaction();

            $items = json_decode($request->items, true);
            
            if (!is_array($items)) {
                throw new \Exception('Invalid items data');
            }

            foreach ($items as $index => $itemData) {
                if (!isset($itemData['id'])) {
                    continue;
                }

                $item = RfqItem::findOrFail($itemData['id']);
                
                // Only update fields that are present in the request
                $updateData = array_filter($itemData, function($value) {
                    return $value !== null && $value !== '';
                });

                // Handle file attachment if present
                if (isset($request->file('attachments')[$index])) {
                    $file = $request->file('attachments')[$index];
                    $path = $file->store('rfq-attachments', 'public');
                    $updateData['attachment'] = $path;
                }

                // Remove id from update data
                unset($updateData['id']);
                
                if (!empty($updateData)) {
                    $item->update($updateData);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Items updated successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('RFQ Items Update Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update items: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(RfqItem $rfqItem): JsonResponse
    {
        try {
            $rfqItem->delete();

            return response()->json([
                'message' => 'RFQ item deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete RFQ item',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
