<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * WorkflowApprovalHistory Model
 * Tracks changes and actions in approval process
 */
class WorkflowApprovalHistory extends Model
{
    /**
     * Mass assignable attributes
     */
    protected $fillable = [
        'workflow_approval_id', // Related approval
        'user_id',            // User who made change
        'action',            // Type of action taken
        'status',           // Status after change
        'remarks',         // Change comments
        'changes',        // JSON of changes
        'ip_address',    // User IP address
        'user_agent'    // Browser information
    ];

    /**
     * Attribute type casting
     */
    protected $casts = [
        'changes' => 'json'  // Changes data as JSON
    ];

    /**
     * Parent approval relationship
     */
    public function approval() {
        return $this->belongsTo(WorkflowApproval::class, 'workflow_approval_id');
    }

    /**
     * User who made the change
     */
    public function user() {
        return $this->belongsTo(User::class);
    }
}
