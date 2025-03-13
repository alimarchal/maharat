<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'name_ar',
        'email',
        'contact_number',
        'address',
        'website',
        'country',
        'city',
        'postal_code',
        'bank',
        'branch',
        'swift',
        'account_name',
        'account_no',
        'iban',
        'license_no',
        'var',
        'cr_no',
        'logo_path',
        'stamp_path',
    ];

    // Relationships - add as needed
    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function departments()
    {
        return $this->hasMany(Department::class);
    }

    public function branches()
    {
        return $this->hasMany(Branch::class);
    }
}
