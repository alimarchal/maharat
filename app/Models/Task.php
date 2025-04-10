<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'process_step_id',
        'process_id',
        'assigned_at',
        'deadline',
        'urgency',
        'order_no',
        'assigned_from_user_id',
        'assigned_to_user_id',
        'material_request_id',
        'rfq_id',
        'purchase_order_id',
        'payment_order_id',
        'budget_id',
        'budget_approval_transaction_id',
        'request_budgets_id',
        'invoice_id',
        'read_status',
        'tasks'
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'deadline' => 'datetime',
        'read_status' => 'datetime'
    ];

    public function processStep(): BelongsTo
    {
        return $this->belongsTo(ProcessStep::class);
    }

    public function process(): BelongsTo
    {
        return $this->belongsTo(Process::class, 'process_id');
    }

    public function assignedFromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_from_user_id');
    }

    public function assignedToUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function descriptions(): HasMany
    {
        return $this->hasMany(TaskDescription::class);
    }


    public function material_request(): BelongsTo
    {
        return $this->belongsTo(MaterialRequest::class);
    }

    public function rfq(): BelongsTo
    {
        return $this->belongsTo(Rfq::class);
    }


    public function purchase_order(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }


    public function payment_order(): BelongsTo
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


    public function budget_approval_transaction(): BelongsTo
    {
        return $this->belongsTo(BudgetApprovalTransaction::class);
    }

    public function request_budget(): BelongsTo
    {
        return $this->belongsTo(RequestBudget::class, 'request_budgets_id');
    }
}
