<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AccountCode;
use App\Http\Resources\V1\AccountCodeResource;
use Illuminate\Http\Request;

class AccountCodeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $accountCodes = AccountCode::where('is_active', true)->get();
        return AccountCodeResource::collection($accountCodes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_code' => 'required|string|unique:account_codes',
            'account_type' => 'required|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $accountCode = AccountCode::create($validated);
        return new AccountCodeResource($accountCode);
    }

    /**
     * Display the specified resource.
     */
    public function show(AccountCode $accountCode)
    {
        return new AccountCodeResource($accountCode);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, AccountCode $accountCode)
    {
        $validated = $request->validate([
            'account_code' => 'required|string|unique:account_codes,account_code,' . $accountCode->id,
            'account_type' => 'required|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $accountCode->update($validated);
        return new AccountCodeResource($accountCode);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AccountCode $accountCode)
    {
        $accountCode->delete();
        return response()->json(['message' => 'Account code deleted successfully']);
    }
} 