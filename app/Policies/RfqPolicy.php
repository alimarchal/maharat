<?php

namespace App\Policies;

use App\Models\Rfq;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class RfqPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Rfq $rfq): bool
    {
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Rfq $rfq): bool
    {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Rfq $rfq): bool
    {
        // Allow deletion only if:
        // 1. User is the requester AND
        // 2. Status is Draft (not yet submitted for approval)
        return $user->id === $rfq->requester_id && 
               $rfq->status && 
               $rfq->status->name === 'Draft';
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Rfq $rfq): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Rfq $rfq): bool
    {
        return false;
    }
}
