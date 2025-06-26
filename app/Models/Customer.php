<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'commercial_registration_number',
        'vat_number', 
        'tax_group_registration_number',
        'cr_no', 
        'contact_number',
        'additional_number',
        'client_code',
        'license_number',
        'type',
        'is_limited',
    
        // Address fields
        'address', 
        'zip_code',
        'country_code',
    
        // Bank account fields
        'account_name',
        'representative_name',
        'account_number',
        'iban',
        'swift_code',
        'bank_name',
        'branch_name',
        'bank_currency', 
    
        // Payment method
        'preferred_payment_method',
    
        // Tax information
        'default_tax_rate',
        'is_tax_exempt'
    ];
    
    protected $casts = [
        'is_limited' => 'boolean',
        'is_tax_exempt' => 'boolean',
        'default_tax_rate' => 'decimal:2',
    ];
    
    /**
     * Get the invoices where this customer is the vendor.
     */
    public function sentInvoices()
    {
        return $this->hasMany(Invoice::class, 'vendor_id');
    }
    
    /**
     * Get the invoices where this customer is the client.
     */
    public function receivedInvoices()
    {
        return $this->hasMany(Invoice::class, 'client_id');
    }
    
}
