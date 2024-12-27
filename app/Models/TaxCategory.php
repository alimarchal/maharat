<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaxCategory extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
        'company_id'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function taxGroups()
    {
        return $this->hasMany(TaxGroup::class, 'category_id');
    }
}
