<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warehouse extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'address',
        'latitude',
        'longitude',
        // Remove manager_id as it doesn't exist in the schema
    ];

    /**
     * Get all managers for this warehouse
     */
    public function warehouseManagers(): HasMany
    {
        return $this->hasMany(WarehouseManager::class);
    }

    /**
     * Get the primary manager relationship for this warehouse
     * This is what will be loaded when including 'manager'
     */
    public function manager()
    {
        return $this->hasOne(WarehouseManager::class)->where('type', 'Manager');
    }
}
