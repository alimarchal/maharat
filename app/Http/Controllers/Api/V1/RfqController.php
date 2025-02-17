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

    public function store(StoreRfqRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Create RFQ
            $rfq = Rfq::create($request->safe()->except('items'));

            // Create RFQ items
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
            $rfq->update($request->validated());

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
}
