<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'email_type',
        'subject',
        'content_summary',
        'recipient_user_id',
        'recipient_email',
        'recipient_name',
        'triggered_by_user_id',
        'task_id',
        'material_request_id',
        'rfq_id',
        'purchase_order_id',
        'payment_order_id',
        'invoice_id',
        'budget_id',
        'request_budget_id',
        'status',
        'error_message',
        'mail_provider',
        'message_id',
        'metadata',
        'notes',
        'sent_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'sent_at' => 'datetime',
    ];

    // Relationships
    public function recipientUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }

    public function triggeredByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by_user_id');
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function materialRequest(): BelongsTo
    {
        return $this->belongsTo(MaterialRequest::class);
    }

    public function rfq(): BelongsTo
    {
        return $this->belongsTo(Rfq::class);
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function paymentOrder(): BelongsTo
    {
        return $this->belongsTo(PaymentOrder::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function budget(): BelongsTo
    {
        return $this->belongsTo(Budget::class);
    }

    public function requestBudget(): BelongsTo
    {
        return $this->belongsTo(RequestBudget::class);
    }

    // Scopes for easy querying
    public function scopeByType($query, $type)
    {
        return $query->where('email_type', $type);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByRecipient($query, $userId)
    {
        return $query->where('recipient_user_id', $userId);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeSent($query)
    {
        return $query->where('status', 'sent');
    }

    // Helper methods
    public function markAsSent($messageId = null)
    {
        $this->update([
            'status' => 'sent',
            'sent_at' => now(),
            'message_id' => $messageId,
        ]);
    }

    public function markAsFailed($errorMessage)
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
        ]);
    }

    public function getRelatedRecordAttribute()
    {
        if ($this->task_id) return $this->task;
        if ($this->material_request_id) return $this->materialRequest;
        if ($this->rfq_id) return $this->rfq;
        if ($this->purchase_order_id) return $this->purchaseOrder;
        if ($this->payment_order_id) return $this->paymentOrder;
        if ($this->invoice_id) return $this->invoice;
        if ($this->budget_id) return $this->budget;
        if ($this->request_budget_id) return $this->requestBudget;
        
        return null;
    }
}
