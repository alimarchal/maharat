<?php

namespace App\Http\Resources\V1;

use App\Models\MaterialRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'process_step_id' => $this->process_step_id,
            'process_id' => $this->process_id,
            'assigned_at' => $this->assigned_at?->toISOString(),
            'deadline' => $this->deadline?->toISOString(),
            'urgency' => $this->urgency,
            'status' => $this->status,
            'order_no' => $this->order_no,
            'assigned_from_user_id' => $this->assigned_from_user_id,
            'assigned_to_user_id' => $this->assigned_to_user_id,
            'read_status' => $this->read_status?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Include related resources when loaded
            'process_step' => $this->whenLoaded('processStep'),
            'process' => $this->whenLoaded('process'),
            'assigned_from_user' => new UserResource($this->whenLoaded('assignedFromUser')),
            'assigned_to_user' => new UserResource($this->whenLoaded('assignedToUser')),
            'descriptions' => TaskDescriptionResource::collection($this->whenLoaded('descriptions')),

            'material_request' => new MaterialRequestResource($this->whenLoaded('material_request')),
            'rfq' => new RfqResource($this->whenLoaded('rfq')),
            'purchase_order' => new PurchaseOrderResource($this->whenLoaded('purchase_order')),
            'payment_order' => new PaymentOrderResource($this->whenLoaded('payment_order')),
            'invoice' => new InvoiceResource($this->whenLoaded('invoice')),
        ];
    }
}
