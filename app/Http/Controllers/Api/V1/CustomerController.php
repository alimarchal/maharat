<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Customer\StoreCustomerRequest;
use App\Http\Requests\V1\Customer\UpdateCustomerRequest;
use App\Http\Resources\V1\CustomerResource;
use App\Models\Customer;
use App\QueryParameters\CustomerParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class CustomerController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $customers = QueryBuilder::for(Customer::class)
            ->allowedFilters(CustomerParameters::ALLOWED_FILTERS)
            ->allowedSorts(CustomerParameters::ALLOWED_SORTS)
            ->allowedIncludes(CustomerParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($customers->isEmpty()) {
            return response()->json([
                'message' => 'No customers found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return CustomerResource::collection($customers);
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $customer = Customer::create($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Customer created successfully',
                'data' => new CustomerResource($customer)
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create customer',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $customer = QueryBuilder::for(Customer::class)
            ->allowedIncludes(CustomerParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new CustomerResource($customer)
        ], Response::HTTP_OK);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        try {
            DB::beginTransaction();

            $customer->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Customer updated successfully',
                'data' => new CustomerResource($customer)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update customer',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(Customer $customer): JsonResponse
    {
        try {
            DB::beginTransaction();

            $customer->delete();

            DB::commit();

            return response()->json([
                'message' => 'Customer deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete customer',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function restore(string $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $customer = Customer::withTrashed()->findOrFail($id);
            $customer->restore();

            DB::commit();

            return response()->json([
                'message' => 'Customer restored successfully',
                'data' => new CustomerResource($customer)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to restore customer',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
