<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChartOfAccount extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'parent_id',
        'account_code_id',
        'account_name',
        'is_active',
        'description',
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function accountCode(): BelongsTo
    {
        return $this->belongsTo(AccountCode::class);
    }

    /**
     * Get the parent account that owns the account.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'parent_id');
    }

    /**
     * Get the child accounts for the account.
     */
    public function children(): HasMany
    {
        return $this->hasMany(ChartOfAccount::class, 'parent_id');
    }

    /**
     * Get all descendants of the account.
     */
    public function descendants(): HasMany
    {
        return $this->children()->with('descendants');
    }

    /**
     * Get all ancestors of the account.
     */
    public function ancestors(): BelongsTo
    {
        return $this->parent()->with('ancestors');
    }
}
