<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentSequence extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'prefix',
        'suffix',
        'sequence_type', // manual, auto
        'module', // sales, purchase, etc
        'document_type', // invoice, order, etc
        'starting_number',
        'current_number',
        'increment_by',
        'padding_length',
        'is_active',
        'fiscal_year',
        'format_pattern',
        'branch_id',
        'company_id'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'starting_number' => 'integer',
        'current_number' => 'integer',
        'increment_by' => 'integer',
        'padding_length' => 'integer'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
