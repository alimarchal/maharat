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
        
        // Determine if this is an intermediate step or final status
        $isIntermediate = strtolower($this->status) === 'approved' && $this->isIntermediateApproval();
        $isFinalApproval = strtolower($this->status) === 'approved' && !$this->isIntermediateApproval();
        $isRejection = strtolower($this->status) === 'rejected';
        
        $logSubject = $isIntermediate 
            ? "Progress Update: {$this->taskType} - {$documentName}"
            : ($isFinalApproval 
                ? "Final Approval: {$this->taskType} - {$documentName}"
                : "Status Update: {$this->taskType} - {$documentName}");
        
        $emailLog = $emailLogService->logEmail(
            'task_status_update',
            $logSubject,
            $notifiable->email,
            $notifiable,
            $contentSummary,
            $relatedData,
            "Status updated by {$approver->name}"
        );

        $subject = $logSubject;
        
        // Customize greeting and message based on status type
        if ($isIntermediate) {
            $greeting = "Your request is progressing through the approval process.";
            $statusDescription = "Your request has been approved by this approver and is now being forwarded to the next level for final review.";
        } elseif ($isFinalApproval) {
            $greeting = "Congratulations! Your request has been fully approved.";
            $statusDescription = "Your request has been approved by all required approvers and is now complete.";
        } elseif ($isRejection) {
            $greeting = "Your request has been reviewed and requires attention.";
            $statusDescription = "Your request has been rejected. Please review the comments below and take necessary action.";
        } else {
            $greeting = "Your request has been reviewed and the status has been updated.";
            $statusDescription = "The status of your request has been updated.";
        }
            
        $mailMessage = (new MailMessage)
            ->subject($subject)
            ->greeting("Dear {$notifiable->name},")
            ->line($greeting)
            ->line("")
            ->line($statusDescription)
            ->line("")
            ->line("**To:** {$notifiable->name}/{$requesterDepartment}")
            ->line("**From:** {$approver->name}/{$approverDepartment}")
            ->line("**Subject:** {$subject}")
            ->line("**Status:** {$statusMessage}")
            ->line("**Updated By:** {$approver->name} ({$approverDesignation})")
            ->line("**Updated Date:** " . now()->format('M d, Y H:i'));

        if ($this->comment) {
            $mailMessage->line("")
                       ->line("**Comments:**")
                       ->line($this->comment);
        }

        $mailMessage->line("")
                   ->line("Please log into the system to view the complete details.");

        if ($isFinalApproval) {
            $mailMessage->line("")
                       ->line("Your request is now complete and ready for processing.");
        } elseif ($isRejection) {
            $mailMessage->line("")
                       ->line("Please review the rejection reason and resubmit if necessary.");
        }

        $mailMessage->line("")
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

    /**
     * Check if this is an intermediate approval (not the final one)
     */
    private function isIntermediateApproval(): bool
    {
        // Get the process title to determine the correct process
        $processTitle = $this->task->process->title ?? '';
        
        // Get total number of required approvals from process steps
        $totalRequiredApprovals = \DB::table('process_steps')
            ->join('processes', 'process_steps.process_id', '=', 'processes.id')
            ->where('processes.title', $processTitle)
            ->count();

        // If current task order is less than total required approvals, it's intermediate
        $isIntermediate = (int)$this->task->order_no < $totalRequiredApprovals;
        
        \Log::info('=== INTERMEDIATE APPROVAL CHECK IN NOTIFICATION ===', [
            'task_id' => $this->task->id,
            'process_title' => $processTitle,
            'current_order_no' => $this->task->order_no,
            'total_required_approvals' => $totalRequiredApprovals,
            'is_intermediate' => $isIntermediate
        ]);

        return $isIntermediate;
    }

    /**
     * Get the foreign key name for the task
     */
    private function getTaskForeignKey(): string
    {
        if ($this->task->material_request_id) return 'material_request_id';
        if ($this->task->rfq_id) return 'rfq_id';
        if ($this->task->purchase_order_id) return 'purchase_order_id';
        if ($this->task->payment_order_id) return 'payment_order_id';
        if ($this->task->invoice_id) return 'invoice_id';
        if ($this->task->request_budgets_id) return 'request_budgets_id';
        if ($this->task->budget_id) return 'budget_id';
        
        return 'id'; // fallback
    }

    /**
     * Get the foreign key value for the task
     */
    private function getTaskForeignKeyValue(): int
    {
        return $this->task->material_request_id ?? 
               $this->task->rfq_id ?? 
               $this->task->purchase_order_id ?? 
               $this->task->payment_order_id ?? 
               $this->task->invoice_id ?? 
               $this->task->request_budgets_id ?? 
               $this->task->budget_id ?? 
               $this->task->id;
    }
} 