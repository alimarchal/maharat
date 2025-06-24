<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\RfqRequest;
use App\Http\Resources\V1\RfqRequestResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class RfqRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $status = $request->get('status');

        $query = RfqRequest::with(['user', 'category', 'unit', 'warehouse', 'department', 'costCenter', 'subCostCenter']);

        if ($status) {
            $query->where('status', $status);
        }

        $rfqRequests = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => RfqRequestResource::collection($rfqRequests),
            'count' => $rfqRequests->count()
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'quantity' => 'required|numeric|min:1',
            'category_id' => 'nullable|exists:product_categories,id',
            'unit_id' => 'nullable|exists:units,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'department_id' => 'nullable|exists:departments,id',
            'cost_center_id' => 'nullable|exists:cost_centers,id',
            'sub_cost_center_id' => 'nullable|exists:cost_centers,id',
            'photo' => 'nullable|string',
        ]);

        // Convert quantity to integer if it's a decimal
        if (isset($validated['quantity'])) {
            $validated['quantity'] = (int) $validated['quantity'];
        }

        $rfqRequest = RfqRequest::create($validated);

        return response()->json([
            'message' => 'RFQ request created successfully',
            'data' => new RfqRequestResource($rfqRequest)
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'nullable|in:Pending,Approved,Rejected',
            'rejection_reason' => 'nullable|string',
            'approved_by' => 'nullable|exists:users,id',
            'rfq_id' => 'nullable|exists:rfqs,id',
        ]);

        $rfqRequest = RfqRequest::findOrFail($id);

        $updateData = [];

        if (isset($validated['status'])) {
            $updateData['status'] = $validated['status'];
            
            if ($validated['status'] === 'Approved') {
                $updateData['approved_at'] = now();
                $updateData['approved_by'] = $validated['approved_by'] ?? Auth::id();
                $updateData['rfq_id'] = $validated['rfq_id'] ?? null;
            } elseif ($validated['status'] === 'Rejected') {
                $updateData['rejection_reason'] = $validated['rejection_reason'] ?? null;
            }
        }

        if (isset($validated['rejection_reason'])) {
            $updateData['rejection_reason'] = $validated['rejection_reason'];
        }

        $rfqRequest->update($updateData);

        return response()->json([
            'message' => 'RFQ request updated successfully',
            'data' => new RfqRequestResource($rfqRequest)
        ]);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:Pending,Approved,Rejected',
            'approved_by' => 'nullable|exists:users,id',
            'rfq_id' => 'nullable|exists:rfqs,id',
            'rejection_reason' => 'nullable|string',
        ]);

        $rfqRequest = RfqRequest::findOrFail($id);

        $updateData = [
            'status' => $validated['status'],
            'approved_by' => $validated['approved_by'] ?? Auth::id(),
        ];

        if ($validated['status'] === 'Approved') {
            $updateData['approved_at'] = now();
            $updateData['rfq_id'] = $validated['rfq_id'] ?? null;
        } elseif ($validated['status'] === 'Rejected') {
            $updateData['rejection_reason'] = $validated['rejection_reason'] ?? null;
        }

        $rfqRequest->update($updateData);

        return response()->json([
            'message' => 'RFQ request status updated successfully',
            'data' => new RfqRequestResource($rfqRequest)
        ]);
    }

    public function markRequested($id): JsonResponse
    {
        $rfqRequest = RfqRequest::findOrFail($id);
        $rfqRequest->update(['is_requested' => true]);

        return response()->json([
            'message' => 'RFQ request marked as requested successfully',
            'data' => new RfqRequestResource($rfqRequest)
        ]);
    }
}
