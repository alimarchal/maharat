<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'invoice_number',
        'vendor_id',
        'client_id',
        'status',
        'payment_method',
        'issue_date',
        'due_date',
        'discounted_days',
        'subtotal',
        'tax_amount',
        'total_amount',
        'currency',
        'notes'
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'discounted_days' => 'integer',
    ];

    /**
     * Get the vendor (customer that issued the invoice).
     */
    public function vendor()
    {
        return $this->belongsTo(Customer::class, 'vendor_id');
    }

    /**
     * Get the client (customer that received the invoice).
     */
    public function client()
    {
        return $this->belongsTo(Customer::class, 'client_id');
    }

    /**
     * Get the items in the invoice.
     */
    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }
}
