<?php

namespace App\Observers;

use App\Models\User;

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
