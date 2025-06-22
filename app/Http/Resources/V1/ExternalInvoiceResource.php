<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExternalInvoiceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Create virtual documents array from attachment fields
        $documents = [];
        if ($this->attachment_path) {
            $documents[] = [
                'file_path' => $this->attachment_path,
                'original_name' => $this->original_name,
            ];
        }

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'purchase_order_id' => $this->purchase_order_id,
            'supplier_id' => $this->supplier_id,
            'invoice_id' => $this->invoice_id,
            'amount' => $this->amount,
            'vat_amount' => $this->vat_amount,
            'total_amount' => $this->total_amount,
            'status' => $this->status,
            'type' => $this->type,
            'payable_date' => $this->payable_date?->format('Y-m-d'),
            'attachment_path' => $this->attachment_path,
            'original_name' => $this->original_name,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,

            // Include related resources when loaded
            'user' => new UserResource($this->whenLoaded('user')),
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'purchase_order' => new PurchaseOrderResource($this->whenLoaded('purchaseOrder')),
            'documents' => $documents,
        ];
    }
}
