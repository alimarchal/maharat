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
use App\Services\TransactionFlowService;
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
            Log::info('=== TASK UPDATE STARTED ===', [
                'task_id' => $task->id,
                'rfq_id' => $task->rfq_id,
                'status' => $request->input('status'),
                'request_data' => $request->all()
            ]);

            DB::beginTransaction();

            $task->update($request->validated());

            // Check if this is an RFQ task and if it's being approved
            if ($task->rfq_id && $request->input('status') === 'Approved') {
                Log::info('=== RFQ TASK APPROVAL CHECK ===', [
                    'task_id' => $task->id,
                    'rfq_id' => $task->rfq_id,
                    'current_order_no' => $task->order_no,
                    'current_status_id' => DB::table('rfqs')->where('id', $task->rfq_id)->value('status_id'),
                    'process_id' => $task->process_id,
                    'assigned_to_user_id' => $task->assigned_to_user_id
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

                Log::info('=== RFQ APPROVAL TASKS ===', [
                    'rfq_id' => $task->rfq_id,
                    'total_tasks' => $totalApprovals,
                    'current_task_order_no' => $task->order_no,
                    'all_tasks' => $allTasks->toArray(),
                    'task_order_no_type' => gettype($task->order_no),
                    'total_approvals_type' => gettype($totalApprovals)
                ]);

                // Check if this is the final approval - use loose comparison for string/number mismatch
                $isFinalApproval = (string)$task->order_no === (string)$totalApprovals;

                Log::info('=== FINAL APPROVAL CHECK ===', [
                    'rfq_id' => $task->rfq_id,
                    'current_order_no' => $task->order_no,
                    'total_approvals' => $totalApprovals,
                    'is_final_approval' => $isFinalApproval,
                    'current_status_id' => DB::table('rfqs')->where('id', $task->rfq_id)->value('status_id'),
                    'comparison_details' => [
                        'order_no_string' => (string)$task->order_no,
                        'total_approvals_string' => (string)$totalApprovals,
                        'strict_comparison' => $task->order_no === $totalApprovals,
                        'loose_comparison' => $task->order_no == $totalApprovals
                    ]
                ]);

                if ($isFinalApproval) {
                    Log::info('=== FINAL APPROVAL DETECTED - UPDATING RFQ STATUS ===', [
                        'rfq_id' => $task->rfq_id,
                        'current_status_id' => DB::table('rfqs')->where('id', $task->rfq_id)->value('status_id'),
                        'target_status_id' => 47,
                        'auth_user_id' => auth()->id()
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

                        Log::info('=== RFQ STATUS UPDATE RESULT ===', [
                            'rfq_id' => $task->rfq_id,
                            'update_success' => $updated,
                            'rows_affected' => $updated,
                            'new_status_id' => DB::table('rfqs')->where('id', $task->rfq_id)->value('status_id'),
                            'update_query_executed' => true
                        ]);

                        if (!$updated) {
                            Log::error('=== RFQ STATUS UPDATE FAILED ===', [
                                'rfq_id' => $task->rfq_id,
                                'current_status_id' => DB::table('rfqs')->where('id', $task->rfq_id)->value('status_id'),
                                'update_result' => $updated
                            ]);
                            throw new \Exception('Failed to update RFQ status - no rows affected');
                        }

                        // Create status log entry
                        $statusLogInserted = DB::table('rfq_status_logs')->insert([
                            'rfq_id' => $task->rfq_id,
                            'status_id' => 47,
                            'changed_by' => auth()->id(),
                            'remarks' => 'RFQ Approved and Activated by Final Approver',
                            'approved_by' => auth()->id(),
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);

                        Log::info('=== RFQ STATUS LOG INSERTED ===', [
                            'rfq_id' => $task->rfq_id,
                            'status_log_inserted' => $statusLogInserted
                        ]);

                        // Verify the update
                        $updatedRfq = DB::table('rfqs')->where('id', $task->rfq_id)->first();
                        Log::info('=== RFQ STATUS VERIFICATION ===', [
                            'rfq_id' => $task->rfq_id,
                            'status_id' => $updatedRfq->status_id,
                            'expected_status' => 47,
                            'update_successful' => $updatedRfq->status_id === 47,
                            'rfq_data' => $updatedRfq
                        ]);

                        // Refresh the task's RFQ relationship to get the updated status
                        $task->load('rfq');

                    } catch (\Exception $e) {
                        Log::error('=== RFQ STATUS UPDATE ERROR ===', [
                            'rfq_id' => $task->rfq_id,
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString(),
                            'error_code' => $e->getCode()
                        ]);
                        throw $e;
                    }
                } else {
                    Log::info('=== NOT FINAL APPROVAL - SKIPPING RFQ STATUS UPDATE ===', [
                        'rfq_id' => $task->rfq_id,
                        'current_order_no' => $task->order_no,
                        'total_approvals' => $totalApprovals,
                        'current_status_id' => DB::table('rfqs')->where('id', $task->rfq_id)->value('status_id'),
                        'reason' => 'Not final approval step'
                    ]);
                }
            }

            // Check if this is an RFQ task and if it's being rejected
            if ($task->rfq_id && $request->input('status') === 'Rejected') {
                Log::info('=== RFQ TASK REJECTION CHECK ===', [
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
                    Log::info('=== UPDATING RFQ APPROVAL TRANSACTION FOR REJECTION ===', [
                        'task_id' => $task->id,
                        'rfq_id' => $task->rfq_id,
                        'approval_transaction_id' => $approvalTransaction->id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('rfq_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Reject',
                            'updated_at' => now()
                        ]);

                    Log::info('=== RFQ REJECTION TRANSACTION UPDATE RESULT ===', [
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

                        Log::info('=== RFQ REJECTION STATUS UPDATE RESULT ===', [
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
                    Log::warning('=== NO RFQ APPROVAL TRANSACTION FOUND ===', [
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
                        // Check if this is the final approval
                        $totalApprovals = DB::table('mahrat_invoice_approval_transactions')
                            ->where('invoice_id', $task->invoice_id)
                            ->count();

                        $completedApprovals = DB::table('mahrat_invoice_approval_transactions')
                            ->where('invoice_id', $task->invoice_id)
                            ->where('status', 'Approve')
                            ->count();

                        $isFinalApproval = $completedApprovals === $totalApprovals;

                        Log::info('=== MAHARAT INVOICE FINAL APPROVAL CHECK ===', [
                            'task_id' => $task->id,
                            'invoice_id' => $task->invoice_id,
                            'total_approvals' => $totalApprovals,
                            'completed_approvals' => $completedApprovals,
                            'is_final_approval' => $isFinalApproval
                        ]);

                        if ($isFinalApproval) {
                            Log::info('=== FINAL MAHARAT INVOICE APPROVAL - UPDATING STATUS AND ACCOUNTS ===', [
                                'task_id' => $task->id,
                                'invoice_id' => $task->invoice_id,
                                'current_status' => DB::table('invoices')->where('id', $task->invoice_id)->value('status'),
                                'target_status' => 'Approved'
                            ]);

                            // Update invoice status to Approved
                            $invoiceUpdated = DB::table('invoices')
                                ->where('id', $task->invoice_id)
                                ->update([
                                    'status' => 'Approved',
                                    'updated_at' => now()
                                ]);

                            Log::info('=== INVOICE STATUS UPDATE RESULT ===', [
                                'task_id' => $task->id,
                                'invoice_id' => $task->invoice_id,
                                'update_success' => $invoiceUpdated,
                                'new_status' => DB::table('invoices')->where('id', $task->invoice_id)->value('status')
                            ]);

                            if ($invoiceUpdated) {
                                // Get invoice details for account updates
                                $invoice = DB::table('invoices')->where('id', $task->invoice_id)->first();
                                
                                if ($invoice) {
                                    Log::info('=== UPDATING ACCOUNTS FOR APPROVED INVOICE ===', [
                                        'task_id' => $task->id,
                                        'invoice_id' => $invoice->id,
                                        'subtotal' => $invoice->subtotal,
                                        'tax_amount' => $invoice->tax_amount,
                                        'total_amount' => $invoice->total_amount
                                    ]);

                                    // Update Revenue/Income account (ID 4) with subtotal
                                    $revenueAccountUpdated = DB::table('accounts')
                                        ->where('id', 4)
                                        ->where('name', 'Revenue/Income')
                                        ->update([
                                            'credit_amount' => DB::raw('COALESCE(credit_amount, 0) + ' . $invoice->subtotal),
                                            'updated_by' => auth()->id(),
                                            'updated_at' => now()
                                        ]);

                                    Log::info('=== REVENUE ACCOUNT UPDATE RESULT ===', [
                                        'task_id' => $task->id,
                                        'invoice_id' => $invoice->id,
                                        'account_id' => 4,
                                        'account_name' => 'Revenue/Income',
                                        'amount_added' => $invoice->subtotal,
                                        'update_success' => $revenueAccountUpdated
                                    ]);

                                    // Update VAT Receivables account (ID 13) with tax_amount
                                    $vatAccountUpdated = DB::table('accounts')
                                        ->where('id', 13)
                                        ->where('name', 'VAT Receivables (On Maharat Invoice)')
                                        ->update([
                                            'credit_amount' => DB::raw('COALESCE(credit_amount, 0) + ' . $invoice->tax_amount),
                                            'updated_by' => auth()->id(),
                                            'updated_at' => now()
                                        ]);

                                    Log::info('=== VAT RECEIVABLES ACCOUNT UPDATE RESULT ===', [
                                        'task_id' => $task->id,
                                        'invoice_id' => $invoice->id,
                                        'account_id' => 13,
                                        'account_name' => 'VAT Receivables (On Maharat Invoice)',
                                        'amount_added' => $invoice->tax_amount,
                                        'update_success' => $vatAccountUpdated
                                    ]);

                                    // Update Account Receivable account (ID 11) with total_amount
                                    $receivableAccountUpdated = DB::table('accounts')
                                        ->where('id', 11)
                                        ->where('name', 'Account Receivable')
                                        ->update([
                                            'credit_amount' => DB::raw('COALESCE(credit_amount, 0) + ' . $invoice->total_amount),
                                            'updated_by' => auth()->id(),
                                            'updated_at' => now()
                                        ]);

                                    Log::info('=== ACCOUNT RECEIVABLE UPDATE RESULT ===', [
                                        'task_id' => $task->id,
                                        'invoice_id' => $invoice->id,
                                        'account_id' => 11,
                                        'account_name' => 'Account Receivable',
                                        'amount_added' => $invoice->total_amount,
                                        'update_success' => $receivableAccountUpdated
                                    ]);

                                    if ($revenueAccountUpdated && $vatAccountUpdated && $receivableAccountUpdated) {
                                        Log::info('=== ALL ACCOUNT UPDATES COMPLETED SUCCESSFULLY ===', [
                                            'task_id' => $task->id,
                                            'invoice_id' => $invoice->id,
                                            'revenue_account_updated' => $revenueAccountUpdated,
                                            'vat_receivables_account_updated' => $vatAccountUpdated,
                                            'account_receivable_updated' => $receivableAccountUpdated
                                        ]);

                                        // Record transaction flows for audit trail
                                        try {
                                            Log::info('=== RECORDING TRANSACTION FLOWS FOR INVOICE APPROVAL ===', [
                                                'task_id' => $task->id,
                                                'invoice_id' => $invoice->id
                                            ]);

                                            $transactionFlows = TransactionFlowService::recordInvoiceApprovalFlows($invoice);

                                            Log::info('=== TRANSACTION FLOWS RECORDED SUCCESSFULLY ===', [
                                                'task_id' => $task->id,
                                                'invoice_id' => $invoice->id,
                                                'flows_count' => count($transactionFlows),
                                                'flow_ids' => array_map(function($flow) {
                                                    return $flow->id;
                                                }, $transactionFlows)
                                            ]);
                                        } catch (\Exception $e) {
                                            Log::error('=== FAILED TO RECORD TRANSACTION FLOWS ===', [
                                                'task_id' => $task->id,
                                                'invoice_id' => $invoice->id,
                                                'error' => $e->getMessage(),
                                                'trace' => $e->getTraceAsString()
                                            ]);
                                            // Don't throw the exception as account updates were successful
                                        }

                                        // Update budget revenue after successful account updates
                                        Log::info('=== UPDATING BUDGET REVENUE FOR APPROVED INVOICE ===', [
                                            'task_id' => $task->id,
                                            'invoice_id' => $invoice->id,
                                            'invoice_amount' => $invoice->total_amount,
                                            'invoice_date' => $invoice->issue_date
                                        ]);

                                        $budgetService = new \App\Services\BudgetRevenueUpdateService();
                                        $budgetUpdateResult = $budgetService->updateBudgetRevenue($invoice);

                                        if ($budgetUpdateResult['success']) {
                                            Log::info('=== BUDGET REVENUE UPDATED SUCCESSFULLY ===', [
                                                'task_id' => $task->id,
                                                'invoice_id' => $invoice->id,
                                                'message' => $budgetUpdateResult['message'],
                                                'budgets_updated' => $budgetUpdateResult['budgets_updated']
                                            ]);
                                        } else {
                                            Log::warning('=== BUDGET REVENUE UPDATE FAILED ===', [
                                                'task_id' => $task->id,
                                                'invoice_id' => $invoice->id,
                                                'message' => $budgetUpdateResult['message']
                                            ]);
                                        }
                                    } else {
                                        Log::warning('=== SOME ACCOUNT UPDATES FAILED ===', [
                                            'task_id' => $task->id,
                                            'invoice_id' => $invoice->id,
                                            'revenue_account_updated' => $revenueAccountUpdated,
                                            'vat_receivables_account_updated' => $vatAccountUpdated,
                                            'account_receivable_updated' => $receivableAccountUpdated
                                        ]);
                                    }
                                }
                            }
                        } else {
                            Log::info('=== NOT FINAL MAHARAT INVOICE APPROVAL - KEEPING DRAFT STATUS ===', [
                                'task_id' => $task->id,
                                'invoice_id' => $task->invoice_id,
                                'total_approvals' => $totalApprovals,
                                'completed_approvals' => $completedApprovals
                            ]);
                            // Update invoice status to Pending for non-final approver
                            DB::table('invoices')
                                ->where('id', $task->invoice_id)
                                ->update([
                                    'status' => 'Pending',
                                    'updated_at' => now()
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
                    // Get the process steps to determine the total number of required approvals
                    $processSteps = DB::table('process_steps')
                        ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                        ->where('processes.title', 'Budget Request Approval')
                        ->orderBy('process_steps.order')
                        ->get();

                    $totalRequiredApprovals = $processSteps->count();
                    
                    // Check if this is the final approval (current order equals total required approvals)
                    $isFinalApproval = $approvalTransaction->order == $totalRequiredApprovals;

                    Log::info('=== BUDGET REQUEST FINAL APPROVAL CHECK ===', [
                        'task_id' => $task->id,
                        'request_budget_id' => $task->request_budgets_id,
                        'current_order' => $approvalTransaction->order,
                        'total_required_approvals' => $totalRequiredApprovals,
                        'is_final_approval' => $isFinalApproval,
                        'process_steps_count' => $processSteps->count()
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
                                'total_required_approvals' => $totalRequiredApprovals
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

            // Check if this is a Material Request task and if it's being approved
            if ($task->material_request_id && $request->input('status') === 'Approved') {
                Log::info('=== MATERIAL REQUEST TASK APPROVAL CHECK ===', [
                    'task_id' => $task->id,
                    'material_request_id' => $task->material_request_id,
                    'current_order_no' => $task->order_no,
                    'current_status_id' => DB::table('material_requests')->where('id', $task->material_request_id)->value('status_id')
                ]);

                // Update the corresponding approval transaction
                $approvalTransaction = DB::table('material_request_transactions')
                    ->where('material_request_id', $task->material_request_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== UPDATING MATERIAL REQUEST APPROVAL TRANSACTION ===', [
                        'task_id' => $task->id,
                        'material_request_id' => $task->material_request_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('material_request_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Approve',
                            'updated_at' => now()
                        ]);

                    Log::info('=== MATERIAL REQUEST APPROVAL TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'material_request_id' => $task->material_request_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Check if this is the final approval
                        $totalApprovals = DB::table('material_request_transactions')
                            ->where('material_request_id', $task->material_request_id)
                            ->count();

                        $completedApprovals = DB::table('material_request_transactions')
                            ->where('material_request_id', $task->material_request_id)
                            ->where('status', 'Approve')
                            ->count();

                        $isFinalApproval = $completedApprovals === $totalApprovals;

                        Log::info('=== MATERIAL REQUEST FINAL APPROVAL CHECK ===', [
                            'task_id' => $task->id,
                            'material_request_id' => $task->material_request_id,
                            'total_approvals' => $totalApprovals,
                            'completed_approvals' => $completedApprovals,
                            'is_final_approval' => $isFinalApproval
                        ]);

                        if ($isFinalApproval) {
                            Log::info('=== FINAL MATERIAL REQUEST APPROVAL - SETTING status_id = 1 (Pending) ===', [
                                'task_id' => $task->id,
                                'material_request_id' => $task->material_request_id,
                                'completed_approvals' => $completedApprovals,
                                'total_approvals' => $totalApprovals
                            ]);
                            $materialRequestUpdated = DB::table('material_requests')
                                ->where('id', $task->material_request_id)
                                ->update([
                                    'status_id' => 1, // Pending
                                    'updated_at' => now()
                                ]);
                            Log::info('=== MATERIAL REQUEST STATUS UPDATED TO PENDING ===', [
                                'task_id' => $task->id,
                                'material_request_id' => $task->material_request_id,
                                'new_status_id' => 1,
                                'update_success' => $materialRequestUpdated
                            ]);
                        } else {
                            if ($completedApprovals === 1) {
                                Log::info('=== FIRST MATERIAL REQUEST APPROVAL - SETTING status_id = 2 (Referred) ===', [
                                    'task_id' => $task->id,
                                    'material_request_id' => $task->material_request_id,
                                    'completed_approvals' => $completedApprovals,
                                    'total_approvals' => $totalApprovals
                                ]);
                                $materialRequestUpdated = DB::table('material_requests')
                                    ->where('id', $task->material_request_id)
                                    ->update([
                                        'status_id' => 2, // Referred
                                        'updated_at' => now()
                                    ]);
                                Log::info('=== MATERIAL REQUEST STATUS UPDATED TO REFERRED ===', [
                                    'task_id' => $task->id,
                                    'material_request_id' => $task->material_request_id,
                                    'new_status_id' => 2,
                                    'update_success' => $materialRequestUpdated
                                ]);
                            } else {
                                Log::info('=== INTERMEDIATE MATERIAL REQUEST APPROVAL - SETTING status_id = 53 (Draft) ===', [
                                    'task_id' => $task->id,
                                    'material_request_id' => $task->material_request_id,
                                    'completed_approvals' => $completedApprovals,
                                    'total_approvals' => $totalApprovals
                                ]);
                                $materialRequestUpdated = DB::table('material_requests')
                                    ->where('id', $task->material_request_id)
                                    ->update([
                                        'status_id' => 53, // Draft
                                        'updated_at' => now()
                                    ]);
                                Log::info('=== MATERIAL REQUEST STATUS UPDATED TO DRAFT ===', [
                                    'task_id' => $task->id,
                                    'material_request_id' => $task->material_request_id,
                                    'new_status_id' => 53,
                                    'update_success' => $materialRequestUpdated
                                ]);
                            }
                        }
                    }
                } else {
                    Log::warning('=== NO APPROVAL TRANSACTION FOUND FOR MATERIAL REQUEST ===', [
                        'task_id' => $task->id,
                        'material_request_id' => $task->material_request_id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);
                }
            }

            // Check if this is a Material Request task and if it's being rejected
            if ($task->material_request_id && $request->input('status') === 'Rejected') {
                Log::info('=== MATERIAL REQUEST TASK REJECTION CHECK ===', [
                    'task_id' => $task->id,
                    'material_request_id' => $task->material_request_id,
                    'current_status_id' => DB::table('material_requests')->where('id', $task->material_request_id)->value('status_id')
                ]);

                // Update the corresponding approval transaction
                $approvalTransaction = DB::table('material_request_transactions')
                    ->where('material_request_id', $task->material_request_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== UPDATING MATERIAL REQUEST APPROVAL TRANSACTION FOR REJECTION ===', [
                        'task_id' => $task->id,
                        'material_request_id' => $task->material_request_id,
                        'approval_transaction_id' => $approvalTransaction->id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('material_request_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Reject',
                            'updated_at' => now()
                        ]);

                    Log::info('=== MATERIAL REQUEST REJECTION TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'material_request_id' => $task->material_request_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Immediately update material request status to Rejected (status_id = 3)
                        $materialRequestUpdated = DB::table('material_requests')
                            ->where('id', $task->material_request_id)
                            ->update([
                                'status_id' => 3, // Rejected
                                'updated_at' => now()
                            ]);

                        Log::info('=== MATERIAL REQUEST REJECTION STATUS UPDATE RESULT ===', [
                            'task_id' => $task->id,
                            'material_request_id' => $task->material_request_id,
                            'update_success' => $materialRequestUpdated,
                            'new_status_id' => DB::table('material_requests')->where('id', $task->material_request_id)->value('status_id')
                        ]);
                    }
                } else {
                    Log::warning('=== NO APPROVAL TRANSACTION FOUND FOR MATERIAL REQUEST REJECTION ===', [
                        'task_id' => $task->id,
                        'material_request_id' => $task->material_request_id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);
                }
            }

            // === PAYMENT ORDER APPROVAL LOGIC ===
            if ($task->payment_order_id && $request->input('status') === 'Approved') {
                Log::info('=== PAYMENT ORDER TASK APPROVAL CHECK ===', [
                    'task_id' => $task->id,
                    'payment_order_id' => $task->payment_order_id,
                    'current_order_no' => $task->order_no,
                    'process_id' => $task->process_id,
                    'assigned_to_user_id' => $task->assigned_to_user_id
                ]);

                // Get total number of required approvals for this payment order
                $totalApprovals = DB::table('tasks')
                    ->where('payment_order_id', $task->payment_order_id)
                    ->where('process_id', $task->process_id)
                    ->count();

                // Get all tasks for this payment order to verify
                $allTasks = DB::table('tasks')
                    ->where('payment_order_id', $task->payment_order_id)
                    ->where('process_id', $task->process_id)
                    ->get();

                // Check if this is the final approval
                $isFinalApproval = (string)$task->order_no === (string)$totalApprovals;

                $paymentOrder = \App\Models\PaymentOrder::find($task->payment_order_id);
                if (!$paymentOrder) {
                    Log::error('=== PAYMENT ORDER NOT FOUND FOR APPROVAL ===', [
                        'payment_order_id' => $task->payment_order_id
                    ]);
                } else {
                    if ($isFinalApproval) {
                        // Final approver logic
                        $today = now();
                        $dueDate = $paymentOrder->due_date;
                        if ($dueDate && $dueDate->lt($today)) {
                            $paymentOrder->status = 'Overdue';
                        } else {
                            $paymentOrder->status = 'Approved';
                        }
                        $paymentOrder->save();
                        Log::info('=== FINAL PAYMENT ORDER APPROVAL - STATUS UPDATED (NEW LOGIC) ===', [
                            'payment_order_id' => $paymentOrder->id,
                            'new_status' => $paymentOrder->status
                        ]);
                    } else {
                        // First approver (not final)
                        $paymentOrder->status = 'Pending';
                        $paymentOrder->save();
                        Log::info('=== INTERMEDIATE PAYMENT ORDER APPROVAL - STATUS SET TO PENDING ===', [
                            'payment_order_id' => $paymentOrder->id
                        ]);
                    }
                }
            }

            // If any approver rejects, set status to Cancelled
            if ($task->payment_order_id && $request->input('status') === 'Rejected') {
                $paymentOrder = \App\Models\PaymentOrder::find($task->payment_order_id);
                if ($paymentOrder) {
                    $paymentOrder->status = 'Cancelled';
                    $paymentOrder->save();
                    Log::info('=== PAYMENT ORDER REJECTED - STATUS SET TO CANCELLED ===', [
                        'payment_order_id' => $paymentOrder->id
                    ]);
                }
            }

            DB::commit();

            Log::info('=== TASK UPDATE COMPLETED ===', [
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
            Log::error('=== TASK UPDATE FAILED ===', [
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
