<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'file_path',
        'original_name',
        'type',
    ];

    /**
     * Get the invoice that owns the document.
     */
    public function invoice()
    {
        return $this->belongsTo(ExternalInvoice::class, 'invoice_id');
    }
}
