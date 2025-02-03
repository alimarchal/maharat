<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    public function reference() {
        return $this->morphTo();
    }

    public function product() {
        return $this->belongsTo(Product::class);
    }

    public function warehouse() {
        return $this->belongsTo(Warehouse::class);
    }
}
