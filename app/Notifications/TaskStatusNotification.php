<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Task;
use App\Services\EmailLogService;

class TaskStatusNotification extends Notification
{
    protected $task;
    protected $taskType;
    protected $status;
    protected $comment;

    /**
     * Create a new notification instance.
     */
    public function __construct(Task $task, string $taskType, string $status, string $comment = null)
    {
        $this->task = $task;
        $this->taskType = $taskType;
        $this->status = $status;
        $this->comment = $comment;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $approver = $this->task->assignedToUser;
        $documentName = $this->getDocumentName();
        $statusMessage = $this->getStatusMessage();

        // Get proper names from relationships
        $requesterDepartment = $notifiable->department->name ?? 'N/A';
        $approverDepartment = $approver->department->name ?? 'N/A';
        $approverDesignation = $approver->designation->designation ?? 'N/A';

        // Log the email
        $emailLogService = new EmailLogService();
        $relatedData = $this->getRelatedData();
        $contentSummary = "Task status update notification for {$this->taskType} - Status: {$this->status}";
        
        $emailLog = $emailLogService->logEmail(
            'task_status_update',
            "Status Update: {$this->taskType} - {$documentName}",
            $notifiable->email,
            $notifiable,
            $contentSummary,
            $relatedData,
            "Status updated by {$approver->name}"
        );

        $mailMessage = (new MailMessage)
            ->subject("Status Update: {$this->taskType} - {$documentName}")
            ->greeting("Dear {$notifiable->name},")
            ->line("Your request has been reviewed and the status has been updated.")
            ->line("")
            ->line("**To:** {$notifiable->name}/{$requesterDepartment}")
            ->line("**From:** {$approver->name}/{$approverDepartment}")
            ->line("**Subject:** Status Update: {$this->taskType} - {$documentName}")
            ->line("**Status:** {$statusMessage}")
            ->line("**Updated By:** {$approver->name} ({$approverDesignation})")
            ->line("**Updated Date:** " . now()->format('M d, Y H:i'));

        if ($this->comment) {
            $mailMessage->line("")
                       ->line("**Comments:**")
                       ->line($this->comment);
        }

        $mailMessage->line("")
                   ->line("Please log into the system to view the complete details.")
                   ->line("")
                   ->line("Thank you for using our system.")
                   ->line("")
                   ->line("Best regards,")
                   ->line("{$approver->name}")
                   ->line("{$approverDesignation}")
                   ->line("{$approverDepartment}");

        // Mark as sent
        $emailLogService->markAsSent($emailLog);

        return $mailMessage;
    }

    /**
     * Get document/file name based on task type
     */
    private function getDocumentName(): string
    {
        switch ($this->taskType) {
            case 'Material Request':
                if ($this->task->material_request) {
                    return "MR-{$this->task->material_request->id}";
                }
                break;

            case 'RFQ Approval':
                if ($this->task->rfq) {
                    return $this->task->rfq->rfq_number;
                }
                break;

            case 'Purchase Order Approval':
                if ($this->task->purchase_order) {
                    return $this->task->purchase_order->purchase_order_no;
                }
                break;

            case 'Budget Request Approval':
                if ($this->task->request_budget) {
                    return "Budget Request - {$this->task->request_budget->id}";
                }
                break;

            case 'Total Budget Approval':
                if ($this->task->budget) {
                    return "Budget - {$this->task->budget->id}";
                }
                break;

            case 'Payment Order Approval':
                if ($this->task->payment_order) {
                    return $this->task->payment_order->payment_order_number;
                }
                break;

            case 'Maharat Invoice Approval':
                if ($this->task->invoice) {
                    return $this->task->invoice->invoice_number;
                }
                break;

            default:
                return "Task #{$this->task->id}";
        }

        return "Task #{$this->task->id}";
    }

    /**
     * Get status message based on status
     */
    private function getStatusMessage(): string
    {
        switch (strtolower($this->status)) {
            case 'approved':
                return '✅ Approved';
            case 'rejected':
                return '❌ Rejected';
            case 'pending':
                return '⏳ Pending Review';
            case 'in_progress':
                return '🔄 In Progress';
            case 'completed':
                return '✅ Completed';
            case 'cancelled':
                return '🚫 Cancelled';
            default:
                return ucfirst($this->status);
        }
    }

    /**
     * Get related data for email logging
     */
    private function getRelatedData(): array
    {
        $relatedData = ['task_id' => $this->task->id];

        // Add specific related record based on task type
        switch ($this->taskType) {
            case 'Material Request':
                if ($this->task->material_request_id) {
                    $relatedData['material_request_id'] = $this->task->material_request_id;
                }
                break;
            case 'RFQ Approval':
                if ($this->task->rfq_id) {
                    $relatedData['rfq_id'] = $this->task->rfq_id;
                }
                break;
            case 'Purchase Order Approval':
                if ($this->task->purchase_order_id) {
                    $relatedData['purchase_order_id'] = $this->task->purchase_order_id;
                }
                break;
            case 'Payment Order Approval':
                if ($this->task->payment_order_id) {
                    $relatedData['payment_order_id'] = $this->task->payment_order_id;
                }
                break;
            case 'Budget Request Approval':
                if ($this->task->request_budgets_id) {
                    $relatedData['request_budget_id'] = $this->task->request_budgets_id;
                }
                break;
            case 'Total Budget Approval':
                if ($this->task->budget_id) {
                    $relatedData['budget_id'] = $this->task->budget_id;
                }
                break;
            case 'Maharat Invoice Approval':
                if ($this->task->invoice_id) {
                    $relatedData['invoice_id'] = $this->task->invoice_id;
                }
                break;
        }

        return $relatedData;
    }
} 