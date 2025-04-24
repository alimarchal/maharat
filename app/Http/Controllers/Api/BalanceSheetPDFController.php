<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use PDF;
use App\Models\ChartOfAccount;

class BalanceSheetPDFController extends Controller
{
    /**
     * Generate a PDF of the balance sheet.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function generatePDF(Request $request)
    {
        // Validate the request
        $request->validate([
            'balanceSheetData' => 'required|array',
            'summary' => 'required|array',
            'year' => 'required|string',
        ]);

        // Extract data from request
        $data = [
            'balanceSheetData' => $request->balanceSheetData,
            'summary' => $request->summary,
            'year' => $request->year,
            'generated_at' => now()->format('Y-m-d H:i:s'),
        ];

        // Generate the PDF using Laravel-PDF (make sure you have this package installed)
        $pdf = PDF::loadView('pdfs.balance-sheet', $data);
        
        // Save PDF to storage
        $filename = 'balance_sheet_' . $request->year . '_' . time() . '.pdf';
        $path = 'balance_sheets/' . $filename;
        
        Storage::disk('public')->put($path, $pdf->output());
        
        // Return the URL to the generated PDF
        return response()->json([
            'success' => true,
            'pdf_url' => '/storage/' . $path,
            'filename' => $filename,
        ]);
    }

    /**
     * Save the PDF reference to the database.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function savePDF(Request $request)
    {
        // Validate the request
        $request->validate([
            'pdf_url' => 'required|string',
            'year' => 'required|string',
        ]);

        try {
            // Find or create a record to store the PDF URL
            // Note: This depends on your application structure - adjust accordingly
            $chartOfAccount = ChartOfAccount::firstOrCreate(
                ['account_name' => 'Balance Sheet ' . $request->year],
                [
                    'account_code_id' => null,
                    'description' => 'Balance Sheet for year ' . $request->year,
                    'is_active' => true,
                ]
            );
            
            // Save the PDF path
            $pdfPath = str_replace('/storage/', '', $request->pdf_url);
            $chartOfAccount->update(['balancesheet_pdf' => $pdfPath]);
            
            return response()->json([
                'success' => true,
                'message' => 'PDF successfully saved to the system',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save PDF: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get saved PDFs for a specific year.
     *
     * @param string $year
     * @return \Illuminate\Http\Response
     */
    public function getSavedPDFs($year)
    {
        try {
            $pdfs = ChartOfAccount::where('account_name', 'like', "Balance Sheet $year%")
                ->whereNotNull('balancesheet_pdf')
                ->get()
                ->map(function ($chartAccount) {
                    return [
                        'id' => $chartAccount->id,
                        'filename' => basename($chartAccount->balancesheet_pdf),
                        'path' => $chartAccount->balancesheet_pdf,
                        'created_at' => $chartAccount->updated_at->format('M d, Y H:i'),
                    ];
                });

            return response()->json([
                'success' => true,
                'pdfs' => $pdfs,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve saved PDFs: ' . $e->getMessage(),
            ], 500);
        }
    }
} 