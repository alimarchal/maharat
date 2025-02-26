<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CompanyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'name_ar' => $this->name_ar,
            'email' => $this->email,
            'contact_number' => $this->contact_number,
            'fax' => $this->fax,
            'country' => $this->country,
            'city' => $this->city,
            'states_provinces' => $this->states_provinces,
            'district' => $this->district,
            'postal_code' => $this->postal_code,
            'street_name' => $this->street_name,
            'additional_street' => $this->additional_street,
            'building_number' => $this->building_number,
            'additional_number' => $this->additional_number,
            'short_address' => $this->short_address,
            'business_category' => $this->business_category,
            'id_type' => $this->id_type,
            'id_number' => $this->id_number,
            'logo_path' => \Storage::url($this->logo_path),
            'stamp_path' => Storage::url($this->stamp_path),
            'website' => $this->website,
            'fiscal_year_start' => $this->fiscal_year_start ? $this->fiscal_year_start->format('Y-m-d') : null,
            'fiscal_year_end' => $this->fiscal_year_end ? $this->fiscal_year_end->format('Y-m-d') : null,
            'price_decimals' => $this->price_decimals,
            'quantity_decimals' => $this->quantity_decimals,
            'amount_decimals' => $this->amount_decimals,
            'gazt_amount_decimals' => $this->gazt_amount_decimals,
            'currency' => $this->currency,
            'timezone' => $this->timezone,
            'session_expired_time' => $this->session_expired_time,
            'stop_login' => $this->stop_login,
            'loyalty_use_phone_as_card' => $this->loyalty_use_phone_as_card,
            'zatca_environment' => $this->zatca_environment,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Include related resources when requested
//            'users' => UserResource::collection($this->whenLoaded('users')),
//            'departments' => DepartmentResource::collection($this->whenLoaded('departments')),
//            'branches' => BranchResource::collection($this->whenLoaded('branches')),
        ];
    }
}
