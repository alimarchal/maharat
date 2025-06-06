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
        'is_added'
    ];

    protected $casts = [
        'is_added' => 'boolean',
        'quantity' => 'integer'
    ];

    protected $appends = ['photo_url'];

    protected $attributes = [
        'is_added' => false
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
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
