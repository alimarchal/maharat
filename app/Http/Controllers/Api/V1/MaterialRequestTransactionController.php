<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\MaterialRequestTransaction\StoreMaterialRequestTransactionRequest;
use App\Http\Requests\V1\MaterialRequestTransaction\UpdateMaterialRequestTransactionRequest;
use App\Http\Resources\V1\MaterialRequestTransactionResource;
use App\Models\MaterialRequestTransaction;
use App\QueryParameters\MaterialRequestTransactionParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class MaterialRequestTransactionController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(MaterialRequestTransaction::class)
            ->allowedFilters(MaterialRequestTransactionParameters::ALLOWED_FILTERS)
            ->allowedSorts(MaterialRequestTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(MaterialRequestTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No material request transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return MaterialRequestTransactionResource::collection($transactions);
    }

    public function store(StoreMaterialRequestTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $transaction = MaterialRequestTransaction::create($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Material request transaction created successfully',
                'data' => new MaterialRequestTransactionResource(
                    $transaction->load(['materialRequest', 'requester', 'assignedUser', 'referredUser'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create material request transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $transaction = QueryBuilder::for(MaterialRequestTransaction::class)
            ->allowedIncludes(MaterialRequestTransactionParameters::ALLOWED_INCLUDES)
            ->find($id);

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Resource not found'
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'success' => true,
            'data' => new MaterialRequestTransactionResource($transaction)
        ], Response::HTTP_OK);
    }

    public function update(UpdateMaterialRequestTransactionRequest $request, MaterialRequestTransaction $materialRequestTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $materialRequestTransaction->update($request->validated());

            // If the status is 'Approve', check if this is the final approval
            if ($request->input('status') === 'Approve') {
                $processSteps = DB::table('process_steps')
                    ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                    ->where('processes.title', 'Material Request')
                    ->orderBy('process_steps.order')
                    ->get();
                $totalRequiredApprovals = $processSteps->count();
                $isFinalApproval = $materialRequestTransaction->order == $totalRequiredApprovals;
                if (!$isFinalApproval) {
                    $nextOrder = $materialRequestTransaction->order + 1;
                    $nextStep = $processSteps->where('order', $nextOrder)->first();
                    \Log::info('=== ATTEMPTING TO CREATE NEXT APPROVAL TRANSACTION ===', [
                        'material_request_id' => $materialRequestTransaction->material_request_id,
                        'current_order' => $materialRequestTransaction->order,
                        'next_order' => $nextOrder,
                        'next_step_id' => $nextStep ? $nextStep->id : null,
                        'total_steps' => $totalRequiredApprovals
                    ]);
                    if ($nextStep) {
                        $nextApprover = DB::table('users')
                            ->join('process_step_user', 'users.id', '=', 'process_step_user.user_id')
                            ->where('process_step_user.process_step_id', $nextStep->id)
                            ->select('users.id')
                            ->first();
                        if ($nextApprover) {
                            \Log::info('=== CREATING NEXT APPROVAL TRANSACTION ===', [
                                'material_request_id' => $materialRequestTransaction->material_request_id,
                                'next_order' => $nextOrder,
                                'next_approver_id' => $nextApprover->id
                            ]);
                            $nextTransaction = new 
                                \App\Models\MaterialRequestTransaction([
                                    'material_request_id' => $materialRequestTransaction->material_request_id,
                                    'requester_id' => $materialRequestTransaction->requester_id,
                                    'assigned_to' => $nextApprover->id,
                                    'order' => $nextOrder,
                                    'description' => $nextStep->description,
                                    'status' => 'Pending',
                                    'created_by' => auth()->id(),
                                    'updated_by' => auth()->id()
                                ]);
                            $nextTransaction->save();
                            DB::table('tasks')->insert([
                                'process_step_id' => $nextStep->id,
                                'process_id' => $nextStep->process_id,
                                'assigned_at' => now(),
                                'urgency' => 'Normal',
                                'assigned_to_user_id' => $nextApprover->id,
                                'assigned_from_user_id' => $materialRequestTransaction->requester_id,
                                'read_status' => null,
                                'material_request_id' => $materialRequestTransaction->material_request_id,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);
                        }
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Material request transaction updated successfully',
                'data' => new MaterialRequestTransactionResource(
                    $materialRequestTransaction->load(['materialRequest', 'requester', 'assignedUser', 'referredUser'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update material request transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(MaterialRequestTransaction $materialRequestTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $materialRequestTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'Material request transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete material request transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
