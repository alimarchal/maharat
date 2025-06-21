<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\FiscalYear;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class FiscalYearController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $currentYear = date('Y');
        
        $fiscalYears = FiscalYear::where('fiscal_year', '>=', $currentYear)
            ->orderBy('fiscal_year', 'desc')
            ->get();

        return response()->json([
            'data' => $fiscalYears,
            'message' => 'Fiscal years retrieved successfully'
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'fiscal_year' => 'required|integer|min:1900|max:2100|unique:fiscal_years,fiscal_year',
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $fiscalYear = $request->fiscal_year;
        $startDate = $fiscalYear . '-01-01';
        $endDate = $fiscalYear . '-12-31';

        $fiscalYearModel = FiscalYear::create([
            'fiscal_year' => $fiscalYear,
            'name' => $request->name,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);

        return response()->json([
            'data' => $fiscalYearModel,
            'message' => 'Fiscal year created successfully'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(FiscalYear $fiscalYear): JsonResponse
    {
        return response()->json([
            'data' => $fiscalYear,
            'message' => 'Fiscal year retrieved successfully'
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, FiscalYear $fiscalYear): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'fiscal_year' => 'required|integer|min:1900|max:2100|unique:fiscal_years,fiscal_year,' . $fiscalYear->id,
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $newFiscalYear = $request->fiscal_year;
        $startDate = $newFiscalYear . '-01-01';
        $endDate = $newFiscalYear . '-12-31';

        $fiscalYear->update([
            'fiscal_year' => $newFiscalYear,
            'name' => $request->name,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);

        return response()->json([
            'data' => $fiscalYear,
            'message' => 'Fiscal year updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(FiscalYear $fiscalYear): JsonResponse
    {
        $fiscalYear->delete();

        return response()->json([
            'message' => 'Fiscal year deleted successfully'
        ]);
    }
}
