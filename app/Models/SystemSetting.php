<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'group',
        'type',
        'description',
        'is_public',
        'autoload',
        'company_id'
    ];

    protected $casts = [
        'value' => 'json',
        'is_public' => 'boolean',
        'autoload' => 'boolean'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
