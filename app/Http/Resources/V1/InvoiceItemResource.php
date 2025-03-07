<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'name' => $this->name,
            'description' => $this->description,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'tax_rate' => $this->tax_rate,
            'tax_amount' => $this->tax_amount,
            'subtotal' => $this->subtotal,
            'total' => $this->total,
            'identification' => $this->identification,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
