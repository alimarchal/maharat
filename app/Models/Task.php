<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'process_step_id',
        'process_id',
        'assigned_at',
        'deadline',
        'urgency',
        'assigned_user_id',
        'read_status',
        'tasks'
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'deadline' => 'datetime',
        'read_status' => 'datetime'
    ];

    public function processStep(): BelongsTo
    {
        return $this->belongsTo(ProcessStep::class);
    }

    public function process(): BelongsTo
    {
        return $this->belongsTo(Process::class, 'process_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function descriptions(): HasMany
    {
        return $this->hasMany(TaskDescription::class);
    }
}
