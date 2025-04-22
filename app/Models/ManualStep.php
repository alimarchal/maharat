<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ManualStep extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_manual_id', 'step_number', 'title',
        'description', 'action_type', 'order', 'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'step_number' => 'integer',
        'order' => 'integer',
    ];

    public function userManual(): BelongsTo
    {
        return $this->belongsTo(UserManual::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(StepDetail::class)->orderBy('order');
    }

    public function screenshots(): HasMany
    {
        return $this->hasMany(StepScreenshot::class)->orderBy('order');
    }

    public function actions(): HasMany
    {
        return $this->hasMany(StepAction::class)->orderBy('order');
    }
}
