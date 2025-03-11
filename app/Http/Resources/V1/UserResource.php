<?php

namespace App\Http\Resources\V1;

use App\Http\Controllers\Api\V1\UserController;
use App\Models\Designation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
//        return parent::toArray($request);
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'hierarchy_level' => $this->hierarchy_level,
            'designation_id' => $this->designation_id,
            'company_id' => $this->company_id,
            'department_id' => $this->department_id,
            'branch_id' => $this->branch_id,
            'firstname' => $this->firstname,
            'lastname' => $this->lastname,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'landline' => $this->landline,
            'mobile' => $this->mobile,
            'is_salesman_linked' => $this->is_salesman_linked,
            'language' => $this->language,
            'attachment' => $this->attachment,
            'designation' => Designation::find($this->designation_id),
            'roles' => $this->roles->pluck('name'),
            'permissions' => $this->getAllPermissions()->pluck('name'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'department' => $this->department ? $this->department->name : null,
        ];
    }
}
