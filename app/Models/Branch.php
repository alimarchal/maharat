<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    /** @use HasFactory<\Database\Factories\BranchFactory> */
    use HasFactory;

    protected $table = 'branches';

    protected $fillable = ['name', 'code', 'address', 'phone', 'is_active', 'company_id'];
    protected $casts = ['is_active' => 'boolean'];
}
