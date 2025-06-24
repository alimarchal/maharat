<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Storage;

class ItemRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'quantity',
        'photo',
        'description',
        'user_id',
        'status',
        'approved_by',
        'product_id',
        'approved_at',
        'rejection_reason',
        'is_added',
        'is_requested'
    ];

    protected $casts = [
        'is_added' => 'boolean',
        'is_requested' => 'boolean',
        'quantity' => 'integer',
        'approved_at' => 'datetime'
    ];

    protected $appends = ['photo_url'];

    protected $attributes = [
        'is_added' => false,
        'is_requested' => false,
        'status' => 'Pending'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Helper methods for status checking
    public function isPending()
    {
        return $this->status === 'Pending';
    }

    public function isApproved()
    {
        return $this->status === 'Approved';
    }

    public function isRejected()
    {
        return $this->status === 'Rejected';
    }

    protected function isAdded(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => (bool) $value,
            set: fn ($value) => $value === true || $value === 'true'
        );
    }

    protected function photoUrl(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (!$this->photo) {
                    return null;
                }
                return asset('storage/' . $this->photo);
            }
        );
    }
}
