<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialRequestTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'material_request_id',
        'order',
        'requester_id',
        'assigned_to',
        'referred_to',
        'description',
        'status'
    ];

    protected $casts = [
        'status' => 'string'
    ];

    public function materialRequest(): BelongsTo
    {
        return $this->belongsTo(MaterialRequest::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function referredUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_to');
    }
}
