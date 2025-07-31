<?php

namespace App\Observers;

use App\Models\User;
use App\Notifications\WelcomeNotification;
use Illuminate\Support\Facades\Log;

class UserObserver
{
    /**
     * Handle the User "saving" event.
     */
    public function saving(User $user): void
    {
        // Calculate hierarchy level based on parent
        if ($user->parent_id) {
            $parent = User::find($user->parent_id);
            if ($parent) {
                $user->hierarchy_level = $parent->hierarchy_level + 1;
            }
        } 
        
        // else {
        //     $user->hierarchy_level = null; // Top level
        // }
    }

    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        try {
            // Send welcome email to the new user
            if ($user->email) {
                $user->notify(new WelcomeNotification($user));
                
                Log::info('Welcome email sent to new user', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send welcome email to new user', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        // If parent_id changed, update all subordinates' hierarchy levels
        if ($user->wasChanged('parent_id')) {
            $user->updateSubordinateHierarchyLevels();
        }
    }

}
