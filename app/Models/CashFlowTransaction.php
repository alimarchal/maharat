<?php

namespace App\Models;

use App\Traits\UserTracking;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CashFlowTransaction extends Model
{
    /** @use HasFactory<\Database\Factories\CashFlowTransactionFactory> */
    use HasFactory, UserTracking, SoftDeletes;
}
