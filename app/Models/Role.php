<?php

namespace App\Models;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    protected $fillable = ['name', 'guard_name', 'parent_role_id'];

    public function parent()
    {
        return $this->belongsTo(Role::class, 'parent_role_id');
    }

    public function children()
    {
        return $this->hasMany(Role::class, 'parent_role_id');
    }

    public function allChildren()
    {
        return $this->children()->with('allChildren');
    }

    public function allParents()
    {
        return $this->parent()->with('allParents');
    }

    public function subordinates()
    {
        return $this->allChildren()->pluck('id')->push($this->id);
    }

    public function superiors()
    {
        return $this->allParents()->pluck('id')->push($this->id);
    }
}
