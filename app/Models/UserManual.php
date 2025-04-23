<?php

namespace App\Models;

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserManual extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title', 'slug', 'video_path', 'video_type',
        'is_active', 'created_by', 'updated_by',
        'card_id'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function steps(): HasMany
    {
        return $this->hasMany(ManualStep::class)->orderBy('step_number');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function card(): BelongsTo
    {
        return $this->belongsTo(Card::class);
    }
}
