<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationDocument extends Model
{
    /** @use HasFactory<\Database\Factories\QuotationDocumentFactory> */
    use HasFactory;

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

}
