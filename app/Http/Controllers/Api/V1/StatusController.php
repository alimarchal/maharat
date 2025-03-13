<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreStatusRequest;
use App\Http\Requests\V1\UpdateStatusRequest;
use App\Http\Resources\V1\StatusResource;
use App\Models\Status;
use App\QueryParameters\StatusParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Inertia\Inertia;

class StatusController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $statuses = QueryBuilder::for(Status::class)
            ->allowedFilters(['created_at',AllowedFilter::exact('type')])
            ->allowedSorts(StatusParameters::ALLOWED_SORTS)
            ->paginate()
            ->appends(request()->query());

        if ($statuses->isEmpty()) {
            return response()->json([
                'message' => 'No statuses found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return StatusResource::collection($statuses);
    }

    public function authorize(): bool
    {
        return true;  // Make sure the user has permission
    }

    public function rules(): array
    {
        return [
            'type' => 'required|string|max:255',
            'name' => 'required|string|max:255',
        ];
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreStatusRequest $request): JsonResponse
    {
        try {
            // Log incoming request
            \Log::info('Incoming status creation request', [
                'data' => $request->all()
            ]);

            // Validate the request
            $validatedData = $request->validated();

            // Create the status
            $status = Status::create([
                'type' => $validatedData['type'],
                'name' => $validatedData['name']
            ]);

            // Log success
            \Log::info('Status created successfully', [
                'status_id' => $status->id,
                'data' => $status->toArray()
            ]);

            // Return success response
            return response()->json([
                'success' => true,
                'message' => 'Status created successfully',
                'data' => $status
            ], 201);

        } catch (\Exception $e) {
            // Log the error
            \Log::error('Failed to create status', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Return error response
            return response()->json([
                'success' => false,
                'message' => 'Failed to create status',
                'error' => $e->getMessage()
            ], 500);
        }
    }



    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $status = QueryBuilder::for(Status::class)
            ->allowedIncludes(StatusParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new StatusResource($status)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateStatusRequest $request, Status $status): JsonResponse
    {
        try {
            $status->update($request->validated());

            return response()->json([
                'message' => 'Status updated successfully',
                'data' => new StatusResource($status)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update status',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Status $status): JsonResponse
    {
        try {
            $status->delete();

            return response()->json([
                'message' => 'Status deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete status',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getPaymentTypes()
    {
        try {
            $paymentTypes = Status::where('type', 'payment_type')
                ->select('id', 'name')
                ->get();

            return response()->json([
                'data' => $paymentTypes,
                'message' => 'Payment types retrieved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching payment types: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch payment types',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
