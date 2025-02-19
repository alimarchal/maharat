<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\SupplierAddress\StoreSupplierAddressRequest;
use App\Http\Requests\V1\SupplierAddress\UpdateSupplierAddressRequest;
use App\Http\Resources\V1\SupplierAddressResource;
use App\Models\SupplierAddress;
use App\QueryParameters\SupplierAddressParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\QueryBuilder;

class SupplierAddressController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $addresses = QueryBuilder::for(SupplierAddress::class)
            ->allowedFilters(SupplierAddressParameters::ALLOWED_FILTERS)
            ->allowedSorts(SupplierAddressParameters::ALLOWED_SORTS)
            ->allowedIncludes(SupplierAddressParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($addresses->isEmpty()) {
            return response()->json([
                'message' => 'No supplier addresses found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return SupplierAddressResource::collection($addresses);
    }

    public function store(StoreSupplierAddressRequest $request): JsonResponse
    {
        try {
            $address = SupplierAddress::create($request->validated());

            return response()->json([
                'message' => 'Supplier address created successfully',
                'data' => new SupplierAddressResource($address->load('supplier'))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create supplier address',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $address = QueryBuilder::for(SupplierAddress::class)
            ->allowedIncludes(SupplierAddressParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new SupplierAddressResource($address)
        ], Response::HTTP_OK);
    }

    public function update(UpdateSupplierAddressRequest $request, SupplierAddress $supplierAddress): JsonResponse
    {
        try {
            $supplierAddress->update($request->validated());

            return response()->json([
                'message' => 'Supplier address updated successfully',
                'data' => new SupplierAddressResource($supplierAddress->load('supplier'))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update supplier address',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(SupplierAddress $supplierAddress): JsonResponse
    {
        try {
            $supplierAddress->delete();

            return response()->json([
                'message' => 'Supplier address deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete supplier address',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
