<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Currency extends Model
{
    /** @use HasFactory<\Database\Factories\CurrencyFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'fraction_name',
        'rate',
        'last_updated_at',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'rate' => 'decimal:6',
        'last_updated_at' => 'datetime'
    ];

    public function countries()
    {
        return $this->hasMany(Country::class);
    }
}
