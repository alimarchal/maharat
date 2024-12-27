<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sms extends Model
{
    /** @use HasFactory<\Database\Factories\SmsFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'template_name',
        'template_code',
        'content',
        'type',
        'placeholders',
        'recipients',
        'sender_id',
        'status',
        'retry_attempts',
        'validity_period',
        'company_id',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'placeholders' => 'json',
        'recipients' => 'json',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
