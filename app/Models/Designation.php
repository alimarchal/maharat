<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Designation extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Get the users with this designation.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'designation'
    ];

    /**
     * The relationships that should always be loaded.
     *
     * @var array
     */
    protected $with = [];


}
