<?php

namespace App\QueryParameters;
use Spatie\QueryBuilder\AllowedFilter;


class TaskParameters
{
    const ALLOWED_FILTERS = [
        'process_step_id',
        'process_id',
        'urgency',
        'assigned_at',
        'deadline',
        'read_status',
        'created_at',
        'status',
    ];

    public static function getAllFilters()
    {
        return [
            // Regular partial match filters
            ...self::ALLOWED_FILTERS,

            // Exact match filters
            AllowedFilter::exact('process_step_id'),
            AllowedFilter::exact('process_id'),
            AllowedFilter::exact('assigned_from_user_id'),
            AllowedFilter::exact('assigned_to_user_id'),
            AllowedFilter::exact('material_request_id'),
            AllowedFilter::exact('rfq_id'),
            AllowedFilter::exact('purchase_order_id'),
            AllowedFilter::exact('payment_order_id'),
            AllowedFilter::exact('invoice_id'),
            AllowedFilter::exact('budget_id'),
            AllowedFilter::exact('budget_approval_transaction_id'),
            AllowedFilter::exact('request_budget_id'),
        ];
    }



    const ALLOWED_SORTS = [
        'id',
        'process_step_id',
        'process_id',
        'assigned_at',
        'deadline',
        'urgency',
        'assigned_from_user_id',
        'assigned_to_user_id',
        'material_request_id',
        'rfq_id',
        'purchase_order_id',
        'payment_order_id',
        'invoice_id',
        'budget_id',
        'budget_approval_transaction_id',
        'request_budget_id',
        'read_status',
        'created_at',
        'updated_at',
        'status',
    ];

    const ALLOWED_INCLUDES = [
        'processStep',
        'process',
        'assignedFromUser',
        'assignedToUser',
        'descriptions',
        'material_request',
        'rfq',
        'purchase_order',
        'payment_order',
        'invoice',
        'budget',
        'budget_approval_transaction',
        'request_budget',
    ];
}
