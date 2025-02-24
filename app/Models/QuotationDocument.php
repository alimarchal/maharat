<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class QuotationDocument extends Model
{
    /** @use HasFactory<\Database\Factories\QuotationDocumentFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'quotation_id',
        'file_path',
        'original_name',
        'type'
    ];

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

}
