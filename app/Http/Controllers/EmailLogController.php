<?php

namespace App\Http\Controllers;

use App\Models\EmailLog;
use App\Services\EmailLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class EmailLogController extends Controller
{
    protected $emailLogService;

    public function __construct(EmailLogService $emailLogService)
    {
        $this->emailLogService = $emailLogService;
    }

    /**
     * Display a listing of email logs
     */
    public function index(Request $request): JsonResponse
    {
        $query = EmailLog::with(['recipientUser', 'triggeredByUser']);

        // Apply filters
        if ($request->filled('email_type')) {
            $query->where('email_type', $request->email_type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('recipient_email')) {
            $query->where('recipient_email', 'like', '%' . $request->recipient_email . '%');
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Paginate results
        $perPage = $request->get('per_page', 50);
        $emailLogs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'data' => $emailLogs->items(),
            'pagination' => [
                'current_page' => $emailLogs->currentPage(),
                'last_page' => $emailLogs->lastPage(),
                'per_page' => $emailLogs->perPage(),
                'total' => $emailLogs->total(),
            ]
        ], Response::HTTP_OK);
    }

    /**
     * Display the specified email log
     */
    public function show(EmailLog $emailLog): JsonResponse
    {
        $emailLog->load(['recipientUser', 'triggeredByUser', 'task', 'materialRequest', 'rfq', 'purchaseOrder', 'paymentOrder', 'invoice', 'budget', 'requestBudget']);

        return response()->json([
            'data' => $emailLog
        ], Response::HTTP_OK);
    }

    /**
     * Get email statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $dateRange = null;
        
        if ($request->filled('date_from') && $request->filled('date_to')) {
            $dateRange = [
                'start' => $request->date_from,
                'end' => $request->date_to
            ];
        }

        $statistics = $this->emailLogService->getStatistics($dateRange);

        return response()->json([
            'data' => $statistics
        ], Response::HTTP_OK);
    }

    /**
     * Get failed emails
     */
    public function failed(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 50);
        $failedEmails = $this->emailLogService->getFailedEmails($perPage);

        return response()->json([
            'data' => $failedEmails
        ], Response::HTTP_OK);
    }

    /**
     * Get recent email logs
     */
    public function recent(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 50);
        $recentLogs = $this->emailLogService->getRecentLogs($limit);

        return response()->json([
            'data' => $recentLogs
        ], Response::HTTP_OK);
    }

    /**
     * Retry failed email
     */
    public function retry(EmailLog $emailLog): JsonResponse
    {
        try {
            // Reset status to pending
            $emailLog->update(['status' => 'pending', 'error_message' => null]);
            
            // Here you could trigger a job to resend the email
            // For now, we'll just mark it as pending for manual review
            
            return response()->json([
                'message' => 'Email marked for retry',
                'data' => $emailLog
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retry email',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
