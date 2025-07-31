<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskAssignmentNotification;
use App\Notifications\TaskStatusNotification;
use Illuminate\Support\Facades\Log;

class TaskNotificationService
{
    /**
     * Send task assignment notification
     */
    public function sendTaskAssignmentNotification(Task $task, string $taskType): void
    {
        try {
            $assignedToUser = $task->assignedToUser;
            
            if (!$assignedToUser || !$assignedToUser->email) {
                Log::warning('Cannot send task assignment notification: User or email not found', [
                    'task_id' => $task->id,
                    'assigned_to_user_id' => $task->assigned_to_user_id
                ]);
                return;
            }

            $assignedToUser->notify(new TaskAssignmentNotification($task, $taskType));
            
            Log::info('Task assignment notification sent successfully', [
                'task_id' => $task->id,
                'task_type' => $taskType,
                'assigned_to_user_id' => $task->assigned_to_user_id,
                'assigned_to_email' => $assignedToUser->email
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send task assignment notification', [
                'task_id' => $task->id,
                'task_type' => $taskType,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send final status notification to requester
     */
    public function sendFinalStatusNotification(Task $task, string $taskType, string $status, $requester, string $comment = null): void
    {
        try {
            if (!$requester || !$requester->email) {
                Log::warning('Cannot send final status notification: Requester or email not found', [
                    'task_id' => $task->id,
                    'task_type' => $taskType,
                    'status' => $status
                ]);
                return;
            }

            $requester->notify(new TaskStatusNotification($task, $taskType, $status, $comment));
            
            Log::info('Final status notification sent successfully', [
                'task_id' => $task->id,
                'task_type' => $taskType,
                'status' => $status,
                'requester_id' => $requester->id,
                'requester_email' => $requester->email
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send final status notification', [
                'task_id' => $task->id,
                'task_type' => $taskType,
                'status' => $status,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get task type from process title
     */
    public function getTaskTypeFromProcess(string $processTitle): string
    {
        $taskTypeMap = [
            'Material Request' => 'Material Request',
            'RFQ Approval' => 'RFQ Approval',
            'Purchase Order Approval' => 'Purchase Order Approval',
            'Maharat Invoice Approval' => 'Maharat Invoice Approval',
            'Payment Order Approval' => 'Payment Order Approval',
            'Budget Request Approval' => 'Budget Request Approval',
            'Total Budget Approval' => 'Total Budget Approval',
            'RFQ' => 'RFQ'
        ];

        return $taskTypeMap[$processTitle] ?? $processTitle;
    }

    /**
     * Get requester from task based on task type
     */
    public function getRequesterFromTask(Task $task): ?User
    {
        // Load the task with relationships
        $task->load([
            'material_request.requester',
            'rfq.requester',
            'purchase_order.created_by',
            'payment_order.user',
            'invoice.client',
            'request_budget.requester',
            'budget.requester'
        ]);

        switch ($task->process->title ?? '') {
            case 'Material Request':
                return $task->material_request->requester ?? null;
            
            case 'RFQ Approval':
                return $task->rfq->requester ?? null;
            
            case 'Purchase Order Approval':
                return $task->purchase_order->created_by ?? null;
            
            case 'Payment Order Approval':
                return $task->payment_order->user ?? null;
            
            case 'Budget Request Approval':
                return $task->request_budget->requester ?? null;
            
            case 'Total Budget Approval':
                return $task->budget->requester ?? null;
            
            case 'Maharat Invoice Approval':
                // For invoices, we might need to get the user who created it
                // This depends on your invoice model structure
                return null; // You may need to adjust this based on your invoice model
            
            default:
                return null;
        }
    }
} 