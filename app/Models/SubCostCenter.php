<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubCostCenter extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'cost_center_id',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }

    public function rfqs(): HasMany
    {
        return $this->hasMany(Rfq::class, 'sub_cost_center_id');
    }
} 