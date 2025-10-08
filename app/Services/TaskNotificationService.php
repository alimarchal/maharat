<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use App\Models\NotificationType;
use App\Models\NotificationChannel;
use App\Models\UserNotificationSetting;
use App\Notifications\TaskAssignmentNotification;
use App\Notifications\TaskStatusNotification;
use Illuminate\Support\Facades\Log;

class TaskNotificationService
{
    /**
     * Check if user has email notifications enabled for a specific process type
     */
    private function isEmailNotificationEnabled(User $user, string $processTitle): bool
    {
        try {
            // Map process title to notification type key
            $notificationTypeKey = $this->getNotificationTypeKeyFromProcess($processTitle);
            
            if (!$notificationTypeKey) {
                Log::warning('No notification type key found for process', [
                    'process_title' => $processTitle,
                    'user_id' => $user->id
                ]);
                return false;
            }

            // Get notification type and email channel
            $notificationType = NotificationType::where('key', $notificationTypeKey)->first();
            $emailChannel = NotificationChannel::where('key', 'email')->first();

            if (!$notificationType || !$emailChannel) {
                Log::warning('Notification type or email channel not found', [
                    'notification_type_key' => $notificationTypeKey,
                    'user_id' => $user->id
                ]);
                return false;
            }

            // Check if user has email notifications enabled for this process type
            $setting = UserNotificationSetting::where([
                'user_id' => $user->id,
                'notification_type_id' => $notificationType->id,
                'notification_channel_id' => $emailChannel->id,
            ])->first();

            $isEnabled = $setting ? $setting->is_enabled : false;

            return $isEnabled;

        } catch (\Exception $e) {
            Log::error('Error checking email notification settings', [
                'user_id' => $user->id,
                'process_title' => $processTitle,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Map process title to notification type key
     */
    private function getNotificationTypeKeyFromProcess(string $processTitle): ?string
    {
        $processToNotificationKeyMap = [
            'Material Request' => 'material_request',
            'RFQ Approval' => 'rfq_approval',
            'Purchase Order Approval' => 'purchase_order_approval',
            'Maharat Invoice Approval' => 'maharat_invoice_approval',
            'Payment Order Approval' => 'payment_order_approval',
            'Budget Request Approval' => 'budget_request_approval',
            'Total Budget Approval' => 'total_budget_approval',
        ];

        return $processToNotificationKeyMap[$processTitle] ?? null;
    }

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

            // Check if user has email notifications enabled for this process type
            $processTitle = $task->process->title ?? $taskType;
            if (!$this->isEmailNotificationEnabled($assignedToUser, $processTitle)) {
                Log::info('Email notification disabled for user, skipping task assignment notification', [
                    'task_id' => $task->id,
                    'task_type' => $taskType,
                    'assigned_to_user_id' => $task->assigned_to_user_id,
                    'assigned_to_email' => $assignedToUser->email,
                    'process_title' => $processTitle
                ]);
                return;
            }

            $assignedToUser->notify(new TaskAssignmentNotification($task, $taskType));
        } catch (\Exception $e) {
            Log::error('Failed to send task assignment notification', [
                'task_id' => $task->id,
                'task_type' => $taskType,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send intermediate status notification to requester
     */
    public function sendIntermediateStatusNotification(Task $task, string $taskType, string $status, $requester, string $comment = null): void
    {
        try {
            if (!$requester || !$requester->email) {
                Log::warning('Cannot send intermediate status notification: Requester or email not found', [
                    'task_id' => $task->id,
                    'task_type' => $taskType,
                    'status' => $status
                ]);
                return;
            }

            // Check if requester has email notifications enabled for this process type
            $processTitle = $task->process->title ?? $taskType;
            if (!$this->isEmailNotificationEnabled($requester, $processTitle)) {
                Log::info('Email notification disabled for requester, skipping intermediate status notification', [
                    'task_id' => $task->id,
                    'task_type' => $taskType,
                    'status' => $status,
                    'requester_id' => $requester->id,
                    'requester_email' => $requester->email,
                    'process_title' => $processTitle
                ]);
                return;
            }

            $requester->notify(new TaskStatusNotification($task, $taskType, $status, $comment));
        } catch (\Exception $e) {
            Log::error('Failed to send intermediate status notification', [
                'task_id' => $task->id,
                'task_type' => $taskType,
                'status' => $status,
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

            // Check if requester has email notifications enabled for this process type
            $processTitle = $task->process->title ?? $taskType;
            if (!$this->isEmailNotificationEnabled($requester, $processTitle)) {
                Log::info('Email notification disabled for requester, skipping final status notification', [
                    'task_id' => $task->id,
                    'task_type' => $taskType,
                    'status' => $status,
                    'requester_id' => $requester->id,
                    'requester_email' => $requester->email,
                    'process_title' => $processTitle
                ]);
                return;
            }

            $requester->notify(new TaskStatusNotification($task, $taskType, $status, $comment));
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
            'purchase_order.user',
            'payment_order.user',
            'invoice.creator',
            'request_budget.creator',
            'budget.creator'
        ]);

        switch ($task->process->title ?? '') {
            case 'Material Request':
                return $task->material_request->requester ?? null;
            
            case 'RFQ Approval':
                return $task->rfq->requester ?? null;
            
            case 'Purchase Order Approval':
                return $task->purchase_order->user ?? null;
            
            case 'Payment Order Approval':
                return $task->payment_order->user ?? null;
            
            case 'Budget Request Approval':
                return $task->request_budget->creator ?? null;
            
            case 'Total Budget Approval':
                return $task->budget->creator ?? null;
            
            case 'Maharat Invoice Approval':
                return $task->invoice->creator ?? null;
            
            default:
                return null;
        }
    }
} 