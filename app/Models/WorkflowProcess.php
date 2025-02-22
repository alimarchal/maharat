<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\{SoftDeletes, Builder};

/**
 * WorkflowProcess Model
 * Manages workflow process definitions and configurations
 */
class WorkflowProcess extends Model
{
    use SoftDeletes; // Enables soft delete functionality

    /**
     * Mass assignable attributes
     */
    protected $fillable = [
        'user_id',                  // User assigned to workflow
        'name',                     // Process name (e.g., "Purchase Approval")
        'code',                     // Unique identifier code
        'description',              // Process description
        'order',                    // Step sequence number
        'workflow_type_id',         // Type reference from status table
        'conditions',               // JSON conditions for workflow rules
        'notification_settings',    // JSON notification configurations
        'approval_timeout',         // Hours before escalation
        'escalation_user_id',       // User for escalations
        'requires_attachment',      // Whether attachments are mandatory
        'is_active',               // Process active status
        'company_id'               // Organization context
    ];

    /**
     * Attribute type casting
     */
    protected $casts = [
        'conditions' => 'json',             // Workflow conditions as JSON
        'notification_settings' => 'json',  // Notification rules as JSON
        'requires_attachment' => 'boolean', // Attachment flag as boolean
        'is_active' => 'boolean'           // Active status as boolean
    ];

    /**
     * Primary user relationship (assigned user)
     */
    public function user() {
        return $this->belongsTo(User::class);
    }

    /**
     * Escalation user relationship
     */
//    public function escalationUser() {
//        return $this->belongsTo(User::class, 'escalation_user_id');
//    }

    /**
     * Workflow type relationship from status table
     */
    public function workflowType() {
        return $this->belongsTo(Status::class, 'workflow_type_id');
    }

    /**
     * Related workflow approvals
     */
    public function approvals() {
        return $this->hasMany(WorkflowApproval::class);
    }

    /**
     * Scope for active processes only
     */
    public function scopeActive(Builder $query) {
        return $query->where('is_active', true);
    }

    /**
     * Scope for filtering by workflow type
     */
    public function scopeByType(Builder $query, $typeId) {
        return $query->where('workflow_type_id', $typeId);
    }
}
