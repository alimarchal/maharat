<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Task;
use App\Services\EmailLogService;

class TaskAssignmentNotification extends Notification
{

    protected $task;
    protected $taskType;

    /**
     * Create a new notification instance.
     */
    public function __construct(Task $task, string $taskType)
    {
        $this->task = $task;
        $this->taskType = $taskType;
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
        $assignedFrom = $this->task->assignedFromUser;
        $documentName = $this->getDocumentName();
        $priority = $this->getPriority();

        // Get proper names from relationships
        $assigneeDepartment = $notifiable->department->name ?? 'N/A';
        $assignerDepartment = $assignedFrom->department->name ?? 'N/A';
        $assignerDesignation = $assignedFrom->designation->designation ?? 'N/A';

        // Log the email
        $emailLogService = new EmailLogService();
        $relatedData = $this->getRelatedData();
        $contentSummary = "Task assignment notification for {$this->taskType} - Task ID: #{$this->task->id}";
        
        $emailLog = $emailLogService->logEmail(
            'task_assignment',
            "Approval Needed: {$this->taskType} - {$documentName}",
            $notifiable->email,
            $notifiable,
            $contentSummary,
            $relatedData,
            "Task assigned by {$assignedFrom->name}"
        );

        $mailMessage = (new MailMessage)
            ->subject("Approval Needed: {$this->taskType} - {$documentName}")
            ->greeting("Dear {$notifiable->name},")
            ->line("You have been assigned a new task that requires your attention and approval or rejection.")
            ->line("")
            ->line("**To:** {$notifiable->name}/{$assigneeDepartment}")
            ->line("**From:** {$assignedFrom->name}/{$assignerDepartment}")
            ->line("**Subject:** Approval Needed: {$this->taskType} - {$documentName}")
            ->line("**Priority:** {$priority}")
            ->line("")
            ->line("Thank you for your prompt attention to this matter.")
            ->line("")
            ->line("Best regards,")
            ->line("{$assignedFrom->name}")
            ->line("{$assignerDesignation}")
            ->line("{$assignerDepartment}");

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
     * Get priority level
     */
    private function getPriority(): string
    {
        $urgency = $this->task->urgency ?? 'Normal';
        
        switch (strtolower($urgency)) {
            case 'high':
                return 'High';
            case 'urgent':
                return 'Urgent';
            case 'low':
                return 'Normal';
            default:
                return 'Normal';
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
