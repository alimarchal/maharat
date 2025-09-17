<?php

namespace App\Services;

use App\Models\ProcessStep;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ApproverResolver
{
    /**
     * Resolve the next approver user id for a given process step and requester.
     *
     * Cases supported:
     * - Explicit approver on step
     * - Designation-based approver (walk up parent chain until designation matches)
     * - Designation named "Direct Manager" (choose immediate parent)
     */
    public function resolveApproverId(ProcessStep $step, User $requester): ?int
    {
        if (!empty($step->approver_id)) {
            return (int) $step->approver_id;
        }

        if (!empty($step->designation_id)) {
            $designation = $step->designation; // relation
            if ($designation && strcasecmp(trim($designation->designation), 'Direct Manager') === 0) {
                return $requester->parent_id ?: null;
            }

            $current = $requester;
            while ($current) {
                if ((int) $current->designation_id === (int) $step->designation_id) {
                    return (int) $current->id;
                }
                if (!$current->parent_id) {
                    break;
                }
                $current = User::find($current->parent_id);
            }
            return $requester->parent_id ?: null;
        }

        $approver = DB::table('users')
            ->join('process_step_user', 'users.id', '=', 'process_step_user.user_id')
            ->where('process_step_user.process_step_id', $step->id)
            ->select('users.id')
            ->first();
        return $approver->id ?? null;
    }
}


