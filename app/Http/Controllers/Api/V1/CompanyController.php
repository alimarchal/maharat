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
use Illuminate\Support\Facades\Storage;
use Spatie\QueryBuilder\QueryBuilder;

class CompanyController extends Controller
{
    /**
     * Display a listing of companies.
     */
    public function index(): JsonResponse
    {
        try {
            $companies = Company::all();
            
            return response()->json([
                'success' => true,
                'data' => CompanyResource::collection($companies)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch companies',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Store a newly created company in storage.
     */
    public function store(StoreCompanyRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Handle logo upload
            if ($request->hasFile('logo')) {
                $logoPath = $request->file('logo')->store('companies/logos', 'public');
                $data['logo_path'] = $logoPath;
            }

            // Handle stamp upload
            if ($request->hasFile('stamp')) {
                $stampPath = $request->file('stamp')->store('companies/stamps', 'public');
                $data['stamp_path'] = $stampPath;
            }

            $company = Company::create($data);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Company created successfully',
                'data' => new CompanyResource($company)
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
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
            ->allowedIncludes([...CompanyParameters::ALLOWED_INCLUDES, 'currency'])
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
            \Log::info('Starting company update process');
            \Log::info('Company ID:', ['id' => $company->id]);
            \Log::info('Current company data:', $company->toArray());

            DB::beginTransaction();
            \Log::info('Database transaction started');

            // Get all validated data
            $data = $request->validated();
            \Log::info('Validated request data:', $data);
            
            // Log all request data (including files)
            \Log::info('Full request data:', [
                'has_logo' => $request->hasFile('logo'),
                'has_stamp' => $request->hasFile('stamp'),
                'all_data' => $request->all()
            ]);

            // Handle logo upload
            if ($request->hasFile('logo')) {
                \Log::info('Processing logo upload');
                // Delete old logo if exists
                if ($company->logo_path && Storage::disk('public')->exists($company->logo_path)) {
                    Storage::disk('public')->delete($company->logo_path);
                    \Log::info('Old logo deleted');
                }

                // Store the file and get the relative path
                $logoPath = $request->file('logo')->store('companies/logos', 'public');
                // Clean the path to remove any full URL
                $logoPath = str_replace('public/', '', $logoPath);
                $data['logo_path'] = $logoPath;
                \Log::info('New logo uploaded:', ['path' => $logoPath]);
            }

            // Handle stamp upload
            if ($request->hasFile('stamp')) {
                \Log::info('Processing stamp upload');
                // Delete old stamp if exists
                if ($company->stamp_path && Storage::disk('public')->exists($company->stamp_path)) {
                    Storage::disk('public')->delete($company->stamp_path);
                    \Log::info('Old stamp deleted');
                }

                // Store the file and get the relative path
                $stampPath = $request->file('stamp')->store('companies/stamps', 'public');
                // Clean the path to remove any full URL
                $stampPath = str_replace('public/', '', $stampPath);
                $data['stamp_path'] = $stampPath;
                \Log::info('New stamp uploaded:', ['path' => $stampPath]);
            }

            \Log::info('Final data to be updated:', $data);

            // Update the company using mass assignment
            $company->fill($data);
            $saved = $company->save();
            
            \Log::info('Save result:', [
                'saved' => $saved,
                'company_after_save' => $company->fresh()->toArray()
            ]);

            if (!$saved) {
                \Log::error('Failed to save company changes');
                throw new \Exception('Failed to update company data');
            }

            DB::commit();
            \Log::info('Database transaction committed successfully');

            // Return the updated company data
            return response()->json([
                'success' => true,
                'message' => 'Company updated successfully',
                'data' => new CompanyResource($company->fresh())
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('Error updating company:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ]);

            return response()->json([
                'success' => false,
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

    public function getPrimaryCompany(): JsonResponse
    {
        try {
            $company = Company::find(1);
            
            // If no company exists, return default values
            if (!$company) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'name' => 'MAHARAT',
                        'address' => 'Riyadh, Saudi Arabia',
                        'contact_number' => '+966 123 456 789',
                        'vat_no' => '123456789',
                        'cr_no' => '0345'
                    ]
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => new CompanyResource($company)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch company details',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
