<?php

namespace App\Http\Controllers;

use App\Models\Quotation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class RFQController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Add dd() to debug
        dd('RFQ Index reached');
        
        return Inertia::render('Dashboard/Quotations/Quotation', [
            'quotations' => Quotation::all() // Make sure this variable is passed
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Add dd() to debug
        dd('RFQ Create reached');
        
        return Inertia::render('Dashboard/Quotations/AddQuotationForm');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Add validation rules here
        $validated = $request->validate([
            'organization_email' => 'required|email',
            'city' => 'required|string',
            'category_name' => 'required|string',
            'warehouse' => 'required|string',
            'issue_date' => 'required|date',
            'closing_date' => 'required|date|after:issue_date',
            'rfq_id' => 'required|string|unique:quotations,rfq_id',
            'payment_type' => 'required|string',
            'contact_no' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.item_name' => 'required|string',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:1',
        ]);

        $quotation = Quotation::create($validated);

        return redirect()->route('rfq.index')
            ->with('success', 'RFQ created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Quotation $quotation)
    {
        return Inertia::render('Quotations/ViewQuotation', [
            'quotation' => $quotation->load(['supplier', 'status', 'items'])
        ]);
    }

    public function generatePDF(Quotation $quotation)
    {
        $pdf = PDF::loadView('quotations.pdf', [
            'quotation' => $quotation->load(['supplier', 'status', 'items'])
        ]);

        return $pdf->download('RFQ-' . $quotation->quotation_number . '.pdf');
    }
}
