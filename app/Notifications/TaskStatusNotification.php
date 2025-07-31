<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Task;
use App\Services\EmailLogService;

class TaskStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $task;
    protected $taskType;
    protected $status;
    protected $requester;

    /**
     * Create a new notification instance.
     */
    public function __construct(Task $task, string $taskType, string $status, $requester)
    {
        $this->task = $task;
        $this->taskType = $taskType;
        $this->status = $status;
        $this->requester = $requester;
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
        $taskDetails = $this->getTaskDetails();
        $statusText = $this->status === 'Approve' ? 'APPROVED' : 'REJECTED';
        $statusColor = $this->status === 'Approve' ? 'green' : 'red';

        // Log the email
        $emailLogService = new EmailLogService();
        $relatedData = $this->getRelatedData();
        $contentSummary = "Task status notification for {$this->taskType} - Task ID: #{$this->task->id} - Status: {$statusText}";
        
        $emailLog = $emailLogService->logEmail(
            'task_status',
            "Your {$this->taskType} has been {$statusText}",
            $notifiable->email,
            $notifiable,
            $contentSummary,
            $relatedData,
            "Final status: {$statusText}"
        );

        $mailMessage = (new MailMessage)
            ->subject("Your {$this->taskType} has been {$statusText}")
            ->greeting("Hello {$notifiable->name},")
            ->line("Your {$this->taskType} has been {$statusText}.")
            ->line("")
            ->line("**Request Details:**")
            ->line("Task Type: {$this->taskType}")
            ->line("Task ID: #{$this->task->id}")
            ->line("Status: {$statusText}")
            ->line("Final Decision Date: " . now()->format('M d, Y H:i'))
            ->line("")
            ->line("**Request Information:**")
            ->line($taskDetails)
            ->line("")
            ->line("You can log into the system to view the complete details and any additional comments.")
            ->line("")
            ->line("Thank you for using our system.")
            ->salutation("Best regards,");

        // Mark as sent
        $emailLogService->markAsSent($emailLog);

        return $mailMessage;
    }

    /**
     * Get task-specific details based on the task type
     */
    private function getTaskDetails(): string
    {
        $details = [];

        switch ($this->taskType) {
            case 'Material Request':
                if ($this->task->material_request) {
                    $mr = $this->task->material_request;
                    $details[] = "Request ID: MR-{$mr->id}";
                    $details[] = "Requester: " . ($mr->requester->name ?? 'N/A');
                    $details[] = "Department: " . ($mr->department->name ?? 'N/A');
                    $details[] = "Warehouse: " . ($mr->warehouse->name ?? 'N/A');
                    if ($mr->expected_delivery_date) {
                        $details[] = "Expected Delivery: " . date('M d, Y', strtotime($mr->expected_delivery_date));
                    }
                }
                break;

            case 'RFQ Approval':
                if ($this->task->rfq) {
                    $rfq = $this->task->rfq;
                    $details[] = "RFQ Number: {$rfq->rfq_number}";
                    $details[] = "Organization: {$rfq->organization_name}";
                    $details[] = "Department: " . ($rfq->department->name ?? 'N/A');
                    $details[] = "Warehouse: " . ($rfq->warehouse->name ?? 'N/A');
                    $details[] = "Created By: " . ($rfq->requester->name ?? 'N/A');
                }
                break;

            case 'Purchase Order Approval':
                if ($this->task->purchase_order) {
                    $po = $this->task->purchase_order;
                    $details[] = "PO ID: PO-{$po->id}";
                    $details[] = "PO Number: {$po->purchase_order_no}";
                    $details[] = "Supplier: " . ($po->supplier->name ?? 'N/A');
                    $details[] = "Total Amount: " . number_format($po->amount, 2);
                    if ($po->purchase_order_date) {
                        $details[] = "PO Date: " . date('M d, Y', strtotime($po->purchase_order_date));
                    }
                }
                break;

            case 'Budget Request Approval':
                if ($this->task->request_budget) {
                    $budget = $this->task->request_budget;
                    $details[] = "Department: " . ($budget->department->name ?? 'N/A');
                    $details[] = "Cost Center: " . ($budget->cost_center->name ?? 'N/A');
                    $details[] = "Requested Amount: " . number_format($budget->requested_amount, 2);
                    $details[] = "Approved Amount: " . number_format($budget->approved_amount ?? 0, 2);
                    $details[] = "Urgency: {$budget->urgency}";
                    $details[] = "Status: {$budget->status}";
                }
                break;

            case 'Total Budget Approval':
                if ($this->task->budget) {
                    $budget = $this->task->budget;
                    $details[] = "Department: " . ($budget->department->name ?? 'N/A');
                    $details[] = "Cost Center: " . ($budget->cost_center->name ?? 'N/A');
                    $details[] = "Total Revenue Planned: " . number_format($budget->total_revenue_planned, 2);
                    $details[] = "Total Expense Planned: " . number_format($budget->total_expense_planned, 2);
                    $details[] = "Status: {$budget->status}";
                }
                break;

            case 'Payment Order Approval':
                if ($this->task->payment_order) {
                    $po = $this->task->payment_order;
                    $details[] = "Payment Order Number: {$po->payment_order_number}";
                    $details[] = "Purchase Order: " . ($po->purchase_order->purchase_order_no ?? 'N/A');
                    $details[] = "Total Amount: " . number_format($po->total_amount, 2);
                    $details[] = "Payment Type: {$po->payment_type}";
                    if ($po->due_date) {
                        $details[] = "Due Date: " . date('M d, Y', strtotime($po->due_date));
                    }
                }
                break;

            case 'Maharat Invoice Approval':
                if ($this->task->invoice) {
                    $invoice = $this->task->invoice;
                    $details[] = "Invoice Number: {$invoice->invoice_number}";
                    $details[] = "Client: " . ($invoice->client->name ?? 'N/A');
                    $details[] = "Total Amount: " . number_format($invoice->total_amount, 2);
                    $details[] = "Status: {$invoice->status}";
                    if ($invoice->issue_date) {
                        $details[] = "Issue Date: " . date('M d, Y', strtotime($invoice->issue_date));
                    }
                }
                break;

            default:
                $details[] = "Task Type: {$this->taskType}";
                break;
        }

        return implode("\n", $details);
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