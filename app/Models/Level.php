<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Level extends Model
{
    /** @use HasFactory<\Database\Factories\LevelFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'level_code',
        'level_order',
        'users',
        'permissions',
        'company_id'
    ];

    protected $casts = [
        'users' => 'json',
        'permissions' => 'json'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function workflows()
    {
        return $this->belongsToMany(WorkflowSetup::class, 'workflow_level', 'level_id', 'workflow_id')
            ->withPivot('order')
            ->orderBy('order');
    }
}
