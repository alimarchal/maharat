<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\PaymentOrderLog\StorePaymentOrderLogRequest;
use App\Http\Requests\V1\PaymentOrderLog\UpdatePaymentOrderLogRequest;
use App\Http\Resources\V1\PaymentOrderLogResource;
use App\Models\PaymentOrderLog;
use App\QueryParameters\PaymentOrderLogParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class PaymentOrderLogController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $logs = QueryBuilder::for(PaymentOrderLog::class)
            ->allowedFilters(PaymentOrderLogParameters::ALLOWED_FILTERS)
            ->allowedSorts(PaymentOrderLogParameters::ALLOWED_SORTS)
            ->allowedIncludes(PaymentOrderLogParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($logs->isEmpty()) {
            return response()->json([
                'message' => 'No payment order logs found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return PaymentOrderLogResource::collection($logs);
    }

    public function store(StorePaymentOrderLogRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $log = PaymentOrderLog::create($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Payment order log created successfully',
                'data' => new PaymentOrderLogResource($log->load('paymentOrder'))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create payment order log',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $log = QueryBuilder::for(PaymentOrderLog::class)
            ->allowedIncludes(PaymentOrderLogParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new PaymentOrderLogResource($log)
        ], Response::HTTP_OK);
    }

    public function update(UpdatePaymentOrderLogRequest $request, PaymentOrderLog $paymentOrderLog): JsonResponse
    {
        try {
            DB::beginTransaction();

            $paymentOrderLog->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Payment order log updated successfully',
                'data' => new PaymentOrderLogResource($paymentOrderLog->load('paymentOrder'))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update payment order log',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(PaymentOrderLog $paymentOrderLog): JsonResponse
    {
        try {
            DB::beginTransaction();

            $paymentOrderLog->delete();

            DB::commit();

            return response()->json([
                'message' => 'Payment order log deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete payment order log',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
