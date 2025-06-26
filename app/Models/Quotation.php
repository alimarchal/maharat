<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Quotation extends Model
{
    /** @use HasFactory<\Database\Factories\QuotationFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'rfq_id',
        'supplier_id',
        'quotation_number',
        'issue_date',
        'valid_until',
        'total_amount',
        'vat_amount',
        'status_id',
        'terms_and_conditions',
        'notes'
    ];

    protected $casts = [
        'issue_date' => 'date',
        'valid_until' => 'date',
        'total_amount' => 'decimal:2',
        'vat_amount' => 'decimal:2'
    ];

    public function rfq()
    {
        return $this->belongsTo(Rfq::class, 'rfq_id', 'id'); // Correct reference to primary key
    }


    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(QuotationDocument::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(Status::class);
    }
}
