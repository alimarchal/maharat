<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Company\StoreCompanyRequest;
use App\Http\Requests\V1\Company\UpdateCompanyRequest;
use App\Http\Resources\V1\CompanyResource;
use App\Http\Resources\V1\CompanyCollection;
use App\Models\Company;
use App\QueryParameters\CompanyParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class CompanyController extends Controller
{
    /**
     * Display a listing of companies.
     */
    public function index(): JsonResponse|CompanyCollection
    {
        $companies = QueryBuilder::for(Company::class)
            ->allowedFilters(CompanyParameters::ALLOWED_FILTERS)
            ->allowedSorts(CompanyParameters::ALLOWED_SORTS)
            ->allowedIncludes(CompanyParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($companies->isEmpty()) {
            return response()->json([
                'message' => 'No companies found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new CompanyCollection($companies);
    }

    /**
     * Store a newly created company in storage.
     */
    public function store(StoreCompanyRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $company = Company::create($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Company created successfully',
                'data' => new CompanyResource($company)
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create company',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified company.
     */
    public function show(string $id): JsonResponse
    {
        $company = QueryBuilder::for(Company::class)
            ->allowedIncludes(CompanyParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new CompanyResource($company)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified company in storage.
     */
    public function update(UpdateCompanyRequest $request, Company $company): JsonResponse
    {
        try {
            DB::beginTransaction();

            $company->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Company updated successfully',
                'data' => new CompanyResource($company)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update company',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified company from storage.
     */
    public function destroy(Company $company): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Check for related records before deleting
            if ($company->users()->count() > 0 || $company->departments()->count() > 0 || $company->branches()->count() > 0) {
                return response()->json([
                    'message' => 'Cannot delete company with related records',
                ], Response::HTTP_CONFLICT);
            }

            $company->delete();

            DB::commit();

            return response()->json([
                'message' => 'Company deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete company',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
