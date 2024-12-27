<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBankConfigurationRequest;
use App\Http\Requests\UpdateBankConfigurationRequest;
use App\Models\BankConfiguration;

class BankConfigurationController extends Controller
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
    public function store(StoreBankConfigurationRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(BankConfiguration $bankConfiguration)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(BankConfiguration $bankConfiguration)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBankConfigurationRequest $request, BankConfiguration $bankConfiguration)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BankConfiguration $bankConfiguration)
    {
        //
    }
}
