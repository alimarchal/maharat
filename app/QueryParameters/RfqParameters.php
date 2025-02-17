<?php

namespace App\QueryParameters;
class RfqParameters
{
    public const ALLOWED_FILTERS = [
        'rfq_number',
        'organization_name',
        'organization_email',
        'city',
        'request_date',
        'expected_delivery_date',
        'status_id',
        'request_type',
        'payment_type',
        'quotation_sent',
        'requester_id',
        'company_id',
        'warehouse_id',
    ];

    public const ALLOWED_SORTS = [
        'rfq_number',
        'organization_name',
        'request_date',
        'expected_delivery_date',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [
        'requester',
        'company',
        'warehouse',
        'status',
        'requestType',
        'paymentType',
        'items',
        'items.category',
        'items.unit',
        'items.status',
        'statusLogs',
        'statusLogs.changedBy',
    ];
}
