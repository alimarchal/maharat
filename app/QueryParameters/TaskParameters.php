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
            AllowedFilter::exact('request_budgets_id'),
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
        'request_budgets_id',
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
        'material_request.items',
        'material_request.items.product',
        'material_request.items.unit',
        'material_request.items.category',
        'material_request.items.urgencyStatus',
        'material_request.requester',
        'material_request.warehouse',
        'material_request.department',
        'material_request.costCenter',
        'rfq',
        'rfq.items',
        'rfq.items.product',
        'rfq.items.unit',
        'rfq.items.category',
        'rfq.user',
        'rfq.warehouse',
        'rfq.department',
        'rfq.costCenter',
        'purchase_order',
        'purchase_order.items',
        'purchase_order.items.product',
        'purchase_order.items.unit',
        'purchase_order.supplier',
        'purchase_order.user',
        'purchase_order.currency',
        'payment_order',
        'payment_order.supplier',
        'payment_order.user',
        'payment_order.currency',
        'invoice',
        'invoice.items',
        'invoice.client',
        'invoice.representative',
        'budget',
        'budget.department',
        'budget.costCenter',
        'budget_approval_transaction',
        'request_budget',
        'request_budget.department',
        'request_budget.costCenter',
    ];
}
