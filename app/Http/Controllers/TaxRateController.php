<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaxRateRequest;
use App\Http\Requests\UpdateTaxRateRequest;
use App\Models\TaxRate;

class TaxRateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTaxRateRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(TaxRate $taxRate)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(TaxRate $taxRate)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTaxRateRequest $request, TaxRate $taxRate)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TaxRate $taxRate)
    {
        //
    }
}
