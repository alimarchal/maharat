<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\TransactionFlowResource;
use App\Http\Resources\V1\TransactionFlowCollection;
use App\Models\TransactionFlow;
use App\Services\TransactionFlowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class TransactionFlowController extends Controller
{
    /**
     * Get transaction flows for a specific account.
     */
    public function getAccountFlows(int $accountId, Request $request): JsonResponse
    {
        try {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            $flows = TransactionFlowService::getAccountTransactionFlows($accountId, $startDate, $endDate);

            return response()->json([
                'data' => TransactionFlowResource::collection($flows)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            Log::error('Failed to get account transaction flows', [
                'account_id' => $accountId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to get transaction flows',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Record cash transaction flows.
     */
    public function recordCashFlows(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'cash_amount' => 'required|numeric|min:0',
                'description' => 'nullable|string',
                'invoice_number' => 'nullable|string',
                'attachment' => 'nullable|string',
                'original_name' => 'nullable|string'
            ]);

            $flows = TransactionFlowService::recordCashTransactionFlows(
                $request->input('cash_amount'),
                $request->input('description'),
                $request->input('invoice_number'),
                $request->input('attachment'),
                $request->input('original_name')
            );

            Log::info('Cash transaction flows recorded successfully', [
                'cash_amount' => $request->input('cash_amount'),
                'invoice_number' => $request->input('invoice_number'),
                'flows_count' => count($flows)
            ]);

            return response()->json([
                'message' => 'Transaction flows recorded successfully',
                'data' => TransactionFlowResource::collection($flows)
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            Log::error('Failed to record cash transaction flows', [
                'request_data' => $request->all(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to record transaction flows',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get all transaction flows with filtering.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = TransactionFlow::with(['account', 'creator'])
                ->orderBy('transaction_date', 'desc')
                ->orderBy('created_at', 'desc');

            // Apply filters
            if ($request->has('account_id')) {
                $query->where('account_id', $request->input('account_id'));
            }

            if ($request->has('transaction_type')) {
                $query->where('transaction_type', $request->input('transaction_type'));
            }

            if ($request->has('start_date') && $request->has('end_date')) {
                $query->dateRange($request->input('start_date'), $request->input('end_date'));
            }

            if ($request->has('related_entity_type')) {
                $query->where('related_entity_type', $request->input('related_entity_type'));
            }

            $flows = $query->paginate($request->input('per_page', 15));

            return response()->json(new TransactionFlowCollection($flows), Response::HTTP_OK);
        } catch (\Exception $e) {
            Log::error('Failed to get transaction flows', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to get transaction flows',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
