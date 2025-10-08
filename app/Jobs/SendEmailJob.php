<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $emailData;
    protected $recipient;
    protected $subject;
    protected $template;

    /**
     * Create a new job instance.
     */
    public function __construct($emailData, $recipient, $subject, $template = null)
    {
        $this->emailData = $emailData;
        $this->recipient = $recipient;
        $this->subject = $subject;
        $this->template = $template;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Sending email', [
                'recipient' => $this->recipient,
                'subject' => $this->subject
            ]);

            // Send email logic here
            // This could be using Laravel's Mail facade
            // or any other email service
        } catch (\Exception $e) {
            Log::error('Email sending failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Email job failed permanently', [
            'error' => $exception->getMessage(),
            'recipient' => $this->recipient,
            'subject' => $this->subject
        ]);
    }
}
