<?php

namespace App\Http\Controllers;

use App\Models\Quotation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Rfq;

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
        $validated = $request->validate([
            'organization_email' => 'required|email',
            'city' => 'required|string',
            'category_name' => 'required|string|exists:product_categories,name',
            'warehouse' => 'required|string|exists:warehouses,name',
            'issue_date' => 'required|date',
            'closing_date' => 'required|date|after:issue_date',
            'rfq_id' => 'required|string|unique:rfqs,rfq_id',
            'payment_type' => 'required|string|exists:statuses,name',
            'contact_no' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.item_name' => 'required|string',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.expected_delivery_date' => 'required|date|after_or_equal:issue_date',
            'items.*.attachment' => 'nullable|file|max:10240', // 10MB max
            'items.*.unit' => 'required|string|exists:units,name',
            'items.*.brand' => 'nullable|string|exists:brands,name',
        ]);

        $rfq = Rfq::create($validated);
        
        foreach ($validated['items'] as $index => $item) {
            $itemData = $item;
            
            // Handle file attachment
            if ($request->hasFile("items.{$index}.attachment")) {
                $file = $request->file("items.{$index}.attachment");
                $path = $file->store('rfq-attachments', 'public');
                $itemData['attachment'] = $path;
            }
            
            $rfq->items()->create($itemData);
        }

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
