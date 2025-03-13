<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBudgetCategoryRequest;
use App\Http\Requests\UpdateBudgetCategoryRequest;
use App\Models\BudgetCategory;

class BudgetCategoryController extends Controller
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
    public function store(StoreBudgetCategoryRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(BudgetCategory $budgetCategory)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(BudgetCategory $budgetCategory)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBudgetCategoryRequest $request, BudgetCategory $budgetCategory)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BudgetCategory $budgetCategory)
    {
        //
    }
}
