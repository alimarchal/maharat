<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Supplier\StoreSupplierRequest;
use App\Http\Requests\V1\Supplier\UpdateSupplierRequest;
use App\Http\Resources\V1\SupplierResource;
use App\Models\Supplier;
use App\QueryParameters\SupplierParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class SupplierController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $suppliers = QueryBuilder::for(Supplier::class)
            ->allowedFilters(SupplierParameters::ALLOWED_FILTERS)
            ->allowedSorts(SupplierParameters::ALLOWED_SORTS)
            ->allowedIncludes(SupplierParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($suppliers->isEmpty()) {
            return response()->json([
                'message' => 'No suppliers found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return SupplierResource::collection($suppliers);
    }

    public function store(StoreSupplierRequest $request)
    {
        return 'sss';
        try {
            DB::beginTransaction();




            $supplier = Supplier::create($request->safe()->except(['contacts', 'addresses']));

            // Create contacts if provided
            if ($request->has('contacts')) {
                foreach ($request->input('contacts') as $contact) {
                    $supplier->contacts()->create($contact);
                }
            }

            // Create addresses if provided
            if ($request->has('addresses')) {
                foreach ($request->input('addresses') as $address) {
                    $supplier->addresses()->create($address);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Supplier created successfully',
                'data' => new SupplierResource(
                    $supplier->load(['contacts', 'addresses', 'currency', 'status'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create supplier',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $supplier = QueryBuilder::for(Supplier::class)
            ->allowedIncludes(SupplierParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new SupplierResource($supplier)
        ], Response::HTTP_OK);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): JsonResponse
    {
        try {
            DB::beginTransaction();

            $supplier->update($request->safe()->except(['contacts', 'addresses']));

            // Update contacts if provided
            if ($request->has('contacts')) {
                $supplier->contacts()->delete();
                foreach ($request->input('contacts') as $contact) {
                    $supplier->contacts()->create($contact);
                }
            }

            // Update addresses if provided
            if ($request->has('addresses')) {
                $supplier->addresses()->delete();
                foreach ($request->input('addresses') as $address) {
                    $supplier->addresses()->create($address);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Supplier updated successfully',
                'data' => new SupplierResource(
                    $supplier->load(['contacts', 'addresses', 'currency', 'status'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update supplier',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Delete related contacts and addresses
            $supplier->contacts()->delete();
            $supplier->addresses()->delete();

            // Delete the supplier
            $supplier->delete();

            DB::commit();

            return response()->json([
                'message' => 'Supplier deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete supplier',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
