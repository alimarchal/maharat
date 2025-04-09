<?php

namespace App\Policies;

use App\Models\Faq;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class FaqPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // All users can view FAQs
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Faq $faq): bool
    {
        return true; // All users can view individual FAQs
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('admin'); // Only admins can create FAQs
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Faq $faq): bool
    {
        return $user->hasRole('admin'); // Only admins can update FAQs
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Faq $faq): bool
    {
        return $user->hasRole('admin'); // Only admins can delete FAQs
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Faq $faq): bool
    {
        return $user->hasRole('admin'); // Only admins can restore FAQs
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Faq $faq): bool
    {
        return $user->hasRole('admin'); // Only admins can permanently delete FAQs
    }
}
