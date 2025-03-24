<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\MahratInvoiceApprovalTransaction\StoreMahratInvoiceApprovalTransactionRequest;
use App\Http\Requests\V1\MahratInvoiceApprovalTransaction\UpdateMahratInvoiceApprovalTransactionRequest;
use App\Http\Resources\V1\MahratInvoiceApprovalTransactionResource;
use App\Models\MahratInvoiceApprovalTransaction;
use App\QueryParameters\MahratInvoiceApprovalTransactionParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class MahratInvoiceApprovalTransactionController extends Controller
{
    /**
     * Display a listing of the mahrat invoice approval transactions.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(MahratInvoiceApprovalTransaction::class)
            ->allowedFilters(MahratInvoiceApprovalTransactionParameters::getAllowedFilters())
            ->allowedSorts(MahratInvoiceApprovalTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(MahratInvoiceApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No mahrat invoice approval transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return MahratInvoiceApprovalTransactionResource::collection($transactions);
    }


    /**
     * Store a newly created mahrat invoice approval transaction.
     */
    public function store(StoreMahratInvoiceApprovalTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Automatically add current user as creator and updater
            $data['created_by'] = auth()->id();
            $data['updated_by'] = auth()->id();

            $transaction = MahratInvoiceApprovalTransaction::create($data);

            DB::commit();

            return response()->json([
                'message' => 'Mahrat invoice approval transaction created successfully',
                'data' => new MahratInvoiceApprovalTransactionResource(
                    $transaction->load([
                        'invoice',
                        'requester',
                        'assignedUser',
                        'referredUser',
                        'createdByUser',
                        'updatedByUser'
                    ])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create mahrat invoice approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified mahrat invoice approval transaction.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $transaction = QueryBuilder::for(MahratInvoiceApprovalTransaction::class)
                ->allowedIncludes(MahratInvoiceApprovalTransactionParameters::ALLOWED_INCLUDES)
                ->with(['invoice']) // Ensure the invoice relationship is always loaded
                ->findOrFail($id);

            return response()->json([
                'data' => new MahratInvoiceApprovalTransactionResource($transaction)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch invoice details',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }


    /**
     * Update the specified mahrat invoice approval transaction.
     */
    public function update(UpdateMahratInvoiceApprovalTransactionRequest $request, MahratInvoiceApprovalTransaction $mahratInvoiceApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Automatically add current user as updater
            $data['updated_by'] = auth()->id();

            $mahratInvoiceApprovalTransaction->update($data);

            DB::commit();

            return response()->json([
                'message' => 'Mahrat invoice approval transaction updated successfully',
                'data' => new MahratInvoiceApprovalTransactionResource(
                    $mahratInvoiceApprovalTransaction->load([
                        'invoice',
                        'requester',
                        'assignedUser',
                        'referredUser',
                        'createdByUser',
                        'updatedByUser'
                    ])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update mahrat invoice approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified mahrat invoice approval transaction.
     */
    public function destroy(MahratInvoiceApprovalTransaction $mahratInvoiceApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $mahratInvoiceApprovalTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'Mahrat invoice approval transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete mahrat invoice approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
