<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\MaterialRequestTransaction\StoreMaterialRequestTransactionRequest;
use App\Http\Requests\V1\MaterialRequestTransaction\UpdateMaterialRequestTransactionRequest;
use App\Http\Resources\V1\MaterialRequestTransactionResource;
use App\Models\MaterialRequestTransaction;
use App\QueryParameters\MaterialRequestTransactionParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class MaterialRequestTransactionController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(MaterialRequestTransaction::class)
            ->allowedFilters(MaterialRequestTransactionParameters::ALLOWED_FILTERS)
            ->allowedSorts(MaterialRequestTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(MaterialRequestTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No material request transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return MaterialRequestTransactionResource::collection($transactions);
    }

    public function store(StoreMaterialRequestTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $transaction = MaterialRequestTransaction::create($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Material request transaction created successfully',
                'data' => new MaterialRequestTransactionResource(
                    $transaction->load(['materialRequest', 'requester', 'assignedUser', 'referredUser'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create material request transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $transaction = QueryBuilder::for(MaterialRequestTransaction::class)
            ->allowedIncludes(MaterialRequestTransactionParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new MaterialRequestTransactionResource($transaction)
        ], Response::HTTP_OK);
    }

    public function update(UpdateMaterialRequestTransactionRequest $request, MaterialRequestTransaction $materialRequestTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $materialRequestTransaction->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Material request transaction updated successfully',
                'data' => new MaterialRequestTransactionResource(
                    $materialRequestTransaction->load(['materialRequest', 'requester', 'assignedUser', 'referredUser'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update material request transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(MaterialRequestTransaction $materialRequestTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $materialRequestTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'Material request transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete material request transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
