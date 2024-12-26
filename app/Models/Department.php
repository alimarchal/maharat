<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    /** @use HasFactory<\Database\Factories\DepartmentFactory> */
    use HasFactory;
    protected $fillable = ['name', 'code', 'is_active', 'company_id'];
    protected $casts = ['is_active' => 'boolean'];

}
