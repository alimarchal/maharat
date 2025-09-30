<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use App\Services\CacheService;

class ProcessHeavyTask implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $taskData;
    protected $userId;

    /**
     * Create a new job instance.
     */
    public function __construct($taskData, $userId = null)
    {
        $this->taskData = $taskData;
        $this->userId = $userId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Processing heavy task', ['task_data' => $this->taskData]);
            
            // Process the heavy task here
            $this->processTask();
            
            // Update cache if user is provided
            if ($this->userId) {
                CacheService::invalidateUserCache($this->userId);
            }
            
            Log::info('Heavy task completed successfully');
        } catch (\Exception $e) {
            Log::error('Heavy task failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Process the actual task
     */
    private function processTask()
    {
        // Implement your heavy task logic here
        // This could be:
        // - Data processing
        // - File generation
        // - External API calls
        // - Complex calculations
        // - Report generation
        // - Email sending
        // - Image processing
        // - Database operations
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Heavy task failed permanently', [
            'error' => $exception->getMessage(),
            'task_data' => $this->taskData,
            'user_id' => $this->userId
        ]);
    }
}
