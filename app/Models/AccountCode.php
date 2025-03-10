<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountCode extends Model
{
    /** @use HasFactory<\Database\Factories\AccountCodeFactory> */
    use HasFactory;

    protected $fillable = [
        'account_code',
        'account_type',
        'is_active',
        'description',
    ];
}
