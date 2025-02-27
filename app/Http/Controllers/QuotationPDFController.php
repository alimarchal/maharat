<?php

namespace App\Http\Controllers;

use App\Models\Quotation;
use Inertia\Inertia;
use Illuminate\Http\Request;

class QuotationPDFController extends Controller
{
    public function show(Quotation $quotation)
    {
        return Inertia::render('Dashboard/Quotations/QuotationPDF', [
            'quotation' => $quotation->load(['supplier', 'status', 'items', 'rfq'])
        ]);
    }

    public function download(Quotation $quotation)
    {
        $pdf = \PDF::loadView('pdf.quotation', [
            'quotation' => $quotation->load(['supplier', 'status', 'items', 'rfq'])
        ]);

        return $pdf->download("quotation-{$quotation->quotation_number}.pdf");
    }
} 