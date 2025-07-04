<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'purchase_order_id' => $this->purchase_order_id,
            'cost_center_id' => $this->cost_center_id,
            'sub_cost_center_id' => $this->sub_cost_center_id,
            'payment_order_number' => $this->payment_order_number,
            'date' => $this->date?->toDateString(),
            'issue_date' => $this->issue_date?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'payment_type' => $this->payment_type,
            'total_amount' => $this->total_amount,
            'paid_amount' => $this->paid_amount,
            'status' => $this->status,
            'attachment' => $this->attachment,
            'uploaded_attachment' => $this->uploaded_attachment,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Related resources
            'user' => new UserResource($this->whenLoaded('user')),
            'purchase_order' => new PurchaseOrderResource($this->whenLoaded('purchase_order')),
            'logs' => PaymentOrderLogResource::collection($this->whenLoaded('logs')),

            // Supplier information through the purchase order relation
            'supplier' => $this->whenLoaded('purchase_order', function () {
                return $this->purchase_order->supplier ?
                    new SupplierResource($this->purchase_order->supplier) :
                    null;
            }),

            // Quotation information through the purchase order relation
            'quotation' => $this->whenLoaded('purchase_order', function () {
                return $this->purchase_order->quotation ?
                    new QuotationResource($this->purchase_order->quotation) :
                    null;
            }),
        ];
    }
}
