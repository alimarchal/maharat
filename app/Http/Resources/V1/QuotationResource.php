<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuotationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rfq_id' => $this->rfq_id,
            'supplier_id' => $this->supplier_id,
            'quotation_number' => $this->quotation_number,
            'company_name' => $this->rfq ? $this->rfq->organization_name : 'N/A',
            'issue_date' => $this->issue_date,
            'valid_until' => $this->valid_until,
            'total_amount' => $this->total_amount,
            'status_id' => $this->status_id,
            'terms_and_conditions' => $this->terms_and_conditions,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Include related resources when loaded
            'rfq' => new RfqResource($this->whenLoaded('rfq')),
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'status' => new StatusResource($this->whenLoaded('status')),
            'documents' => QuotationDocumentResource::collection($this->documents)
        ];
    }
}
