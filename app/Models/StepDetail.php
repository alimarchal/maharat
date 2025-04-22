<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StepDetail extends Model
{
    /** @use HasFactory<\Database\Factories\StepDetailFactory> */
    use HasFactory;
    protected $fillable = ['manual_step_id', 'content', 'order'];

    public function step()
    {
        return $this->belongsTo(ManualStep::class);
    }
}
