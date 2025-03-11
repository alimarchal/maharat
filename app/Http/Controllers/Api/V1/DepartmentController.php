<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Department\StoreDepartmentRequest;
use App\Http\Requests\V1\Department\UpdateDepartmentRequest;
use App\Http\Resources\V1\DepartmentResource;
use App\Http\Resources\V1\DepartmentCollection;
use App\Models\Department;
use App\QueryParameters\DepartmentParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\DB;

class DepartmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $departments = QueryBuilder::for(Department::class)
            ->allowedFilters(DepartmentParameters::ALLOWED_FILTERS)
            ->allowedSorts(DepartmentParameters::ALLOWED_SORTS)
            ->allowedIncludes(DepartmentParameters::ALLOWED_INCLUDES)
            ->with('users') // ✅ Load users
            ->paginate()
            ->appends(request()->query());

        if ($departments->isEmpty()) {
            return response()->json([
                'message' => 'No departments found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new DepartmentCollection($departments);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $department = Department::create($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Department created successfully',
                'data' => new DepartmentResource($department->load(['parent', 'company']))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create department',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $department = QueryBuilder::for(Department::class)
            ->allowedIncludes(DepartmentParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new DepartmentResource($department)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateDepartmentRequest $request, Department $department): JsonResponse
    {
        try {
            DB::beginTransaction();

            $department->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Department updated successfully',
                'data' => new DepartmentResource($department->load(['parent', 'company']))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update department',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Department $department): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Check if department has children
            if ($department->children()->exists()) {
                return response()->json([
                    'message' => 'Cannot delete department with child departments',
                    'error' => 'Department has children'
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $department->delete();

            DB::commit();

            return response()->json([
                'message' => 'Department deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete department',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get departments in tree structure
     */
    public function tree(): JsonResponse
    {
        $rootDepartments = Department::with(['descendants'])
            ->whereNull('parent_id')
            ->get();

        return response()->json([
            'data' => DepartmentResource::collection($rootDepartments)
        ], Response::HTTP_OK);
    }

    /**
     * Restore a soft-deleted department
     */
    public function restore(string $id): JsonResponse
    {
        try {
            $department = Department::withTrashed()->findOrFail($id);

            if (!$department->trashed()) {
                return response()->json([
                    'message' => 'Department is not deleted'
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $department->restore();

            return response()->json([
                'message' => 'Department restored successfully',
                'data' => new DepartmentResource($department)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to restore department',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
