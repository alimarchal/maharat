<?php

namespace App\Services;

use App\Models\EmailLog;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class EmailLogService
{
    /**
     * Log an email before sending
     */
    public function logEmail(
        string $emailType,
        string $subject,
        string $recipientEmail,
        ?User $recipientUser = null,
        ?string $contentSummary = null,
        array $relatedData = [],
        ?string $notes = null
    ): EmailLog {
        try {
            $logData = [
                'email_type' => $emailType,
                'subject' => $subject,
                'content_summary' => $contentSummary,
                'recipient_email' => $recipientEmail,
                'recipient_user_id' => $recipientUser?->id,
                'recipient_name' => $recipientUser?->name,
                'triggered_by_user_id' => Auth::id(),
                'status' => 'pending',
                'mail_provider' => config('mail.default'),
                'notes' => $notes,
            ];

            // Add related record IDs
            foreach ($relatedData as $key => $value) {
                if (in_array($key, [
                    'task_id', 'material_request_id', 'rfq_id', 'purchase_order_id',
                    'payment_order_id', 'invoice_id', 'budget_id', 'request_budget_id'
                ])) {
                    $logData[$key] = $value;
                }
            }

            $emailLog = EmailLog::create($logData);

            Log::info('Email logged for sending', [
                'email_log_id' => $emailLog->id,
                'email_type' => $emailType,
                'recipient_email' => $recipientEmail,
                'subject' => $subject
            ]);

            return $emailLog;

        } catch (\Exception $e) {
            Log::error('Failed to log email', [
                'email_type' => $emailType,
                'recipient_email' => $recipientEmail,
                'error' => $e->getMessage()
            ]);
            
            // Return a dummy log entry to prevent errors
            return new EmailLog([
                'email_type' => $emailType,
                'subject' => $subject,
                'recipient_email' => $recipientEmail,
                'status' => 'failed',
                'error_message' => 'Failed to create log entry: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Mark email as sent
     */
    public function markAsSent(EmailLog $emailLog, ?string $messageId = null): void
    {
        try {
            $emailLog->markAsSent($messageId);
            
            Log::info('Email marked as sent', [
                'email_log_id' => $emailLog->id,
                'message_id' => $messageId
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to mark email as sent', [
                'email_log_id' => $emailLog->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Mark email as failed
     */
    public function markAsFailed(EmailLog $emailLog, string $errorMessage): void
    {
        try {
            $emailLog->markAsFailed($errorMessage);
            
            Log::error('Email marked as failed', [
                'email_log_id' => $emailLog->id,
                'error_message' => $errorMessage
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to mark email as failed', [
                'email_log_id' => $emailLog->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get email statistics
     */
    public function getStatistics($dateRange = null): array
    {
        $query = EmailLog::query();
        
        if ($dateRange) {
            $query->byDateRange($dateRange['start'], $dateRange['end']);
        }

        return [
            'total' => $query->count(),
            'sent' => $query->clone()->sent()->count(),
            'failed' => $query->clone()->failed()->count(),
            'pending' => $query->clone()->byStatus('pending')->count(),
            'by_type' => $query->clone()
                ->selectRaw('email_type, COUNT(*) as count')
                ->groupBy('email_type')
                ->pluck('count', 'email_type')
                ->toArray(),
        ];
    }

    /**
     * Get recent email logs
     */
    public function getRecentLogs(int $limit = 50): \Illuminate\Database\Eloquent\Collection
    {
        return EmailLog::with(['recipientUser', 'triggeredByUser'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get failed emails
     */
    public function getFailedEmails(int $limit = 50): \Illuminate\Database\Eloquent\Collection
    {
        return EmailLog::with(['recipientUser', 'triggeredByUser'])
            ->failed()
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
} 