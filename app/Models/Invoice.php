<?php

namespace App\Models;

use App\Traits\UserTracking;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;
    use UserTracking;

    protected $fillable = [
        'invoice_number',
        'client_id',
        'paid_amount',
        'status',
        'payment_method',
        'representative_id',
        'representative_email',
        'issue_date',
        'due_date',
        'discounted_days',
        'vat_rate',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'currency',
        'notes',
        'account_code_id'
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'vat_rate' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'discounted_days' => 'integer',
        'client_id' => 'integer',
    ];

    /**
     * Boot method to set default values and prevent updates to certain fields
     */
    protected static function boot()
    {
        parent::boot();

        // Set issue_date to current date when creating
        static::creating(function ($invoice) {
            if (empty($invoice->issue_date)) {
                $invoice->issue_date = now()->toDateString();
            }
        });

        // Prevent issue_date from being updated
        static::updating(function ($invoice) {
            if ($invoice->isDirty('issue_date')) {
                $invoice->issue_date = $invoice->getOriginal('issue_date');
            }
        });
    }

    /**
     * Get the client (customer that received the invoice).
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'client_id');
    }

    public function representative(): BelongsTo
    {
        return $this->belongsTo(User::class, 'representative_id');
    }

    /**
     * Get the items in the invoice.
     */
    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }
}
