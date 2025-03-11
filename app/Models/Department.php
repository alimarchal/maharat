<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'departments';

    protected $fillable = [
        'parent_id',
        'name',
        'code',
        'is_active',
        'company_id'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the parent department
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'department_id');
    }


    /**
     * Get the child departments
     */
    public function children(): HasMany
    {
        return $this->hasMany(Department::class, 'parent_id');
    }

    /**
     * Get all descendants (recursive children)
     */
    public function descendants(): HasMany
    {
        return $this->children()->with('descendants');
    }

    /**
     * Get the company that owns the department
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
