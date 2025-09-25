<?php

namespace App\Policies;

use App\Models\RequestBudget;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class RequestBudgetPolicy
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
    public function view(User $user, RequestBudget $requestBudget): bool
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
    public function update(User $user, RequestBudget $requestBudget): bool
    {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, RequestBudget $requestBudget): bool
    {
        // Allow deletion only if:
        // 1. User is the creator AND
        // 2. Status is Draft or Pending (not yet approved)
        return $user->id === $requestBudget->created_by && 
               $requestBudget->status && 
               in_array($requestBudget->status, ['Draft', 'Pending']);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, RequestBudget $requestBudget): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, RequestBudget $requestBudget): bool
    {
        return false;
    }
}
