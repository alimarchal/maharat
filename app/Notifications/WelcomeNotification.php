<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\User;

class WelcomeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $user;
    protected $temporaryPassword;

    /**
     * Create a new notification instance.
     */
    public function __construct(User $user, string $temporaryPassword = null)
    {
        $this->user = $user;
        $this->temporaryPassword = $temporaryPassword;
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
        $mailMessage = (new MailMessage)
            ->subject('Welcome to ' . config('app.name'))
            ->greeting("Hello {$notifiable->name},")
            ->line("Welcome to " . config('app.name') . "! Your account has been created successfully.")
            ->line("")
            ->line("**Account Details:**")
            ->line("Name: {$notifiable->name}")
            ->line("Email: {$notifiable->email}")
            ->line("Username: {$notifiable->username}");

        if ($this->temporaryPassword) {
            $mailMessage->line("Temporary Password: {$this->temporaryPassword}")
                ->line("")
                ->line("**Important:** Please change your password after your first login for security purposes.");
        }

        $mailMessage->line("")
            ->line("You can now log into your account using your email and password.")
            ->line("")
            ->line("If you have any questions or need assistance, please contact your system administrator.")
            ->line("")
            ->line("Thank you for joining us!")
            ->salutation("Best regards,");

        return $mailMessage;
    }
} 