<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RfqStatusLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'rfq_id',
        'status_id',
        'changed_by',
        'remarks',
        'assigned_to',
        'approved_by',
        'rejected_by',
        'rejection_reason',
        'documents',
        'quotation_sent',
    ];

    public function rfq(): BelongsTo
    {
        return $this->belongsTo(Rfq::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(Status::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
