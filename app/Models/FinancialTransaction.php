<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinancialTransaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'account_code_id',
        'chart_of_account_id',
        'account_id',
        'department_id',
        'cost_center_id',
        'sub_cost_center_id',
        'transaction_date',
        'entry_type',
        'status',
        'fiscal_period_id',
        'reference_number',
        'amount',
        'description',
        'created_by',
        'updated_by',
        'approved_by',
        'approved_at',
        'posted_at'
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'amount' => 'decimal:2',
        'approved_at' => 'datetime',
        'posted_at' => 'datetime'
    ];

    // Relationships
    public function accountCode()
    {
        return $this->belongsTo(AccountCode::class);
    }

    public function chartOfAccount()
    {
        return $this->belongsTo(ChartOfAccount::class);
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function costCenter()
    {
        return $this->belongsTo(CostCenter::class);
    }

    public function subCostCenter()
    {
        return $this->belongsTo(CostCenter::class, 'sub_cost_center_id');
    }

    public function fiscalPeriod()
    {
        return $this->belongsTo(FiscalPeriod::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
