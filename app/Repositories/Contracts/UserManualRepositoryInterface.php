<?php
// app/Repositories/Contracts/UserManualRepositoryInterface.php
namespace App\Repositories\Contracts;

interface UserManualRepositoryInterface
{
    public function getManualWithSteps($id);
    public function getAllManuals();
    public function createManual(array $data);
    public function updateManual($id, array $data);
    public function deleteManual($id);
}
