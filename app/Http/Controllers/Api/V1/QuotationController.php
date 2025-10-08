<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Quotation\StoreQuotationRequest;
use App\Http\Requests\V1\Quotation\UpdateQuotationRequest;
use App\Http\Resources\V1\QuotationResource;
use App\Models\Quotation;
use App\Models\QuotationDocument;
use App\Models\QuotationItem;
use App\Models\RfqItem;
use App\Models\Supplier;
use App\QueryParameters\QuotationParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class QuotationController extends Controller
{
    private function generateQuotationNumber(): string
    {
        $year = date('Y');
        $lastQuotation = Quotation::withTrashed()
            ->whereYear('created_at', $year)
            ->orderBy('quotation_number', 'desc')
            ->first();

        $newNumber = 1;
        
        if ($lastQuotation && preg_match('/QUO-\d{4}-(\d+)/', $lastQuotation->quotation_number, $matches)) {
            $newNumber = (int)$matches[1] + 1;
        }
        
        return sprintf("QUO-%s-%04d", $year, $newNumber);
    }
    
    public function getNextQuotationNumber(): JsonResponse
    {
        try {
            $nextNumber = $this->generateQuotationNumber();
            \Log::info('Generated next quotation number: ' . $nextNumber);
            return response()->json([
                'success' => true,
                'next_number' => $nextNumber
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to generate next quotation number: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate next quotation number: ' . $e->getMessage()
            ], 500);
        }
    }

    public function index(): JsonResponse|ResourceCollection
    {
        // Get query parameters
        $rfqId = request()->get('rfq_id');
        $perPage = request()->get('per_page', 15); // Default to 15 records per page
        $includeTrashed = request()->get('include_trashed', false); // Only include trashed if specifically requested
        
        $query = Quotation::with(['rfq.company', 'documents', 'status', 'supplier']);
        
        // Only include trashed records if specifically requested
        if ($includeTrashed) {
            $query->withTrashed();
        }
        
        // Filter by RFQ ID if provided
        if ($rfqId) {
            $query->where('rfq_id', $rfqId);
        }
        
        // Get the results with pagination
        $quotations = $query->orderBy('created_at', 'desc')->paginate($perPage);
        
        // Return paginated response
        return QuotationResource::collection($quotations);
    }

    public function store(Request $request)
    {
        // Handle quotation_items validation - can be array or JSON string
        $quotationItems = $request->input('quotation_items');
        if (is_string($quotationItems)) {
            $quotationItems = json_decode($quotationItems, true);
        }
        
        // Validate quotation_items if provided
        if ($quotationItems && is_array($quotationItems)) {
            foreach ($quotationItems as $index => $item) {
                if (!isset($item['rfq_item_id']) || !isset($item['unit_price'])) {
                    return response()->json([
                        'success' => false,
                        'message' => "Quotation item at index {$index} is missing required fields"
                    ], 422);
                }
                
                if (!is_numeric($item['unit_price']) || $item['unit_price'] < 0) {
                    return response()->json([
                        'success' => false,
                        'message' => "Unit price for item at index {$index} must be a valid positive number"
                    ], 422);
                }
            }
        }

        // Validate basic quotation fields
        $request->validate([
            'quotation_number' => 'nullable|string|max:255',
            'rfq_id' => 'required|exists:rfqs,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'issue_date' => 'nullable|date',
            'valid_until' => 'nullable|date',
            'total_amount' => 'nullable|numeric',
            'vat_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string'
        ]);

        try {
            DB::beginTransaction();

            // Generate quotation number if not provided
            if (empty($request->quotation_number)) {
                $quotationNumber = $this->generateQuotationNumber();
            } else {
                $quotationNumber = $request->quotation_number;
            }
            
            // Get the "Active" status for quotations
            $activeStatus = \App\Models\Status::where('type', 'Quotation Status')
                ->where('name', 'Active')
                ->first();

            if (!$activeStatus) {
                throw new \Exception('Active status for quotations not found');
            }
            
            // Calculate total amount from quotation items if provided
            $totalAmount = $request->total_amount;
            if ($quotationItems && is_array($quotationItems)) {
                $totalAmount = $this->calculateTotalAmount($quotationItems);
            }
            
            // Calculate VAT amount (15% of total amount)
            $vatAmount = $totalAmount ? ($totalAmount * 0.15) : 0;
            
            // Create the quotation record
            $quotation = Quotation::create([
                'quotation_number' => $quotationNumber,
                'rfq_id' => $request->rfq_id,
                'supplier_id' => $request->supplier_id,
                'issue_date' => $request->issue_date,
                'valid_until' => $request->valid_until,
                'total_amount' => $totalAmount,
                'vat_amount' => $vatAmount,
                'notes' => $request->notes,
                'status_id' => $activeStatus->id // Set the default status as Active
            ]);
            
            // Create quotation items if provided
            if ($quotationItems && is_array($quotationItems)) {
                $this->createQuotationItems($quotation->id, $quotationItems);
            }
            
            // If RFQ company ID is provided, update the RFQ record
            if ($request->has('update_rfq') && $request->input('update_rfq') && $request->has('rfq_company_id')) {
                DB::table('rfqs')->where('id', $request->rfq_id)->update([
                    'company_id' => $request->input('rfq_company_id')
                ]);
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Quotation created successfully',
                'data' => new QuotationResource($quotation->load(['rfq', 'supplier', 'documents', 'quotationItems.rfqItem']))
            ], Response::HTTP_CREATED);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create quotation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create quotation: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $quotation = Quotation::with(['rfq', 'supplier', 'status', 'documents', 'quotationItems.rfqItem.unit', 'quotationItems.rfqItem.product'])
            ->findOrFail($id);

        return response()->json(['data' => new QuotationResource($quotation)], Response::HTTP_OK);
    }

    public function update(Request $request, $id)
    {
        $quotation = Quotation::findOrFail($id);

        try {
            DB::beginTransaction();

            // Handle quotation_items if provided
            $quotationItems = $request->input('quotation_items');
            if (is_string($quotationItems)) {
                $quotationItems = json_decode($quotationItems, true);
            }

            // Calculate total amount from quotation items if provided
            $totalAmount = $request->total_amount;
            if ($quotationItems && is_array($quotationItems)) {
                $totalAmount = $this->calculateTotalAmount($quotationItems);
            }

            // Calculate VAT amount (15% of total amount)
            $vatAmount = $totalAmount ? ($totalAmount * 0.15) : 0;

            // Update the quotation with calculated amounts
            $quotation->update(array_merge(
                $request->except(['company_name', 'supplier_name', 'original_name', 'file_path', 'update_rfq', 'rfq_company_id', 'quotation_items']),
                [
                    'total_amount' => $totalAmount,
                    'vat_amount' => $vatAmount
                ]
            ));

            // Update quotation items if provided
            if ($quotationItems && is_array($quotationItems)) {
                // Delete existing quotation items
                $quotation->quotationItems()->delete();
                
                // Create new quotation items
                $this->createQuotationItems($quotation->id, $quotationItems);
            }

            // Check if the request contains organization_name and update the related RFQ
            if ($request->has('update_rfq') && $request->input('update_rfq') && $request->has('rfq_company_id')) {
                $rfqId = $quotation->rfq_id;
                DB::table('rfqs')->where('id', $rfqId)->update([
                    'company_id' => $request->input('rfq_company_id')
                ]);
            }

            // Check if the request contains original_name or file_path and update related documents
            if ($request->has('original_name') || $request->has('file_path')) {
                $quotation->documents()->update([
                    'original_name' => $request->input('original_name', 'N/A'),
                    'file_path' => $request->input('file_path', 'N/A'),
                ]);
            }

            DB::commit();
            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update quotation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update quotation: ' . $e->getMessage()
            ], 500);
        }
    }

    public function uploadTerms(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:pdf|max:10240',
            'quotation_id' => 'required|exists:quotations,id',
        ]);

        $quotation = Quotation::findOrFail($request->quotation_id);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('public/documents', $fileName); 

            // Save file path to database
            $quotation->terms_and_conditions = $filePath;
            $quotation->save();

            return response()->json([
                'success' => true,
                'file_path' => asset('storage/documents/' . $fileName), 
            ]);
        }

        return response()->json(['success' => false, 'message' => 'File upload failed.']);
    }

    public function destroy($id)
    {
        try {
            $quotation = Quotation::withTrashed()->findOrFail($id);
            
            // Delete associated documents
            foreach ($quotation->documents as $document) {
                if (Storage::exists('public/' . $document->file_path)) {
                    Storage::delete('public/' . $document->file_path);
                }
                $document->delete();
            }
            
            // Soft delete the quotation (mark as deleted but keep in database)
            $quotation->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Quotation deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error deleting quotation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting quotation: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getByRfqId($rfqId)
    {
        try {
            \Log::info('Fetching quotations for RFQ ID: ' . $rfqId);

            $quotations = Quotation::with([
                'rfq' => function ($query) {
                    $query->select('id', 'rfq_number', 'company_id');
                },
                'supplier' => function ($query) {
                    $query->select('id', 'name', 'contact_person', 'email');
                },
                'documents' => function ($query) {
                    $query->select('id', 'quotation_id', 'original_name', 'file_path');
                }
            ])
            ->where('rfq_id', $rfqId)
            ->paginate(10);

            \Log::info('Quotations found: ' . $quotations->count());

            return response()->json($quotations);
        } catch (\Exception $e) {
            \Log::error('Error fetching quotations: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to load quotations',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get RFQ items for quotation creation
     */
    public function getRfqItems($rfqId)
    {
        try {
            $rfqItems = RfqItem::with(['unit', 'product', 'category'])
                ->where('rfq_id', $rfqId)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $rfqItems->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'item_name' => $item->item_name,
                        'description' => $item->description,
                        'quantity' => $item->quantity,
                        'unit' => $item->unit ? $item->unit->name : null,
                        'product' => $item->product ? $item->product->name : null,
                        'category' => $item->category ? $item->category->name : null,
                        'brand' => $item->brand,
                        'model' => $item->model,
                        'specifications' => $item->specifications
                    ];
                })
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching RFQ items: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch RFQ items: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate total amount from quotation items
     */
    private function calculateTotalAmount(array $quotationItems): float
    {
        $totalAmount = 0;
        
        foreach ($quotationItems as $item) {
            $rfqItem = RfqItem::find($item['rfq_item_id']);
            if ($rfqItem) {
                $unitPrice = floatval($item['unit_price']);
                $quantity = floatval($rfqItem->quantity);
                $itemTotal = $unitPrice * $quantity;
                $totalAmount += $itemTotal;
            }
        }
        
        return $totalAmount;
    }

    /**
     * Create quotation items
     */
    private function createQuotationItems(int $quotationId, array $quotationItems): void
    {
        foreach ($quotationItems as $item) {
            $rfqItem = RfqItem::find($item['rfq_item_id']);
            if ($rfqItem) {
                $unitPrice = floatval($item['unit_price']);
                $quantity = floatval($rfqItem->quantity);
                $totalPrice = $unitPrice * $quantity;
                $vatAmount = $totalPrice * 0.15; // 15% VAT
                
                QuotationItem::create([
                    'quotation_id' => $quotationId,
                    'rfq_item_id' => $item['rfq_item_id'],
                    'unit_price' => $unitPrice,
                    'total_price' => $totalPrice,
                    'vat_amount' => $vatAmount,
                    'notes' => $item['notes'] ?? null
                ]);
            }
        }
    }
}