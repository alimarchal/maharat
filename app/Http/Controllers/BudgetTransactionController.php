<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBudgetTransactionRequest;
use App\Http\Requests\UpdateBudgetTransactionRequest;
use App\Models\BudgetTransaction;

class BudgetTransactionController extends Controller
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
    public function store(StoreBudgetTransactionRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(BudgetTransaction $budgetTransaction)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(BudgetTransaction $budgetTransaction)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBudgetTransactionRequest $request, BudgetTransaction $budgetTransaction)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BudgetTransaction $budgetTransaction)
    {
        //
    }
}
