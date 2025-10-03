<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class GrnApprovalTransaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'grn_id',
        'requester_id',
        'assigned_to',
        'referred_to',
        'order',
        'description',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'order' => 'integer',
        'status' => 'string',
    ];

    public function grn(): BelongsTo
    {
        return $this->belongsTo(Grn::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function referredTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
