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
            'address' => $this->address,
            'website' => $this->website,
            'country' => $this->country,
            'city' => $this->city,
            'postal_code' => $this->postal_code,
            'bank' => $this->bank,
            'branch' => $this->branch,
            'swift' => $this->swift,
            'account_name' => $this->account_name,
            'account_no' => $this->account_no,
            'iban' => $this->iban,
            'license_no' => $this->license_no,
            'var' => $this->var,
            'cr_no' => $this->cr_no,
            'logo_path' => $this->logo_path ? Storage::url($this->logo_path) : null,
            'stamp_path' => $this->stamp_path ? Storage::url($this->stamp_path) : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Include related resources when requested
            // 'users' => UserResource::collection($this->whenLoaded('users')),
            // 'departments' => DepartmentResource::collection($this->whenLoaded('departments')),
            // 'branches' => BranchResource::collection($this->whenLoaded('branches')),
        ];
    }
}
