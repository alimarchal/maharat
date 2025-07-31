<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use App\Services\EmailLogService;

class ResetPasswordNotification extends ResetPassword
{

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        \Log::info('ResetPasswordNotification toMail called', [
            'notifiable_email' => $notifiable->email,
            'token' => $this->token
        ]);

        $url = url(route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        \Log::info('Reset URL generated', ['url' => $url]);

        // Log the email
        $emailLogService = new EmailLogService();
        $contentSummary = "Password reset link sent to user: {$notifiable->name} ({$notifiable->email})";
        
        try {
            $emailLog = $emailLogService->logEmail(
                'password_reset',
                'Reset Password Notification',
                $notifiable->email,
                $notifiable,
                $contentSummary,
                [],
                "Password reset requested by user"
            );

            \Log::info('Email logged successfully', ['email_log_id' => $emailLog->id]);

            $mailMessage = (new MailMessage)
                ->subject('Reset Password Notification')
                ->greeting("Hello {$notifiable->name},")
                ->line('You are receiving this email because we received a password reset request for your account.')
                ->action('Reset Password', $url)
                ->line('This password reset link will expire in ' . config('auth.passwords.' . config('auth.defaults.passwords') . '.expire') . ' minutes.')
                ->line('If you did not request a password reset, no further action is required.')
                ->line('')
                ->line('Thank you for using our application!')
                ->salutation('Best regards,');

            // Mark as sent
            $emailLogService->markAsSent($emailLog);

            \Log::info('Email marked as sent', ['email_log_id' => $emailLog->id]);

            return $mailMessage;
        } catch (Exception $e) {
            \Log::error('Error in ResetPasswordNotification', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
} 