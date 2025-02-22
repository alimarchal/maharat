<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * WorkflowApproval Model
 * Handles individual approval instances and their states
 */
class WorkflowApproval extends Model
{
    use SoftDeletes; // Enables soft delete functionality

    /**
     * Mass assignable attributes
     */
    protected $fillable = [
        'approvable_type',      // Polymorphic model type
        'approvable_id',        // Polymorphic model ID
        'workflow_process_id',  // Related workflow process
        'approver_id',         // Assigned approver
        'status',             // Current approval status
        'comments',           // Approval comments
        'attachments',        // JSON array of attachments
        'approval_data',      // Additional metadata
        'due_date',          // Approval deadline
        'action_taken_at',   // Last action timestamp
        'company_id'         // Organization context
    ];

    /**
     * Attribute type casting
     */
    protected $casts = [
        'attachments' => 'json',          // Attachment data as JSON
        'approval_data' => 'json',        // Additional data as JSON
        'due_date' => 'datetime',         // Due date as datetime
        'action_taken_at' => 'datetime'   // Action time as datetime
    ];

    /**
     * Polymorphic relationship to approvable model
     */
    public function approvable() {
        return $this->morphTo();
    }

    /**
     * Workflow process relationship
     */
    public function process() {
        return $this->belongsTo(WorkflowProcess::class, 'workflow_process_id');
    }

    /**
     * Approver user relationship
     */
    public function approver() {
        return $this->belongsTo(User::class, 'approver_id');
    }

    /**
     * Approval history records
     */
    public function history() {
        return $this->hasMany(WorkflowApprovalHistory::class);
    }

    /**
     * Scope for pending approvals
     */
    public function scopePending(Builder $query) {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for overdue approvals
     */
    public function scopeOverdue(Builder $query) {
        return $query->where('status', 'pending')
            ->whereNotNull('due_date')
            ->where('due_date', '<', now());
    }

    /**
     * Scope for filtering by status
     */
    public function scopeByStatus(Builder $query, $status) {
        return $query->where('status', $status);
    }
}
