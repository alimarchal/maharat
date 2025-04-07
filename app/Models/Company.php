<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
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
        'vat_no',
        'cr_no',
        'currency_id',
        'logo_path',
        'stamp_path',
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = true;

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = [
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    // Relationships - add as needed
    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function rfqs()
    {
        return $this->hasMany(RFQ::class, 'company_id');
    }

    public function departments()
    {
        return $this->hasMany(Department::class);
    }

    public function branches()
    {
        return $this->hasMany(Branch::class);
    }

    public function currency()
    {
        return $this->belongsTo(Currency::class);
    }
}
