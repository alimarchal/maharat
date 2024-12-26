<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workflow\StoreWorkflowSetupRequest;
use App\Http\Requests\Workflow\UpdateWorkflowSetupRequest;
use App\Models\WorkflowSetup;

class WorkflowSetupController extends Controller
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
    public function store(StoreWorkflowSetupRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(WorkflowSetup $workflowSetup)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(WorkflowSetup $workflowSetup)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateWorkflowSetupRequest $request, WorkflowSetup $workflowSetup)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(WorkflowSetup $workflowSetup)
    {
        //
    }
}
