<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\SupplierContact\StoreSupplierContactRequest;
use App\Http\Requests\V1\SupplierContact\UpdateSupplierContactRequest;
use App\Http\Resources\V1\SupplierContactResource;
use App\Models\SupplierContact;
use App\QueryParameters\SupplierContactParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\QueryBuilder;

class SupplierContactController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $contacts = QueryBuilder::for(SupplierContact::class)
            ->allowedFilters(SupplierContactParameters::ALLOWED_FILTERS)
            ->allowedSorts(SupplierContactParameters::ALLOWED_SORTS)
            ->allowedIncludes(SupplierContactParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($contacts->isEmpty()) {
            return response()->json([
                'message' => 'No supplier contacts found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return SupplierContactResource::collection($contacts);
    }

    public function store(StoreSupplierContactRequest $request): JsonResponse
    {
        try {
            $contact = SupplierContact::create($request->validated());

            return response()->json([
                'message' => 'Supplier contact created successfully',
                'data' => new SupplierContactResource($contact->load('supplier'))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create supplier contact',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $contact = QueryBuilder::for(SupplierContact::class)
            ->allowedIncludes(SupplierContactParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new SupplierContactResource($contact)
        ], Response::HTTP_OK);
    }

    public function update(UpdateSupplierContactRequest $request, SupplierContact $supplierContact): JsonResponse
    {
        try {
            $supplierContact->update($request->validated());

            return response()->json([
                'message' => 'Supplier contact updated successfully',
                'data' => new SupplierContactResource($supplierContact->load('supplier'))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update supplier contact',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(SupplierContact $supplierContact): JsonResponse
    {
        try {
            $supplierContact->delete();

            return response()->json([
                'message' => 'Supplier contact deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete supplier contact',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
