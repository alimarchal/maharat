<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\ExternalInvoice\StoreExternalInvoiceRequest;
use App\Http\Requests\V1\ExternalInvoice\UpdateExternalInvoiceRequest;
use App\Http\Resources\V1\ExternalInvoiceResource;
use App\Models\ExternalInvoice;
use App\QueryParameters\ExternalInvoiceParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class ExternalInvoiceController extends Controller
{
    /**
     * Display a listing of the external invoices.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $invoices = QueryBuilder::for(ExternalInvoice::class)
            ->allowedFilters(ExternalInvoiceParameters::ALLOWED_FILTERS)
            ->allowedSorts(ExternalInvoiceParameters::ALLOWED_SORTS)
            ->allowedIncludes(ExternalInvoiceParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($invoices->isEmpty()) {
            return response()->json([
                'message' => 'No external invoices found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return ExternalInvoiceResource::collection($invoices);
    }

    /**
     * Store a newly created external invoice in storage.
     */
    public function store(StoreExternalInvoiceRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();
            
            // Set default values
            $data['invoice_id'] = $this->generateInvoiceId();
            $data['type'] = 'Cash';
            $data['vat_amount'] = $data['amount'] * 0.15;
            $data['status'] = 'Draft';

            // Create the invoice
            $invoice = ExternalInvoice::create($data);

            DB::commit();

            return response()->json([
                'message' => 'External invoice created successfully',
                'data' => new ExternalInvoiceResource(
                    $invoice->load(['user', 'supplier', 'purchaseOrder'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create external invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified external invoice.
     */
    public function show(string $id): JsonResponse
    {
        $invoice = QueryBuilder::for(ExternalInvoice::class)
            ->allowedIncludes(ExternalInvoiceParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new ExternalInvoiceResource($invoice)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified external invoice in storage.
     */
    public function update(UpdateExternalInvoiceRequest $request, ExternalInvoice $externalInvoice): JsonResponse
    {
        try {
            DB::beginTransaction();

            $externalInvoice->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'External invoice updated successfully',
                'data' => new ExternalInvoiceResource(
                    $externalInvoice->load(['user', 'supplier', 'purchaseOrder'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update external invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified external invoice from storage.
     */
    public function destroy(ExternalInvoice $externalInvoice): JsonResponse
    {
        try {
            DB::beginTransaction();

            $externalInvoice->delete();

            DB::commit();

            return response()->json([
                'message' => 'External invoice deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete external invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Restore a soft deleted external invoice.
     */
    public function restore(string $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $externalInvoice = ExternalInvoice::withTrashed()->findOrFail($id);
            $externalInvoice->restore();

            DB::commit();

            return response()->json([
                'message' => 'External invoice restored successfully',
                'data' => new ExternalInvoiceResource($externalInvoice)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to restore external invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    private function generateInvoiceId(): string
    {
        $prefix = 'EXT-INV-';
        $lastInvoice = ExternalInvoice::orderBy('id', 'desc')->first();
        
        if (!$lastInvoice) {
            return $prefix . '0001';
        }

        $lastNumber = 0;
        if (preg_match('/-(\d+)$/', $lastInvoice->invoice_id, $matches)) {
            $lastNumber = intval($matches[1]);
        }
        
        $nextNumber = $lastNumber + 1;
        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }
}
