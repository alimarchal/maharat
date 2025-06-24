<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Task\StoreTaskRequest;
use App\Http\Requests\V1\Task\UpdateTaskRequest;
use App\Http\Resources\V1\TaskResource;
use App\Http\Resources\V1\TaskCollection;
use App\Models\Task;
use App\Models\TaskDescription;
use App\QueryParameters\TaskParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class TaskController extends Controller
{
    public function index(): JsonResponse
    {
        $tasks = QueryBuilder::for(Task::class)
            ->allowedFilters(TaskParameters::getAllFilters())
            ->allowedSorts(TaskParameters::ALLOWED_SORTS)
            ->allowedIncludes(TaskParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($tasks->isEmpty()) {
            return response()->json([
                'message' => 'No tasks found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return response()->json(new TaskCollection($tasks), Response::HTTP_OK);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $task = Task::create($request->safe()->except('descriptions'));

            // Create task descriptions if provided
            if ($request->has('descriptions')) {
                foreach ($request->input('descriptions') as $description) {
                    $task->descriptions()->create($description);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Task created successfully',
                'data' => new TaskResource($task->load([
                    'processStep',
                    'process',
                    'assignedFromUser',
                    'assignedToUser',
                    'descriptions',
                    'material_request',
                    'rfq',
                    'purchase_order',
                    'payment_order',
                    'invoice',
                    'budget',
                    'budget_approval_transaction',
                    'request_budget',
                ]))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create task',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $task = QueryBuilder::for(Task::class)
            ->allowedIncludes(TaskParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new TaskResource($task)
        ], Response::HTTP_OK);
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        try {
            // Create a custom logger for RFQ status updates
            $rfqLogger = new \Monolog\Logger('rfq_status');
            $rfqLogger->pushHandler(new \Monolog\Handler\StreamHandler(storage_path('logs/rfq_status.log'), \Monolog\Logger::INFO));

            $rfqLogger->info('=== TASK UPDATE STARTED ===', [
                'task_id' => $task->id,
                'rfq_id' => $task->rfq_id,
                'status' => $request->input('status'),
                'request_data' => $request->all()
            ]);

            DB::beginTransaction();

            $task->update($request->validated());

            // Check if this is an RFQ task and if it's being approved
            if ($task->rfq_id && $request->input('status') === 'Approved') {
                $rfqLogger->info('=== RFQ TASK APPROVAL CHECK ===', [
                    'task_id' => $task->id,
                    'rfq_id' => $task->rfq_id,
                    'current_order_no' => $task->order_no,
                    'current_status_id' => DB::table('rfqs')->where('id', $task->rfq_id)->value('status_id')
                ]);

                // Get total number of required approvals for this RFQ
                $totalApprovals = DB::table('tasks')
                    ->where('rfq_id', $task->rfq_id)
                    ->where('process_id', $task->process_id)
                    ->count();

                // Get all tasks for this RFQ to verify
                $allTasks = DB::table('tasks')
                    ->where('rfq_id', $task->rfq_id)
                    ->where('process_id', $task->process_id)
                    ->get();

                $rfqLogger->info('=== RFQ APPROVAL TASKS ===', [
                    'rfq_id' => $task->rfq_id,
                    'total_tasks' => $totalApprovals,
                    'current_task_order_no' => $task->order_no,
                    'all_tasks' => $allTasks->toArray()
                ]);

                // Check if this is the final approval
                $isFinalApproval = $task->order_no === $totalApprovals;

                $rfqLogger->info('=== FINAL APPROVAL CHECK ===', [
                    'rfq_id' => $task->rfq_id,
                    'current_order_no' => $task->order_no,
                    'total_approvals' => $totalApprovals,
                    'is_final_approval' => $isFinalApproval,
                    'current_status_id' => DB::table('rfqs')->where('id', $task->rfq_id)->value('status_id')
                ]);

                if ($isFinalApproval) {
                    $rfqLogger->info('=== FINAL APPROVAL DETECTED - UPDATING RFQ STATUS ===', [
                        'rfq_id' => $task->rfq_id,
                        'current_status_id' => DB::table('rfqs')->where('id', $task->rfq_id)->value('status_id'),
                        'target_status_id' => 47
                    ]);

                    try {
                        // Directly update the RFQ status in the database
                        $updated = DB::table('rfqs')
                            ->where('id', $task->rfq_id)
                            ->update([
                                'status_id' => 47,
                                'approved_at' => now(),
                                'approved_by' => auth()->id(),
                                'updated_at' => now()
                            ]);

                        $rfqLogger->info('=== RFQ STATUS UPDATE RESULT ===', [
                            'rfq_id' => $task->rfq_id,
                            'update_success' => $updated,
                            'rows_affected' => DB::connection()->getPdo()->lastInsertId(),
                            'new_status_id' => DB::table('rfqs')->where('id', $task->rfq_id)->value('status_id')
                        ]);

                        if (!$updated) {
                            $rfqLogger->error('=== RFQ STATUS UPDATE FAILED ===', [
                                'rfq_id' => $task->rfq_id,
                                'current_status_id' => DB::table('rfqs')->where('id', $task->rfq_id)->value('status_id')
                            ]);
                            throw new \Exception('Failed to update RFQ status');
                        }

                        // Create status log entry
                        DB::table('rfq_status_logs')->insert([
                            'rfq_id' => $task->rfq_id,
                            'status_id' => 47,
                            'changed_by' => auth()->id(),
                            'remarks' => 'RFQ Approved and Activated by Final Approver',
                            'approved_by' => auth()->id(),
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);

                        // Verify the update
                        $updatedRfq = DB::table('rfqs')->where('id', $task->rfq_id)->first();
                        $rfqLogger->info('=== RFQ STATUS VERIFICATION ===', [
                            'rfq_id' => $task->rfq_id,
                            'status_id' => $updatedRfq->status_id,
                            'expected_status' => 47,
                            'update_successful' => $updatedRfq->status_id === 47
                        ]);

                        // Refresh the task's RFQ relationship to get the updated status
                        $task->load('rfq');

                    } catch (\Exception $e) {
                        $rfqLogger->error('=== RFQ STATUS UPDATE ERROR ===', [
                            'rfq_id' => $task->rfq_id,
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                        throw $e;
                    }
                } else {
                    $rfqLogger->info('=== NOT FINAL APPROVAL - SKIPPING RFQ STATUS UPDATE ===', [
                        'rfq_id' => $task->rfq_id,
                        'current_order_no' => $task->order_no,
                        'total_approvals' => $totalApprovals,
                        'current_status_id' => DB::table('rfqs')->where('id', $task->rfq_id)->value('status_id')
                    ]);
                }
            }

            // Check if this is an RFQ task and if it's being rejected
            if ($task->rfq_id && $request->input('status') === 'Rejected') {
                $rfqLogger->info('=== RFQ TASK REJECTION CHECK ===', [
                    'task_id' => $task->id,
                    'rfq_id' => $task->rfq_id,
                    'current_status_id' => DB::table('rfqs')->where('id', $task->rfq_id)->value('status_id')
                ]);

                // Update the corresponding approval transaction
                $approvalTransaction = DB::table('rfq_approval_transactions')
                    ->where('rfq_id', $task->rfq_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    $rfqLogger->info('=== UPDATING RFQ APPROVAL TRANSACTION FOR REJECTION ===', [
                        'task_id' => $task->id,
                        'rfq_id' => $task->rfq_id,
                        'approval_transaction_id' => $approvalTransaction->id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('rfq_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Reject',
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    $rfqLogger->info('=== RFQ REJECTION TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'rfq_id' => $task->rfq_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Immediately update RFQ status to Rejected (49)
                        $rfqUpdated = DB::table('rfqs')
                            ->where('id', $task->rfq_id)
                            ->update([
                                'status_id' => 49,
                                'updated_at' => now()
                            ]);

                        $rfqLogger->info('=== RFQ REJECTION STATUS UPDATE RESULT ===', [
                            'task_id' => $task->id,
                            'rfq_id' => $task->rfq_id,
                            'update_success' => $rfqUpdated,
                            'new_status_id' => DB::table('rfqs')->where('id', $task->rfq_id)->value('status_id')
                        ]);

                        // Create status log entry for rejection
                        DB::table('rfq_status_logs')->insert([
                            'rfq_id' => $task->rfq_id,
                            'status_id' => 49,
                            'changed_by' => auth()->id(),
                            'remarks' => 'RFQ Rejected by Approver',
                            'approved_by' => auth()->id(),
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    }
                } else {
                    $rfqLogger->warning('=== NO RFQ APPROVAL TRANSACTION FOUND ===', [
                        'task_id' => $task->id,
                        'rfq_id' => $task->rfq_id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);
                }
            }

            // Check if this is a Maharat Invoice task and if it's being approved
            if ($task->invoice_id && $request->input('status') === 'Approved') {
                Log::info('=== MAHARAT INVOICE TASK APPROVAL CHECK ===', [
                    'task_id' => $task->id,
                    'invoice_id' => $task->invoice_id,
                    'current_order_no' => $task->order_no,
                    'current_status' => DB::table('invoices')->where('id', $task->invoice_id)->value('status')
                ]);

                // Update the corresponding approval transaction
                $approvalTransaction = DB::table('mahrat_invoice_approval_transactions')
                    ->where('invoice_id', $task->invoice_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== UPDATING MAHARAT INVOICE APPROVAL TRANSACTION ===', [
                        'task_id' => $task->id,
                        'invoice_id' => $task->invoice_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('mahrat_invoice_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Approve',
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    Log::info('=== APPROVAL TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'invoice_id' => $task->invoice_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Trigger the budget approval service to update budget status
                        $approvalService = new \App\Services\BudgetApprovalService();
                        $approvalResult = $approvalService->checkApprovalCompletion($task->budget_id, $approvalTransaction->id);
                        
                        Log::info('=== BUDGET APPROVAL COMPLETION CHECK ===', [
                            'task_id' => $task->id,
                            'budget_id' => $task->budget_id,
                            'approval_result' => $approvalResult
                        ]);
                        
                        if ($approvalResult === 'Approve' || $approvalResult === 'Reject') {
                            $approvalService->updateBudgetStatus($task->budget_id, $approvalResult);
                            
                            Log::info('=== BUDGET STATUS UPDATED ===', [
                                'task_id' => $task->id,
                                'budget_id' => $task->budget_id,
                                'new_status' => DB::table('budgets')->where('id', $task->budget_id)->value('status')
                            ]);
                        }
                    }
                } else {
                    Log::warning('=== NO APPROVAL TRANSACTION FOUND FOR INVOICE ===', [
                        'task_id' => $task->id,
                        'invoice_id' => $task->invoice_id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);
                }
            }

            // Check if this is a Maharat Invoice task and if it's being rejected
            if ($task->invoice_id && $request->input('status') === 'Rejected') {
                Log::info('=== MAHARAT INVOICE TASK REJECTION CHECK ===', [
                    'task_id' => $task->id,
                    'invoice_id' => $task->invoice_id,
                    'current_status' => DB::table('invoices')->where('id', $task->invoice_id)->value('status')
                ]);

                // Update the corresponding approval transaction
                $approvalTransaction = DB::table('mahrat_invoice_approval_transactions')
                    ->where('invoice_id', $task->invoice_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== UPDATING MAHARAT INVOICE APPROVAL TRANSACTION FOR REJECTION ===', [
                        'task_id' => $task->id,
                        'invoice_id' => $task->invoice_id,
                        'approval_transaction_id' => $approvalTransaction->id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('mahrat_invoice_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Reject',
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    Log::info('=== REJECTION TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'invoice_id' => $task->invoice_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Immediately update invoice status to Cancelled
                        $invoiceUpdated = DB::table('invoices')
                            ->where('id', $task->invoice_id)
                            ->update([
                                'status' => 'Cancelled',
                                'updated_at' => now()
                            ]);

                        Log::info('=== INVOICE REJECTION STATUS UPDATE RESULT ===', [
                            'task_id' => $task->id,
                            'invoice_id' => $task->invoice_id,
                            'update_success' => $invoiceUpdated,
                            'new_status' => DB::table('invoices')->where('id', $task->invoice_id)->value('status')
                        ]);
                    }
                }
            }

            // Check if this is a Budget Request task and if it's being approved
            if ($task->request_budgets_id && $request->input('status') === 'Approved') {
                Log::info('=== BUDGET REQUEST TASK APPROVAL CHECK ===', [
                    'task_id' => $task->id,
                    'request_budget_id' => $task->request_budgets_id,
                    'current_order_no' => $task->order_no,
                    'current_status' => DB::table('request_budgets')->where('id', $task->request_budgets_id)->value('status')
                ]);

                // Find the corresponding approval transaction
                $approvalTransaction = DB::table('budget_request_approval_transactions')
                    ->where('request_budgets_id', $task->request_budgets_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== FOUND APPROVAL TRANSACTION, UPDATING IT ===', [
                        'task_id' => $task->id,
                        'request_budget_id' => $task->request_budgets_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);

                    // Check if this will be the final approval BEFORE updating the transaction
                    // Get total number of required approvals for this budget request
                    $totalApprovals = DB::table('budget_request_approval_transactions')
                        ->where('request_budgets_id', $task->request_budgets_id)
                        ->count();

                    // Check if this is the final approval (current order equals total approvals)
                    $isFinalApproval = $approvalTransaction->order == $totalApprovals;

                    Log::info('=== BUDGET REQUEST FINAL APPROVAL CHECK ===', [
                        'task_id' => $task->id,
                        'request_budget_id' => $task->request_budgets_id,
                        'current_order' => $approvalTransaction->order,
                        'total_approvals' => $totalApprovals,
                        'is_final_approval' => $isFinalApproval
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('budget_request_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Approve',
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    Log::info('=== BUDGET REQUEST APPROVAL TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'request_budget_id' => $task->request_budgets_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Now trigger the budget request approval logic
                        if ($isFinalApproval) {
                            Log::info('=== FINAL BUDGET REQUEST APPROVAL - UPDATING STATUS AND CREATING BUDGET ===', [
                                'task_id' => $task->id,
                                'request_budget_id' => $task->request_budgets_id,
                                'current_status' => DB::table('request_budgets')->where('id', $task->request_budgets_id)->value('status'),
                                'target_status' => 'Approved'
                            ]);

                            // Update budget request status to Approved
                            $budgetRequestUpdated = DB::table('request_budgets')
                                ->where('id', $task->request_budgets_id)
                                ->update([
                                    'status' => 'Approved',
                                    'approved_amount' => DB::raw('requested_amount'),
                                    'balance_amount' => DB::raw('requested_amount'),
                                    'updated_at' => now()
                                ]);

                            Log::info('=== BUDGET REQUEST STATUS UPDATE RESULT ===', [
                                'task_id' => $task->id,
                                'request_budget_id' => $task->request_budgets_id,
                                'update_success' => $budgetRequestUpdated,
                                'new_status' => DB::table('request_budgets')->where('id', $task->request_budgets_id)->value('status')
                            ]);

                            if ($budgetRequestUpdated) {
                                // Create budget in budgets table from approved budget request
                                $budgetRequest = DB::table('request_budgets')->where('id', $task->request_budgets_id)->first();
                                
                                if ($budgetRequest) {
                                    Log::info('=== CREATING BUDGET FROM APPROVED BUDGET REQUEST ===', [
                                        'task_id' => $task->id,
                                        'request_budget_id' => $budgetRequest->id,
                                        'fiscal_period_id' => $budgetRequest->fiscal_period_id,
                                        'department_id' => $budgetRequest->department_id,
                                        'cost_center_id' => $budgetRequest->cost_center_id,
                                        'sub_cost_center_id' => $budgetRequest->sub_cost_center
                                    ]);

                                    // Check if budget already exists for this combination
                                    $existingBudget = DB::table('budgets')
                                        ->where('fiscal_period_id', $budgetRequest->fiscal_period_id)
                                        ->where('department_id', $budgetRequest->department_id)
                                        ->where('cost_center_id', $budgetRequest->cost_center_id)
                                        ->where('sub_cost_center_id', $budgetRequest->sub_cost_center)
                                        ->first();

                                    if ($existingBudget) {
                                        Log::warning('=== BUDGET ALREADY EXISTS, UPDATING INSTEAD ===', [
                                            'task_id' => $task->id,
                                            'request_budget_id' => $budgetRequest->id,
                                            'existing_budget_id' => $existingBudget->id
                                        ]);

                                        // Update existing budget
                                        DB::table('budgets')
                                            ->where('id', $existingBudget->id)
                                            ->update([
                                                'total_expense_planned' => $budgetRequest->requested_amount,
                                                'total_revenue_planned' => $budgetRequest->revenue_planned,
                                                'description' => 'Budget updated from approved budget request',
                                                'status' => 'Active',
                                                'updated_by' => auth()->id(),
                                                'updated_at' => now()
                                            ]);

                                        // Update the budget request to link to the existing budget
                                        DB::table('request_budgets')
                                            ->where('id', $budgetRequest->id)
                                            ->update([
                                                'budget_id' => $existingBudget->id,
                                                'updated_at' => now()
                                            ]);
                                    } else {
                                        // Create new budget
                                        try {
                                            $newBudgetId = DB::table('budgets')->insertGetId([
                                                'fiscal_period_id' => $budgetRequest->fiscal_period_id,
                                                'department_id' => $budgetRequest->department_id,
                                                'cost_center_id' => $budgetRequest->cost_center_id,
                                                'sub_cost_center_id' => $budgetRequest->sub_cost_center,
                                                'request_budget_id' => $budgetRequest->id,
                                                'description' => 'Budget created from approved budget request',
                                                'total_revenue_planned' => $budgetRequest->revenue_planned,
                                                'total_revenue_actual' => 0,
                                                'total_expense_planned' => $budgetRequest->requested_amount,
                                                'total_expense_actual' => 0,
                                                'status' => 'Pending',
                                                'attachment_path' => $budgetRequest->attachment_path,
                                                'original_name' => $budgetRequest->original_name,
                                                'created_by' => auth()->id(),
                                                'updated_by' => auth()->id(),
                                                'created_at' => now(),
                                                'updated_at' => now()
                                            ]);

                                            // Update the budget request to link to the new budget
                                            DB::table('request_budgets')
                                                ->where('id', $budgetRequest->id)
                                                ->update([
                                                    'budget_id' => $newBudgetId,
                                                    'updated_at' => now()
                                                ]);

                                            Log::info('=== NEW BUDGET CREATED SUCCESSFULLY ===', [
                                                'task_id' => $task->id,
                                                'request_budget_id' => $budgetRequest->id,
                                                'new_budget_id' => $newBudgetId
                                            ]);
                                        } catch (\Exception $e) {
                                            Log::error('=== FAILED TO CREATE BUDGET ===', [
                                                'task_id' => $task->id,
                                                'request_budget_id' => $budgetRequest->id,
                                                'error' => $e->getMessage(),
                                                'trace' => $e->getTraceAsString(),
                                                'budget_data' => [
                                                    'fiscal_period_id' => $budgetRequest->fiscal_period_id,
                                                    'department_id' => $budgetRequest->department_id,
                                                    'cost_center_id' => $budgetRequest->cost_center_id,
                                                    'sub_cost_center_id' => $budgetRequest->sub_cost_center,
                                                    'revenue_planned' => $budgetRequest->revenue_planned,
                                                    'requested_amount' => $budgetRequest->requested_amount
                                                ]
                                            ]);
                                            throw $e;
                                        }
                                    }
                                }
                            }
                        } else {
                            Log::info('=== NOT FINAL BUDGET REQUEST APPROVAL - UPDATING TO PENDING ===', [
                                'task_id' => $task->id,
                                'request_budget_id' => $task->request_budgets_id,
                                'total_approvals' => $totalApprovals
                            ]);

                            // Update budget request status to Pending
                            $budgetRequestUpdated = DB::table('request_budgets')
                                ->where('id', $task->request_budgets_id)
                                ->update([
                                    'status' => 'Pending',
                                    'updated_at' => now()
                                ]);

                            Log::info('=== BUDGET REQUEST STATUS UPDATE TO PENDING RESULT ===', [
                                'task_id' => $task->id,
                                'request_budget_id' => $task->request_budgets_id,
                                'update_success' => $budgetRequestUpdated,
                                'new_status' => DB::table('request_budgets')->where('id', $task->request_budgets_id)->value('status')
                            ]);
                        }
                    }
                } else {
                    Log::warning('=== NO APPROVAL TRANSACTION FOUND FOR BUDGET REQUEST ===', [
                        'task_id' => $task->id,
                        'request_budget_id' => $task->request_budgets_id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);
                }
            }

            // Check if this is a Budget Request task and if it's being rejected
            if ($task->request_budgets_id && $request->input('status') === 'Rejected') {
                Log::info('=== BUDGET REQUEST TASK REJECTION CHECK ===', [
                    'task_id' => $task->id,
                    'request_budget_id' => $task->request_budgets_id,
                    'current_status' => DB::table('request_budgets')->where('id', $task->request_budgets_id)->value('status')
                ]);

                // Update the corresponding approval transaction
                $approvalTransaction = DB::table('budget_request_approval_transactions')
                    ->where('request_budgets_id', $task->request_budgets_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== UPDATING BUDGET REQUEST APPROVAL TRANSACTION FOR REJECTION ===', [
                        'task_id' => $task->id,
                        'request_budget_id' => $task->request_budgets_id,
                        'approval_transaction_id' => $approvalTransaction->id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('budget_request_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Reject',
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    Log::info('=== BUDGET REQUEST REJECTION TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'request_budget_id' => $task->request_budgets_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Immediately update budget request status to Rejected
                        $budgetRequestUpdated = DB::table('request_budgets')
                            ->where('id', $task->request_budgets_id)
                            ->update([
                                'status' => 'Rejected',
                                'updated_at' => now()
                            ]);

                        Log::info('=== BUDGET REQUEST REJECTION STATUS UPDATE RESULT ===', [
                            'task_id' => $task->id,
                            'request_budget_id' => $task->request_budgets_id,
                            'update_success' => $budgetRequestUpdated,
                            'new_status' => DB::table('request_budgets')->where('id', $task->request_budgets_id)->value('status')
                        ]);
                    }
                }
            }

            // Check if this is a Budget Approval task and if it's being approved
            if ($task->budget_id && $request->input('status') === 'Approved') {
                Log::info('=== BUDGET APPROVAL TASK APPROVAL CHECK ===', [
                    'task_id' => $task->id,
                    'budget_id' => $task->budget_id,
                    'current_status' => DB::table('budgets')->where('id', $task->budget_id)->value('status')
                ]);

                // Find the corresponding budget approval transaction
                $approvalTransaction = DB::table('budget_approval_transactions')
                    ->where('budget_id', $task->budget_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== FOUND BUDGET APPROVAL TRANSACTION, UPDATING IT ===', [
                        'task_id' => $task->id,
                        'budget_id' => $task->budget_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('budget_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Approve',
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    Log::info('=== BUDGET APPROVAL TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'budget_id' => $task->budget_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Trigger the budget approval service to update budget status
                        $approvalService = new \App\Services\BudgetApprovalService();
                        $approvalResult = $approvalService->checkApprovalCompletion($task->budget_id, $approvalTransaction->id);
                        
                        Log::info('=== BUDGET APPROVAL COMPLETION CHECK ===', [
                            'task_id' => $task->id,
                            'budget_id' => $task->budget_id,
                            'approval_result' => $approvalResult
                        ]);
                        
                        if ($approvalResult === 'Approve' || $approvalResult === 'Reject') {
                            $approvalService->updateBudgetStatus($task->budget_id, $approvalResult);
                            
                            Log::info('=== BUDGET STATUS UPDATED ===', [
                                'task_id' => $task->id,
                                'budget_id' => $task->budget_id,
                                'new_status' => DB::table('budgets')->where('id', $task->budget_id)->value('status')
                            ]);
                        }
                    }
                } else {
                    Log::warning('=== NO BUDGET APPROVAL TRANSACTION FOUND ===', [
                        'task_id' => $task->id,
                        'budget_id' => $task->budget_id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);
                }
            }

            // Check if this is a Budget Approval task and if it's being rejected
            if ($task->budget_id && $request->input('status') === 'Rejected') {
                Log::info('=== BUDGET APPROVAL TASK REJECTION CHECK ===', [
                    'task_id' => $task->id,
                    'budget_id' => $task->budget_id,
                    'current_status' => DB::table('budgets')->where('id', $task->budget_id)->value('status')
                ]);

                // Find the corresponding budget approval transaction
                $approvalTransaction = DB::table('budget_approval_transactions')
                    ->where('budget_id', $task->budget_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== UPDATING BUDGET APPROVAL TRANSACTION FOR REJECTION ===', [
                        'task_id' => $task->id,
                        'budget_id' => $task->budget_id,
                        'approval_transaction_id' => $approvalTransaction->id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('budget_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Reject',
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    Log::info('=== BUDGET APPROVAL REJECTION TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'budget_id' => $task->budget_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Trigger the budget approval service to update budget status
                        $approvalService = new \App\Services\BudgetApprovalService();
                        $approvalResult = $approvalService->checkApprovalCompletion($task->budget_id, $approvalTransaction->id);
                        
                        Log::info('=== BUDGET APPROVAL COMPLETION CHECK ===', [
                            'task_id' => $task->id,
                            'budget_id' => $task->budget_id,
                            'approval_result' => $approvalResult
                        ]);
                        
                        if ($approvalResult === 'Approve' || $approvalResult === 'Reject') {
                            $approvalService->updateBudgetStatus($task->budget_id, $approvalResult);
                            
                            Log::info('=== BUDGET STATUS UPDATED ===', [
                                'task_id' => $task->id,
                                'budget_id' => $task->budget_id,
                                'new_status' => DB::table('budgets')->where('id', $task->budget_id)->value('status')
                            ]);
                        }
                    }
                } else {
                    Log::warning('=== NO BUDGET APPROVAL TRANSACTION FOUND FOR REJECTION ===', [
                        'task_id' => $task->id,
                        'budget_id' => $task->budget_id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);
                }
            }

            // Check if this is a Purchase Order task and if it's being approved
            if ($task->purchase_order_id && $request->input('status') === 'Approved') {
                Log::info('=== PURCHASE ORDER TASK APPROVAL CHECK ===', [
                    'task_id' => $task->id,
                    'purchase_order_id' => $task->purchase_order_id,
                    'current_order_no' => $task->order_no,
                    'current_status' => DB::table('purchase_orders')->where('id', $task->purchase_order_id)->value('status')
                ]);

                // Update the corresponding approval transaction
                $approvalTransaction = DB::table('po_approval_transactions')
                    ->where('purchase_order_id', $task->purchase_order_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== UPDATING PURCHASE ORDER APPROVAL TRANSACTION ===', [
                        'task_id' => $task->id,
                        'purchase_order_id' => $task->purchase_order_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('po_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Approve',
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    Log::info('=== PURCHASE ORDER APPROVAL TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'purchase_order_id' => $task->purchase_order_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Now check if this is the final approval
                        $totalApprovals = DB::table('po_approval_transactions')
                            ->where('purchase_order_id', $task->purchase_order_id)
                            ->count();

                        $completedApprovals = DB::table('po_approval_transactions')
                            ->where('purchase_order_id', $task->purchase_order_id)
                            ->where('status', 'Approve')
                            ->count();

                        $isFinalApproval = $completedApprovals === $totalApprovals;

                        Log::info('=== PURCHASE ORDER FINAL APPROVAL CHECK ===', [
                            'task_id' => $task->id,
                            'purchase_order_id' => $task->purchase_order_id,
                            'total_approvals' => $totalApprovals,
                            'completed_approvals' => $completedApprovals,
                            'is_final_approval' => $isFinalApproval
                        ]);

                        if ($isFinalApproval) {
                            Log::info('=== FINAL PURCHASE ORDER APPROVAL - UPDATING STATUS ===', [
                                'task_id' => $task->id,
                                'purchase_order_id' => $task->purchase_order_id,
                                'current_status' => DB::table('purchase_orders')->where('id', $task->purchase_order_id)->value('status'),
                                'target_status' => 'Approved'
                            ]);

                            // Update the purchase order status to Approved
                            $purchaseOrderUpdated = DB::table('purchase_orders')
                                ->where('id', $task->purchase_order_id)
                                ->update([
                                    'status' => 'Approved',
                                    'updated_at' => now()
                                ]);

                            Log::info('=== PURCHASE ORDER STATUS UPDATE RESULT ===', [
                                'task_id' => $task->id,
                                'purchase_order_id' => $task->purchase_order_id,
                                'update_success' => $purchaseOrderUpdated,
                                'new_status' => DB::table('purchase_orders')->where('id', $task->purchase_order_id)->value('status')
                            ]);
                        } else {
                            Log::info('=== NOT FINAL PURCHASE ORDER APPROVAL - KEEPING DRAFT STATUS ===', [
                                'task_id' => $task->id,
                                'purchase_order_id' => $task->purchase_order_id,
                                'total_approvals' => $totalApprovals,
                                'completed_approvals' => $completedApprovals
                            ]);
                        }
                    }
                } else {
                    Log::warning('=== NO APPROVAL TRANSACTION FOUND FOR PURCHASE ORDER ===', [
                        'task_id' => $task->id,
                        'purchase_order_id' => $task->purchase_order_id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);
                }
            }

            // Check if this is a Purchase Order task and if it's being rejected
            if ($task->purchase_order_id && $request->input('status') === 'Rejected') {
                Log::info('=== PURCHASE ORDER TASK REJECTION CHECK ===', [
                    'task_id' => $task->id,
                    'purchase_order_id' => $task->purchase_order_id,
                    'current_status' => DB::table('purchase_orders')->where('id', $task->purchase_order_id)->value('status')
                ]);

                // Update the corresponding approval transaction
                $approvalTransaction = DB::table('po_approval_transactions')
                    ->where('purchase_order_id', $task->purchase_order_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== UPDATING PURCHASE ORDER APPROVAL TRANSACTION FOR REJECTION ===', [
                        'task_id' => $task->id,
                        'purchase_order_id' => $task->purchase_order_id,
                        'approval_transaction_id' => $approvalTransaction->id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('po_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Reject',
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    Log::info('=== PURCHASE ORDER REJECTION TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'purchase_order_id' => $task->purchase_order_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Immediately update purchase order status to Rejected
                        $purchaseOrderUpdated = DB::table('purchase_orders')
                            ->where('id', $task->purchase_order_id)
                            ->update([
                                'status' => 'Rejected',
                                'updated_at' => now()
                            ]);

                        Log::info('=== PURCHASE ORDER REJECTION STATUS UPDATE RESULT ===', [
                            'task_id' => $task->id,
                            'purchase_order_id' => $task->purchase_order_id,
                            'update_success' => $purchaseOrderUpdated,
                            'new_status' => DB::table('purchase_orders')->where('id', $task->purchase_order_id)->value('status')
                        ]);
                    }
                } else {
                    Log::warning('=== NO APPROVAL TRANSACTION FOUND FOR PURCHASE ORDER REJECTION ===', [
                        'task_id' => $task->id,
                        'purchase_order_id' => $task->purchase_order_id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);
                }
            }

            DB::commit();

            $rfqLogger->info('=== TASK UPDATE COMPLETED ===', [
                'task_id' => $task->id,
                'rfq_id' => $task->rfq_id,
                'final_status_id' => $task->rfq ? $task->rfq->status_id : null
            ]);

            return response()->json([
                'message' => 'Task updated successfully',
                'data' => new TaskResource($task->load([
                    'processStep',
                    'process',
                    'assignedUser',
                    'descriptions',
                    'material_request',
                    'rfq',
                    'purchase_order',
                    'payment_order',
                    'invoice',
                    'budget',
                    'budget_approval_transaction',
                    'request_budget',
                ]))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            $rfqLogger->error('=== TASK UPDATE FAILED ===', [
                'task_id' => $task->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update task',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(Task $task): JsonResponse
    {
        try {
            DB::beginTransaction();

            $task->delete();

            DB::commit();

            return response()->json([
                'message' => 'Task deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete task',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function markAsRead(Task $task): JsonResponse
    {
        try {
            $task->update(['read_status' => now()]);

            return response()->json([
                'message' => 'Task marked as read',
                'data' => new TaskResource($task)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to mark task as read',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getByUrgency(string $urgency): JsonResponse
    {
        $tasks = QueryBuilder::for(Task::class)
            ->where('urgency', $urgency)
            ->allowedIncludes(TaskParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($tasks->isEmpty()) {
            return response()->json([
                'message' => "No tasks found with urgency: {$urgency}",
                'data' => []
            ], Response::HTTP_OK);
        }

        return response()->json(new TaskCollection($tasks), Response::HTTP_OK);
    }
}
