<?php

namespace App\Services;

use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Log;
use App\Jobs\ProcessHeavyTask;
use App\Jobs\SendEmailJob;
use App\Jobs\ProcessFileJob;

class QueueService
{
    /**
     * Dispatch a heavy task to the queue
     */
    public static function dispatchHeavyTask($taskData, $userId = null, $queue = 'default')
    {
        try {
            ProcessHeavyTask::dispatch($taskData, $userId)->onQueue($queue);
            Log::info('Heavy task dispatched to queue', ['queue' => $queue]);
        } catch (\Exception $e) {
            Log::error('Failed to dispatch heavy task', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Dispatch an email job to the queue
     */
    public static function dispatchEmailJob($emailData, $recipient, $subject, $template = null, $queue = 'emails')
    {
        try {
            SendEmailJob::dispatch($emailData, $recipient, $subject, $template)->onQueue($queue);
            Log::info('Email job dispatched to queue', ['queue' => $queue]);
        } catch (\Exception $e) {
            Log::error('Failed to dispatch email job', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Dispatch a file processing job to the queue
     */
    public static function dispatchFileJob($filePath, $userId = null, $operation = 'compress', $queue = 'files')
    {
        try {
            ProcessFileJob::dispatch($filePath, $userId, $operation)->onQueue($queue);
            Log::info('File job dispatched to queue', ['queue' => $queue]);
        } catch (\Exception $e) {
            Log::error('Failed to dispatch file job', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Get queue statistics
     */
    public static function getQueueStats()
    {
        try {
            $stats = [
                'default' => Queue::size('default'),
                'emails' => Queue::size('emails'),
                'files' => Queue::size('files'),
                'high' => Queue::size('high'),
                'low' => Queue::size('low'),
            ];
            
            return $stats;
        } catch (\Exception $e) {
            Log::error('Failed to get queue stats', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Clear a specific queue
     */
    public static function clearQueue($queue = 'default')
    {
        try {
            Queue::clear($queue);
            Log::info('Queue cleared', ['queue' => $queue]);
        } catch (\Exception $e) {
            Log::error('Failed to clear queue', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Clear all queues
     */
    public static function clearAllQueues()
    {
        try {
            $queues = ['default', 'emails', 'files', 'high', 'low'];
            foreach ($queues as $queue) {
                Queue::clear($queue);
            }
            Log::info('All queues cleared');
        } catch (\Exception $e) {
            Log::error('Failed to clear all queues', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Dispatch a delayed job
     */
    public static function dispatchDelayedJob($job, $delay, $queue = 'default')
    {
        try {
            $job->delay($delay)->onQueue($queue);
            Log::info('Delayed job dispatched', ['queue' => $queue, 'delay' => $delay]);
        } catch (\Exception $e) {
            Log::error('Failed to dispatch delayed job', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Dispatch a job with retry logic
     */
    public static function dispatchWithRetry($job, $maxTries = 3, $queue = 'default')
    {
        try {
            $job->onQueue($queue)->onConnection('database');
            Log::info('Job dispatched with retry logic', ['queue' => $queue, 'max_tries' => $maxTries]);
        } catch (\Exception $e) {
            Log::error('Failed to dispatch job with retry', ['error' => $e->getMessage()]);
            throw $e;
        }
    }
}
