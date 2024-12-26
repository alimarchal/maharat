<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkflowLevel extends Model
{
    /** @use HasFactory<\Database\Factories\WorkflowLevelFactory> */
    use HasFactory;
    protected $fillable = ['workflow_id', 'level_id', 'order', 'conditions'];
    protected $casts = ['conditions' => 'json'];
}
