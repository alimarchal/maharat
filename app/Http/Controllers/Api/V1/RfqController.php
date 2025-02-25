<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\V1\Rfq\StoreRfqRequest;
use App\Http\Requests\V1\Rfq\UpdateRfqRequest;
use App\Http\Resources\V1\RfqResource;
use App\Models\Rfq;
use App\QueryParameters\RfqParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use App\Models\Status;

class RfqController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $rfqs = QueryBuilder::for(Rfq::class)
            ->allowedFilters(RfqParameters::ALLOWED_FILTERS)
            ->allowedSorts(RfqParameters::ALLOWED_SORTS)
            ->allowedIncludes(RfqParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($rfqs->isEmpty()) {
            return response()->json([
                'message' => 'No RFQs found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return RfqResource::collection($rfqs);
    }

    private function getNewRFQNumber(){
        // Generate RFQ Number
        $currentYear = date('Y');
        $latestRfq = Rfq::where('rfq_number', 'like', "RFQ-$currentYear-%")
            ->latest()
            ->first();

        $lastNumber = $latestRfq ? intval(substr($latestRfq->rfq_number, -3)) : 0;
        $newNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);
        $rfqNumber = "RFQ-$currentYear-$newNumber";
        return $rfqNumber;
    }
    public function store(Request $request)
    {
        try {
            DB::beginTransaction();

            $rfq_number = $this->getNewRFQNumber();


            $request->merge(['rfq_number' => $rfq_number]);
            // Create RFQ with validated data, excluding items and categories
            $rfq = Rfq::create($request->all());

            // Attach categories if provided
            if ($request->has('category_ids')) {
                $rfq->categories()->attach($request->input('category_ids'));
            }

            // Create RFQ items with their respective categories
            if ($request->has('items')) {
                foreach ($request->input('items') as $item) {
                    $rfq->items()->create($item);
                }
            }

            // Create initial status log
            $rfq->statusLogs()->create([
                'status_id' => $rfq->status_id,
                'changed_by' => auth()->id(),
                'remarks' => 'RFQ Created'
            ]);

            DB::commit();

            // Return response with loaded relationships including categories
            return response()->json([
                'message' => 'RFQ created successfully',
                'data' => new RfqResource(
                    $rfq->load([
                        'requester',
                        'company',
                        'warehouse',
                        'status',
                        'requestType',
                        'paymentType',
                        'categories',
                        'items.category',
                        'items.unit',
                        'items.status'
                    ])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create RFQ',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
    public function show(string $id): JsonResponse
    {
        $rfq = QueryBuilder::for(Rfq::class)
            ->allowedIncludes(RfqParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new RfqResource($rfq)
        ], Response::HTTP_OK);
    }
    public function update(UpdateRfqRequest $request, Rfq $rfq): JsonResponse
    {
        try {
            DB::beginTransaction();

            $oldStatus = $rfq->status_id;

            // Update RFQ with validated data, excluding items and categories
            $rfq->update($request->safe()->except(['items', 'category_ids']));

            // Update categories if provided
            if ($request->has('category_ids')) {
                $rfq->categories()->sync($request->input('category_ids'));
            }

            // Update or create RFQ items
            if ($request->has('items')) {
                $existingItemIds = [];

                foreach ($request->input('items') as $item) {
                    if (isset($item['id'])) {
                        $rfqItem = $rfq->items()->findOrFail($item['id']);
                        $rfqItem->update($item);
                        $existingItemIds[] = $item['id'];
                    } else {
                        $newItem = $rfq->items()->create($item);
                        $existingItemIds[] = $newItem->id;
                    }
                }

                // Remove items that were not included in the update
                $rfq->items()->whereNotIn('id', $existingItemIds)->delete();
            }

            // Log status change if status was updated
            if ($oldStatus !== $rfq->status_id) {
                $rfq->statusLogs()->create([
                    'status_id' => $rfq->status_id,
                    'changed_by' => auth()->id(),
                    'remarks' => $request->input('remarks')
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'RFQ updated successfully',
                'data' => new RfqResource(
                    $rfq->load([
                        'requester',
                        'company',
                        'warehouse',
                        'status',
                        'requestType',
                        'paymentType',
                        'categories',
                        'items.category',
                        'items.unit',
                        'items.status'
                    ])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update RFQ',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
    public function destroy(Rfq $rfq): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Delete related items first
            $rfq->items()->delete();

            // Delete the RFQ
            $rfq->delete();

            DB::commit();

            return response()->json([
                'message' => 'RFQ deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete RFQ',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getFormData()
    {
        try {
            return response()->json([
                'organization_email' => auth()->user()->company->email ?? '',
                'city' => auth()->user()->company->city ?? '',
                'rfq_number' => $this->getNewRFQNumber(),
                'request_date' => now()->format('Y-m-d'),
                'expected_delivery_date' => now()->addDays(7)->format('Y-m-d'),
                'status_id' => Status::where('type', 'rfq_status')
                                    ->where('name', 'Draft')
                                    ->first()->id
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch form data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
