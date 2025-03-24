<?php

namespace App\Models;

use App\Traits\UserTracking;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExternalDeliveryNote extends Model
{
    use HasFactory;
    use UserTracking;


    protected $fillable = [
        'user_id',
        'grn_id',
        'purchase_order_id',
        'delivery_note_number',
        'attachment_path',
    ];

    /**
     * Get the user who created this delivery note.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the goods received note associated with this delivery note.
     */
    public function grn(): BelongsTo
    {
        return $this->belongsTo(Grn::class);
    }

    /**
     * Get the purchase order associated with this delivery note.
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
}
