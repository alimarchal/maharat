<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaterialRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'requester_id',
        'warehouse_id',
        'expected_delivery_date',
        'status_id',
    ];

    protected $casts = [
        'expected_delivery_date' => 'date',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'status_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(MaterialRequestItem::class);
    }
}
