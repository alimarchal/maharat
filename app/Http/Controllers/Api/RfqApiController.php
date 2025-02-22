<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rfq;
use Illuminate\Http\Request;

class RfqApiController extends Controller
{
    public function index()
    {
        $rfqs = Rfq::with(['category', 'status', 'supplier'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'data' => $rfqs->items(),
            'meta' => [
                'current_page' => $rfqs->currentPage(),
                'last_page' => $rfqs->lastPage(),
                'per_page' => $rfqs->perPage(),
                'total' => $rfqs->total()
            ]
        ]);
    }

    public function destroy($id)
    {
        try {
            $rfq = Rfq::findOrFail($id);
            $rfq->delete();

            return response()->json([
                'message' => 'RFQ deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete RFQ'
            ], 500);
        }
    }
} 