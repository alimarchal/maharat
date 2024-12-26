<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SystemAlertConfiguration\StoreSystemAlertConfigurationRequest;
use App\Http\Requests\SystemAlertConfiguration\UpdateSystemAlertConfigurationRequest;
use App\Models\SystemAlertConfiguration;

class SystemAlertConfigurationController extends Controller
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
    public function store(StoreSystemAlertConfigurationRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(SystemAlertConfiguration $systemAlertConfiguration)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(SystemAlertConfiguration $systemAlertConfiguration)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSystemAlertConfigurationRequest $request, SystemAlertConfiguration $systemAlertConfiguration)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SystemAlertConfiguration $systemAlertConfiguration)
    {
        //
    }
}
