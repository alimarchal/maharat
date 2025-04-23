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

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'order' => 'integer',
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array
     */
    protected $attributes = [
        'style' => 'default',
    ];

    /**
     * Get the step that owns the action.
     */
    public function step()
    {
        return $this->belongsTo(ManualStep::class, 'manual_step_id');
    }
}
