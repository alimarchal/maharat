<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\RfqStatusLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class RfqStatusLogController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $logs = RfqStatusLog::query()
                ->select([
                    'rfq_status_logs.*',
                    'statuses.name as status_name'
                ])
                ->leftJoin('statuses', 'rfq_status_logs.status_id', '=', 'statuses.id')
                ->orderBy('rfq_status_logs.created_at', 'desc')
                ->paginate(10);

            return response()->json([
                'data' => $logs->items(),
                'meta' => [
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('RFQ Status Logs Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch RFQ status logs'
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $log = RfqStatusLog::findOrFail($id);
            $log->update($request->all());

            return response()->json([
                'message' => 'Updated successfully',
                'data' => $log->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Update failed'
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $log = RfqStatusLog::findOrFail($id);
            $log->delete();

            return response()->json([
                'message' => 'RFQ status log deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('RFQ Status Log Delete Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete RFQ status log',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 