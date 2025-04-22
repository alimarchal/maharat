<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StepAction extends Model
{
    /** @use HasFactory<\Database\Factories\StepActionFactory> */
    use HasFactory;
    protected $fillable = [
        'manual_step_id', 'action_type', 'label',
        'url_or_action', 'style', 'order'
    ];

    public function step()
    {
        return $this->belongsTo(ManualStep::class);
    }
}
