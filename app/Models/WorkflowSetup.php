<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkflowSetup extends Model
{
    /** @use HasFactory<\Database\Factories\WorkflowSetupFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'workflow_steps',
        'is_active',
        'company_id'
    ];

    protected $casts = [
        'workflow_steps' => 'json',
        'is_active' => 'boolean'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function levels()
    {
        return $this->belongsToMany(Level::class, 'workflow_level', 'workflow_id', 'level_id')
            ->withPivot('order')
            ->orderBy('order');
    }
}
