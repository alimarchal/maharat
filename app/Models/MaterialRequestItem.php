<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;

class MaterialRequestItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'material_request_id',
        'product_id',
        'unit_id',
        'category_id',
        'quantity',
        'urgency',
        'description',
        'photo',
    ];

    protected $appends = ['photo_url'];

    public function materialRequest(): BelongsTo
    {
        return $this->belongsTo(MaterialRequest::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function urgencyStatus(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'urgency');
    }

    protected function photoUrl(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (!$this->photo) {
                    return null;
                }
                // If photo already has a path, use it as is
                if (str_contains($this->photo, '/')) {
                    return asset('storage/' . $this->photo);
                }
                // If photo is just a filename, assume it's in material-request-items folder
                return asset('storage/material-request-items/' . $this->photo);
            }
        );
    }
}
