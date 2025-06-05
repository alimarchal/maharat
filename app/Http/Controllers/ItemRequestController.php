<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RequestItem;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Http\JsonResponse;


class ItemRequestController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $itemRequests = ItemRequest::latest()->paginate(10);
        return view('request-item.index', compact('itemRequests'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('request-item.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return view('request-item.show', compact('itemRequests'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
