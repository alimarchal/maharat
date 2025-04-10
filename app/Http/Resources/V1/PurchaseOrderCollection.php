<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class PurchaseOrderCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @return array<int|string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection->map(function ($item) {
                return [
                    'id' => $item->id,
                    'purchase_order_no' => $item->purchase_order_no,
                    'company_name' => $item->company_name,
                    'issue_date' => $item->issue_date,
                    'expiry_date' => $item->expiry_date,
                    'amount' => $item->amount,
                    'attachment' => $item->attachment,
                    'quotation_id' => $item->quotation_id,
                    'has_purchase_order' => 1, // Since this is a purchase order collection, all items have purchase orders
                ];
            }),
            'meta' => [
                'current_page' => $this->currentPage(),
                'last_page' => $this->lastPage(),
                'per_page' => $this->perPage(),
                'total' => $this->total(),
            ],
        ];
    }
}
