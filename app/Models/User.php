<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'firstname',
        'designation_id',
        'company_id',
        'department_id',
        'branch_id',
        'parent_id',
        'hierarchy_level',
        'lastname',
        'name',
        'email',
        'password',
        'landline',
        'mobile',
        'is_salesman_linked',
        'language',
        'attachment',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the user's parent/supervisor.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    /**
     * Get the user's direct subordinates.
     */
    public function children(): HasMany
    {
        return $this->hasMany(User::class, 'parent_id');
    }

    /**
     * Get all subordinates (direct and indirect).
     */
    public function allSubordinates()
    {
        return $this->children()->with('allSubordinates');
    }

    /**
     * Get all supervisors up the hierarchy.
     */
    public function allSupervisors()
    {
        return $this->parent()->with('allSupervisors');
    }

    /**
     * Get the designation associated with the user.
     */
    public function designation()
    {
        return $this->belongsTo(Designation::class);
    }


    /**
     * Get the user's complete reporting chain, including the user.
     */
    public function getReportingChain()
    {
        $chain = collect([$this]);
        $currentUser = $this;

        while ($currentUser->parent) {
            $chain->push($currentUser->parent);
            $currentUser = $currentUser->parent;
        }

        return $chain->reverse();
    }

    /**
     * Get the full team structure under this user.
     */
    public function getTeam()
    {
        return self::with('allSubordinates')
            ->where('id', $this->id)
            ->first();
    }

    /**
     * Update hierarchy levels for all subordinates.
     */
    public function updateSubordinateHierarchyLevels()
    {
        $this->children->each(function ($child) {
            $child->hierarchy_level = $this->hierarchy_level + 1;
            $child->save();
            $child->updateSubordinateHierarchyLevels();
        });
    }

    /*
    // Get a user's direct supervisor
        $supervisor = $user->parent;

        // Get all direct subordinates
        $directReports = $user->children;

        // Get entire team (all levels below)
        $fullTeam = $user->getTeam();

        // Get complete reporting chain up to the top
        $reportingChain = $user->getReportingChain();

        // Find all users reporting to a specific manager
        $managersTeam = User::where('parent_id', $managerId)->get();

        // Get users at a specific hierarchy level
        $levelThreeUsers = User::where('hierarchy_level', 3)->get();

     */
}

