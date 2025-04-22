<?php
// app/Repositories/UserManualRepository.php
namespace App\Repositories;

use App\Repositories\Contracts\UserManualRepositoryInterface;
use App\Models\UserManual;

class UserManualRepository implements UserManualRepositoryInterface
{
    public function getManualWithSteps($id)
    {
        return UserManual::with([
            'steps' => function ($query) {
                $query->orderBy('step_number');
            },
            'steps.details' => function ($query) {
                $query->orderBy('order');
            },
            'steps.screenshots' => function ($query) {
                $query->orderBy('order');
            },
            'steps.actions' => function ($query) {
                $query->orderBy('order');
            }
        ])->findOrFail($id);
    }

    public function getAllManuals()
    {
        return UserManual::where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->paginate(15);
    }

    public function createManual(array $data)
    {
        return UserManual::create($data);
    }

    public function updateManual($id, array $data)
    {
        $manual = UserManual::findOrFail($id);
        $manual->update($data);
        return $manual;
    }

    public function deleteManual($id)
    {
        $manual = UserManual::findOrFail($id);
        return $manual->delete();
    }
}
