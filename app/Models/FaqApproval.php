<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FaqApproval extends Model
{
    use HasFactory;

    protected $table = 'faqs_approval';

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'screenshots',
        'status'
    ];

    protected $casts = [
        'screenshots' => 'array'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
} 