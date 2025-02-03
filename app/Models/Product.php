<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    /** @use HasFactory<\Database\Factories\ProductFactory> */
    use HasFactory;

    public function category() {
        return $this->belongsTo(ProductCategory::class);
    }

    public function inventories() {
        return $this->hasMany(Inventory::class);
    }

    public function transactions() {
        return $this->hasMany(InventoryTransaction::class);
    }
}
