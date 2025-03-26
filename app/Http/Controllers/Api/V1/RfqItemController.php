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
        $rfqId = $request->query('rfq_id'); // Get rfq_id from request

        $query = QueryBuilder::for(RfqItem::class)
            ->with(['unit', 'brand']);

        // Apply filtering if rfq_id is provided
        if ($rfqId) {
            $query->where('rfq_id', $rfqId);
        }

        $items = $query->get(); // Or use paginate(10) for better performance

        return response()->json([
            'data' => RfqItemResource::collection($items)
        ]);
    }

    public function store(Request $request)
    {
        try {
            DB::beginTransaction();

            $items = json_decode($request->input('items'), true);

            if (!is_array($items)) {
                throw new \Exception('Invalid items data');
            }

            foreach ($items as $index => $item) {
                if (empty($item['rfq_id'])) {
                    throw new \Exception('RFQ ID is required for items');
                }

                $itemData = [
                    'rfq_id' => $item['rfq_id'],
                    'product_id' => $item['product_id'] ?? null,
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
                    $itemData['original_filename'] = $file->getClientOriginalName();
                }

                if (isset($item['id'])) {
                    // Update existing item
                    RfqItem::where('id', $item['id'])->update($itemData);
                } else {
                    // Create new item
                    RfqItem::create($itemData);
                }
            }

            // Delete items that were removed from the form
            if (!empty($items)) {
                $currentItemIds = array_filter(array_column($items, 'id')); // Get all valid IDs
                if (!empty($currentItemIds)) {
                    RfqItem::where('rfq_id', $items[0]['rfq_id'])
                        ->whereNotIn('id', $currentItemIds)
                        ->delete();
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Items saved successfully']);

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

                $updateData = array_filter($itemData, function($value) {
                    return $value !== null && $value !== '';
                });

                // Handle file attachment if present
                if (isset($request->file('attachments')[$index])) {
                    $file = $request->file('attachments')[$index];
                    $originalFilename = $file->getClientOriginalName();
                    $storagePath = $file->store('rfq-attachments', 'public');
                    $updateData['attachment'] = $storagePath;
                    $updateData['original_filename'] = $originalFilename;
                }

                // Remove id from update data
                unset($updateData['id']);

                if (!empty($updateData)) {
                    $item->update($updateData);
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Items updated successfully']);

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
