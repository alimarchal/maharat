<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StepScreenshot extends Model
{
    /** @use HasFactory<\Database\Factories\StepScreenshotFactory> */
    use HasFactory;
    
    protected $fillable = [
        'manual_step_id', 'screenshot_path', 'screenshot_url', 
        'alt_text', 'caption', 'type', 'order',
        'file_name', 'mime_type', 'size'
    ];

    public function step()
    {
        return $this->belongsTo(ManualStep::class, 'manual_step_id');
    }
}
