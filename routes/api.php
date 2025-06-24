<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Api\V1\AssetController;
use App\Http\Controllers\Api\V1\AssetTransactionController;
use App\Http\Controllers\Api\V1\BrandController;
use App\Http\Controllers\Api\V1\BudgetApprovalTransactionController;
use App\Http\Controllers\Api\V1\BudgetController;
use App\Http\Controllers\Api\V1\BudgetRequestApprovalTransactionController;
use App\Http\Controllers\Api\V1\BudgetRequestAttachmentController;
use App\Http\Controllers\Api\V1\BudgetUsageController;
use App\Http\Controllers\Api\V1\CashFlowTransactionController;
use App\Http\Controllers\Api\V1\ChartOfAccountController;
use App\Http\Controllers\Api\V1\CompanyController;
use App\Http\Controllers\Api\V1\CostCenterController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\DepartmentController;
use App\Http\Controllers\Api\V1\DesignationController;
use App\Http\Controllers\Api\V1\EquityAccountController;
use App\Http\Controllers\Api\V1\EquityTransactionController;
use App\Http\Controllers\Api\V1\ExpenseTransactionController;
use App\Http\Controllers\Api\V1\ExternalDeliveryNoteController;
use App\Http\Controllers\Api\V1\ExternalInvoiceController;
use App\Http\Controllers\Api\V1\FaqController;
use App\Http\Controllers\Api\V1\FinancialTransactionController;
use App\Http\Controllers\Api\V1\FiscalPeriodController;
use App\Http\Controllers\Api\V1\FiscalYearController;
use App\Http\Controllers\Api\V1\GrnController;
use App\Http\Controllers\Api\V1\GrnReceiveGoodController;
use App\Http\Controllers\Api\V1\InventoryAdjustmentController;
use App\Http\Controllers\Api\V1\InventoryTransactionController;
use App\Http\Controllers\Api\V1\InventoryTransferController;
use App\Http\Controllers\Api\V1\InvoiceController;
use App\Http\Controllers\Api\V1\InvoiceItemController;
use App\Http\Controllers\Api\V1\IssueMaterialController;
use App\Http\Controllers\Api\V1\MahratInvoiceApprovalTransactionController;
use App\Http\Controllers\Api\V1\ManualStepController;
use App\Http\Controllers\Api\V1\MaterialRequestController;
use App\Http\Controllers\Api\V1\MaterialRequestItemController;
use App\Http\Controllers\Api\V1\MaterialRequestTransactionController;
use App\Http\Controllers\Api\V1\NotificationChannelsController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\NotificationSettingsController;
use App\Http\Controllers\Api\V1\NotificationTypesController;
use App\Http\Controllers\Api\V1\PaymentOrderApprovalTransactionController;
use App\Http\Controllers\Api\V1\PaymentOrderController;
use App\Http\Controllers\Api\V1\PaymentOrderLogController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\PoApprovalTransactionController;
use App\Http\Controllers\Api\V1\ProcessController;
use App\Http\Controllers\Api\V1\ProcessStepController;
use App\Http\Controllers\Api\V1\ProductCategoryController;
use App\Http\Controllers\Api\V1\PurchaseOrderController;
use App\Http\Controllers\Api\V1\QuotationController;
use App\Http\Controllers\Api\V1\QuotationDocumentController;
use App\Http\Controllers\Api\V1\RequestBudgetController;
use App\Http\Controllers\Api\V1\RfqApprovalTransactionController;
use App\Http\Controllers\Api\V1\RfqController;
use App\Http\Controllers\Api\V1\RfqItemController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\SupplierAddressController;
use App\Http\Controllers\Api\V1\SupplierContactController;
use App\Http\Controllers\Api\V1\SupplierController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\TaskDescriptionController;
use App\Http\Controllers\Api\V1\UnitController;
use App\Http\Controllers\Api\V1\UserManualController;
use App\Http\Controllers\Api\V1\UserRoleController;
use App\Http\Controllers\Api\V1\WarehouseManagerController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\StatusController;
use App\Http\Controllers\Api\V1\WarehouseController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\ForgotPasswordController;
use App\Http\Controllers\Api\RfqApiController;
use App\Http\Controllers\Api\V1\RfqStatusLogController;
use App\Http\Controllers\Api\V1\RfqCategoryController;
use App\Http\Controllers\Api\V1\IncomeStatementController;
use App\Http\Controllers\Api\V1\BalanceSheetController;
use App\Http\Controllers\Api\V1\FaqApprovalController;
use App\Http\Controllers\Api\V1\CardController;
use App\Http\Controllers\ItemRequestController;
use App\Http\Controllers\Api\V1\AccountCodeController;

// Auth routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware(['auth:sanctum']);
Route::post('/check-email', [AuthController::class, 'checkEmail']);

// Cards endpoint for user manual guides - accessible without auth
Route::get('/v1/cards', [App\Http\Controllers\Api\V1\CardController::class, 'index']);
Route::post('/v1/cards/refresh', [App\Http\Controllers\Api\V1\CardController::class, 'refresh']);

// API V1 routes
Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {

    Route::get('/users/hierarchy/{user?}', [UserController::class, 'hierarchy']);
    Route::get('/users/hierarchy-level/{level}', [UserController::class, 'getUsersByLevel']);
    Route::get('/users/reporting-chain/{user?}', [UserController::class, 'reportingChain']);
    Route::get('/users/organogram/{user?}', [UserController::class, 'organogram']);
    Route::apiResource('users', UserController::class);
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::get('/user/current', [UserController::class, 'current']);

    // RFQ routes

    // Note the order is important - specific routes before resource routes
    Route::get('roles/hierarchy', [RoleController::class, 'hierarchy']);
    Route::post('roles/{role}/toggle-permission', [RoleController::class, 'togglePermission']);
    Route::get('/rfqs/without-purchase-orders', [RfqController::class, 'getRfqsWithoutPurchaseOrders']);
    Route::apiResource('roles', RoleController::class);
    Route::get('roles/{role}/permissions', [RoleController::class, 'getPermissions']);
    Route::get('roles/{role}/subordinates', [RoleController::class, 'subordinates']);
    Route::get('roles/{role}/superiors', [RoleController::class, 'superiors']);

    // User roles
    Route::post('/users/{user}/roles', [UserRoleController::class, 'assignRoles']);
    Route::get('/roles/{role}/users', [UserRoleController::class, 'getUsersByRole']);
    Route::get('/users/{user}/subordinates', [UserRoleController::class, 'getSubordinateUsers']);

    // Permissions
    Route::get('/permissions', [PermissionController::class, 'index']);
    Route::post('/permissions', [PermissionController::class, 'store']);

    Route::apiResource('companies', CompanyController::class);
    Route::apiResource('statuses', StatusController::class);
    Route::apiResource('warehouses', WarehouseController::class);
    Route::apiResource('warehouse-managers', WarehouseManagerController::class);

    Route::apiResource('units', UnitController::class);
    Route::apiResource('product-categories', ProductCategoryController::class);
    Route::apiResource('brands', BrandController::class);

    // Products routes
    Route::apiResource('products', ProductController::class);
    // Material Requests routes
    Route::apiResource('material-requests', MaterialRequestController::class);
    // Material Request Items routes
    Route::apiResource('material-request-items', MaterialRequestItemController::class);
    Route::apiResource('material-request-transactions', MaterialRequestTransactionController::class);

    // Request Items routes
    Route::apiResource('request-item', ItemRequestController::class);
    Route::put('request-item/{id}/status', [ItemRequestController::class, 'updateStatus']);
    Route::put('request-item/{id}/mark-requested', [ItemRequestController::class, 'markAsRequested']);

    // RFQ Requests routes
    Route::apiResource('rfq-requests', \App\Http\Controllers\Api\V1\RfqRequestController::class);
    Route::put('rfq-requests/{id}/status', [\App\Http\Controllers\Api\V1\RfqRequestController::class, 'updateStatus']);
    Route::put('rfq-requests/{id}/mark-requested', [\App\Http\Controllers\Api\V1\RfqRequestController::class, 'markRequested']);

    // RFQ routes
    Route::get('/rfqs/form-data', [RfqController::class, 'getFormData']);
    Route::apiResource('rfqs', RfqController::class);
    Route::post('/rfqs/{id}/upload-document', [RfqController::class, 'uploadDocument']);
    Route::post('/rfqs/{id}/upload-excel', [RfqController::class, 'uploadExcel']);
    // RFQ Items routes
    Route::apiResource('rfq-items', RfqItemController::class);

    Route::apiResource('suppliers', SupplierController::class);
    Route::apiResource('supplier-contacts', SupplierContactController::class);
    Route::apiResource('supplier-addresses', SupplierAddressController::class);

    Route::apiResource('quotations', QuotationController::class);
    Route::post('/quotation-documents', [QuotationDocumentController::class, 'store']);
    Route::put('/quotation-documents/{id}', [QuotationDocumentController::class, 'update']);

    // Inventory Management
    Route::apiResource('inventories', InventoryController::class);
    Route::get('inventories/low-stock', [InventoryController::class, 'getLowStockItems']);
    Route::post('/inventories/{id}/upload-excel', [InventoryController::class, 'uploadExcel']);
    Route::post('/inventories/{id}/upload-pdf', [InventoryController::class, 'uploadPDF']);

    // Process routes
    Route::apiResource('processes', ProcessController::class);
    Route::patch('processes/{process}/toggle-active', [ProcessController::class, 'toggleActive']);
    Route::patch('processes/{process}/status', [ProcessController::class, 'updateStatus']);

    // Process step routes
    Route::apiResource('process-steps', ProcessStepController::class);
    Route::get('process-steps/{processStep}/user/{user?}', [ProcessStepController::class, 'getApproverIdViaDesignation']);
    Route::patch('process-steps/{processStep}/status', [ProcessStepController::class, 'updateStatus']);
    Route::patch('process-steps/{processStep}/toggle-active', [ProcessStepController::class, 'toggleActive']);
    Route::post('process-steps/reorder', [ProcessStepController::class, 'reorder']);

    // Form Data Routes
    Route::get('/warehouses', [WarehouseController::class, 'index']);
    Route::get('/product-categories', [ProductCategoryController::class, 'index']);
    Route::get('/units', [UnitController::class, 'index']);
    Route::get('/brands', [BrandController::class, 'index']);

    Route::get('/rfq-status-logs', [RfqStatusLogController::class, 'index']);
    Route::put('/rfq-status-logs/{id}', [RfqStatusLogController::class, 'update']);
    Route::delete('/rfqs/{id}', [RfqController::class, 'destroy']);

    Route::get('/statuses/payment-types', [StatusController::class, 'getPaymentTypes']);

    Route::post('/api/v1/rfq-items', [RfqItemController::class, 'store']);
    Route::put('/api/v1/rfq-items', [RfqItemController::class, 'update']);

    Route::get('/rfq-categories/{rfq_id}', [RfqCategoryController::class, 'show']);
    Route::put('/rfq-categories/{rfq_id}', [RfqCategoryController::class, 'update']);

    Route::get('/quotations-by-rfq/{rfq_id}', [QuotationController::class, 'getQuotationsByRfq']);
    Route::post('/upload-terms', [QuotationController::class, 'uploadTerms']);
    Route::post('/update-quotations', [QuotationController::class, 'updateQuotations']);

    Route::get('/quotations/by-rfq/{rfqId}', [QuotationController::class, 'getByRfqId']);
    Route::post('/quotations/update-batch', [QuotationController::class, 'updateBatch']);
    Route::post('/quotations/upload-terms', [QuotationController::class, 'uploadTerms']);
    Route::get('/quotations/next-number', [QuotationController::class, 'getNextQuotationNumber']);

    // Purchase Orders API Routes
    Route::get('purchase-orders/applicable-fiscal-periods', [PurchaseOrderController::class, 'getApplicableFiscalPeriods']);
    Route::post('purchase-orders/validate-budget', [PurchaseOrderController::class, 'validateBudget']);
    Route::apiResource('purchase-orders', PurchaseOrderController::class);
    Route::post('purchase-orders/{id}/upload-document', [PurchaseOrderController::class, 'uploadDocument']);

    // Task Routes
    Route::apiResource('tasks', TaskController::class);
    Route::put('tasks/{task}/mark-as-read', [TaskController::class, 'markAsRead']);
    Route::get('tasks/urgency/{urgency}', [TaskController::class, 'getByUrgency']);

    // Task Description Routes
    Route::apiResource('task-descriptions', TaskDescriptionController::class);
    Route::get('task-descriptions/action/{action}', [TaskDescriptionController::class, 'getByAction']);
    Route::get('task-descriptions/task/{taskId}', [TaskDescriptionController::class, 'getByTaskId']);

    // GRN routes
    Route::apiResource('grns', GrnController::class);
    Route::post('/grns/save-all', [GrnController::class, 'saveAll']);

    // GRN Receive Goods routes
    Route::apiResource('grn-receive-goods', GrnReceiveGoodController::class);
    Route::apiResource('external-delivery-notes', ExternalDeliveryNoteController::class);

    // Stock operations by product
    Route::post('inventories/product/{product}/stock-in', [InventoryController::class, 'adjustInventoryByProduct'])->name('inventories.stock-in');
    Route::post('inventories/product/{product}/stock-out', [InventoryController::class, 'adjustInventoryByProduct'])->name('inventories.stock-out');
    Route::post('inventories/product/{product}/adjustment', [InventoryController::class, 'adjustInventoryByProduct'])->name('inventories.adjustment');

    // Additional inventory routes
    Route::get('products/{product}/inventory', [InventoryController::class, 'getProductInventory']);
    Route::get('warehouses/{warehouse}/inventory', [InventoryController::class, 'getWarehouseInventory']);
    // Inventory Adjustments routes
    Route::apiResource('inventory-adjustments', InventoryAdjustmentController::class);

    // Inventory Transfers routes
    Route::apiResource('inventory-transfers', InventoryTransferController::class);

    // End Inventory

    // Department routes
    Route::get('departments-tree', [DepartmentController::class, 'tree']);

    Route::apiResource('cost-centers', CostCenterController::class);
    Route::get('cost-centers-tree', [CostCenterController::class, 'tree']);
    Route::post('cost-centers/{id}/restore', [CostCenterController::class, 'restore']);

    Route::apiResource('accounts', AccountController::class);
    Route::post('accounts/{id}/restore', [AccountController::class, 'restore']);

    // Account Codes routes
    Route::apiResource('account-codes', AccountCodeController::class);

    Route::get('chart-of-accounts-tree', [ChartOfAccountController::class, 'tree']);
    Route::post('chart-of-accounts/{id}/restore', [ChartOfAccountController::class, 'restore']);
    Route::apiResource('chart-of-accounts', ChartOfAccountController::class);

    Route::post('fiscal-periods/{id}/restore', [FiscalPeriodController::class, 'restore']);
    Route::post('fiscal-periods/{fiscalPeriod}/close', [FiscalPeriodController::class, 'close']);
    Route::post('fiscal-periods/{fiscalPeriod}/reopen', [FiscalPeriodController::class, 'reopen']);
    Route::apiResource('fiscal-periods', FiscalPeriodController::class);
    
    // Fiscal Years routes
    Route::apiResource('fiscal-years', FiscalYearController::class);

    // Request Budget Routes
    Route::apiResource('request-budgets', RequestBudgetController::class);
    Route::post('request-budgets/{id}/restore', [RequestBudgetController::class, 'restore']);
    Route::patch('request-budgets/{requestBudget}/status', [RequestBudgetController::class, 'updateStatus']);
    
    // Budget Request Attachments
    Route::post('budget-request-attachments', [App\Http\Controllers\Api\V1\BudgetRequestAttachmentController::class, 'store']);
    Route::delete('budget-request-attachments/{id}', [App\Http\Controllers\Api\V1\BudgetRequestAttachmentController::class, 'destroy']);

    Route::apiResource('budgets', BudgetController::class);
    Route::post('budgets/{id}/restore', [BudgetController::class, 'restore']);
    Route::get('budgets/combination', [BudgetController::class, 'getForCombination']);

    // Customers routes
    Route::apiResource('customers', CustomerController::class);
    Route::post('customers/{id}/restore', [CustomerController::class, 'restore']);

    // Maharat Invoices
    Route::get('/next-invoice-number', [InvoiceController::class, 'getNextInvoiceNumber']);
    Route::apiResource('invoices', InvoiceController::class);
    Route::post('/invoices/{id}/upload-document', [InvoiceController::class, 'uploadDocument']);
    Route::post('invoices/{id}/restore', [InvoiceController::class, 'restore']);
    Route::put('/invoices/{id}/status', [InvoiceController::class, 'updateStatus']);

    Route::get('/invoices/payment-methods', [InvoiceController::class, 'getPaymentMethods']);

    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
    Route::get('/companies/{company}', [CompanyController::class, 'show']);


    Route::get('invoices/{invoice}/items', [InvoiceItemController::class, 'index']);
    Route::post('invoices/{invoice}/items', [InvoiceItemController::class, 'storeItems']);
    Route::put('invoices/{invoice}/items', [InvoiceItemController::class, 'updateItems']);

    // Payment Orders routes
    Route::apiResource('payment-orders', PaymentOrderController::class);
    Route::post('/payment-orders/{id}/upload-document', [PaymentOrderController::class, 'uploadDocument']);
    Route::post('/payment-orders/{id}/save-attachment', [PaymentOrderController::class, 'saveAttachment']);
    Route::get('/payment-orders/{id}/raw-data', [PaymentOrderController::class, 'rawData']);
    // Payment Order Logs routes
    Route::apiResource('payment-order-logs', PaymentOrderLogController::class);

    Route::get('users/organogram', [UserController::class, 'organogram']);
    Route::post('users/{id}/restore', [UserController::class, 'restore']);

    // Departments routes
    Route::apiResource('departments', DepartmentController::class);
    Route::post('departments/{id}/restore', [DepartmentController::class, 'restore']);

    Route::apiResource('designations', DesignationController::class);
    Route::post('designations/{id}/restore', [DesignationController::class, 'restore']);


    Route::get('/notification-types', [NotificationTypesController::class, 'index']);
    Route::get('/notification-channels', [NotificationChannelsController::class, 'index']);
    Route::get('users/{user}/notification-settings', [NotificationSettingsController::class, 'getUserSettings']);
    Route::post('users/{user}/notification-settings/setup-defaults', [NotificationSettingsController::class, 'setupDefaults']);
    Route::put('users/{user}/notification-settings', [NotificationSettingsController::class, 'updateSettings']);

    // Get all notifications (for authenticated user by default or specific user)
    Route::get('/notifications', [NotificationController::class, 'index']);
    // Create new notification(s)
    Route::post('/notifications', [NotificationController::class, 'store']);
    // Get notifications for a specific user
    Route::get('/users/{userId}/notifications', [NotificationController::class, 'userNotifications']);
    // Mark specific notification as read
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    // Mark all notifications as read
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    // Get unread notifications for a specific user
    Route::get('/users/{userId}/notifications/unread', [NotificationController::class, 'userUnreadNotifications']);

    // External Invoices
    Route::apiResource('external-invoices', ExternalInvoiceController::class);
    Route::post('external-invoices/{id}/restore', [ExternalInvoiceController::class, 'restore']);
    Route::get('purchase-orders/available', [ExternalInvoiceController::class, 'getAvailablePurchaseOrders'])->name('purchase-orders.available');
    
    // Invoice Documents
    Route::post('invoice-documents', [App\Http\Controllers\Api\V1\InvoiceDocumentController::class, 'store']);

    Route::apiResource('rfq-approval-transactions', RfqApprovalTransactionController::class);
    Route::apiResource('po-approval-transactions', PoApprovalTransactionController::class);
    Route::apiResource('budget-approval-transactions', BudgetApprovalTransactionController::class);
    Route::apiResource('payment-order-approval-trans', PaymentOrderApprovalTransactionController::class);
    Route::apiResource('mahrat-invoice-approval-trans', MahratInvoiceApprovalTransactionController::class);
    Route::apiResource('budget-request-approval-trans', BudgetRequestApprovalTransactionController::class);


    Route::apiResource('issue-materials', IssueMaterialController::class);
    Route::post('issue-materials/{id}/restore', [IssueMaterialController::class, 'restore'])->name('issue-materials.restore');

    Route::apiResource('financial-transactions', FinancialTransactionController::class);
    Route::post('financial-transactions/{id}/restore', [FinancialTransactionController::class, 'restore']);
    Route::post('financial-transactions/{financialTransaction}/approve', [FinancialTransactionController::class, 'approve']);
    Route::post('financial-transactions/{financialTransaction}/post', [FinancialTransactionController::class, 'post']);
    Route::post('financial-transactions/{financialTransaction}/cancel', [FinancialTransactionController::class, 'cancel']);
    Route::post('financial-transactions/{financialTransaction}/reverse', [FinancialTransactionController::class, 'reverse']);

    Route::apiResource('cash-flow-transactions', CashFlowTransactionController::class);

    // Expense transactions endpoint
    Route::get('/expense-transactions', [ExpenseTransactionController::class, 'index']);

    Route::controller(IncomeStatementController::class)->group(function () {
        Route::get('/income-statement/revenue', 'getRevenue');
        Route::get('/income-statement/expenses', 'getExpenses');
        Route::get('/income-statement/transactions', 'getTransactions');
    });

    Route::apiResource('assets', AssetController::class);
    Route::post('assets/{id}/restore', [AssetController::class, 'restore'])->name('assets.restore');

    // Asset Transaction routes
    Route::apiResource('asset-transactions', AssetTransactionController::class);
    Route::get('assets/{asset}/transactions', [AssetTransactionController::class, 'getAssetTransactions'])->name('assets.transactions');

    // Equity Account routes
    Route::apiResource('equity-accounts', EquityAccountController::class);
    Route::post('equity-accounts/{id}/restore', [EquityAccountController::class, 'restore'])->name('equity-accounts.restore');
    Route::get('equity-accounts/type/{type}', [EquityAccountController::class, 'getByType'])->name('equity-accounts.type');

    // Equity Transaction routes
    Route::apiResource('equity-transactions', EquityTransactionController::class);
    Route::get('equity-accounts/{equityAccount}/transactions', [EquityTransactionController::class, 'getAccountTransactions'])->name('equity-accounts.transactions');
    Route::get('equity-transactions/type/{type}', [EquityTransactionController::class, 'getByType'])->name('equity-transactions.type');
    Route::get('equity-transactions/date-range', [EquityTransactionController::class, 'getByDateRange'])->name('equity-transactions.date-range');

    // Balance Sheet Routes
    Route::get('/balance-sheet/fiscal-years', [BalanceSheetController::class, 'getFiscalYears']);
    Route::get('/balance-sheet/assets', [BalanceSheetController::class, 'getAssets']);
    Route::get('/balance-sheet/liabilities', [BalanceSheetController::class, 'getLiabilities']);
    Route::get('/balance-sheet/equity', [BalanceSheetController::class, 'getEquity']);
    Route::get('/balance-sheet/summary', [BalanceSheetController::class, 'getSummary']);

    Route::get('/roles/{role}/permissions', [RoleController::class, 'getPermissions']);
    Route::post('/roles/{role}/toggle-permission', [RoleController::class, 'togglePermission']);
    Route::get('/user/current-role', [UserController::class, 'getCurrentRole']);

    Route::get('/roles', [RoleController::class, 'index']);
    Route::get('/roles/{role}', [RoleController::class, 'show']);
    Route::put('/roles/{role}', [RoleController::class, 'update']);

    Route::get('/users/{user}/permissions', [UserController::class, 'getPermissions']);
    Route::post('/users/{user}/toggle-permission', [UserController::class, 'togglePermission']);

    // FAQ routes
    Route::get('/faqs', [FaqController::class, 'index']);
    Route::post('/faqs', [FaqController::class, 'store']);
    Route::put('/faqs/{faq}', [FaqController::class, 'update']);
    Route::delete('/faqs/{faq}', [FaqController::class, 'destroy']);
    Route::post('/faqs/reorder', [FaqController::class, 'reorder']);

    // FAQ Approval routes
    Route::get('/faqs/approval', [FaqApprovalController::class, 'view']);
    Route::post('/faqs/approval', [FaqApprovalController::class, 'store']);
    Route::put('/faqs/approval/{id}', [FaqApprovalController::class, 'update']);
    Route::delete('/faqs/approval/{id}', [FaqApprovalController::class, 'destroy']);

    Route::apiResource('budget-usages', BudgetUsageController::class);
    Route::get('budget-usages/cost-center/{costCenterId}/statistics', [BudgetUsageController::class, 'costCenterStatistics']);
    Route::get('budget-usages/fiscal-period/{fiscalPeriodId}/statistics', [BudgetUsageController::class, 'fiscalPeriodStatistics']);


    // User Manuals Routes
    Route::get('/user-manuals/check', [UserManualController::class, 'checkManualExists']);
    Route::get('/user-manuals/{id}/steps', [UserManualController::class, 'getSteps']);
    Route::post('/user-manuals/{userManual}/update', [UserManualController::class, 'update']);
    Route::apiResource('user-manuals', UserManualController::class);

    // Manual Step Routes
    Route::prefix('user-manuals/{userManual}')->group(function () {
        Route::get('steps', [ManualStepController::class, 'index']); // GET /api/v1/user-manuals/{userManualId}/steps
        Route::post('steps', [ManualStepController::class, 'store']); // POST /api/v1/user-manuals/{userManualId}/steps
        Route::get('steps/{step}', [ManualStepController::class, 'show']); // GET /api/v1/user-manuals/{userManualId}/steps/{stepId}
        Route::put('steps/{step}', [ManualStepController::class, 'update']); // PUT /api/v1/user-manuals/{userManualId}/steps/{stepId}
        Route::delete('steps/{step}', [ManualStepController::class, 'destroy']); // DELETE /api/v1/user-manuals/{userManualId}/steps/{stepId}
        Route::post('steps/reorder', [ManualStepController::class, 'reorder']); // POST /api/v1/user-manuals/{userManualId}/steps/reorder
    });

    // Screenshots for manual steps
    Route::post('steps/{step}/screenshots', [App\Http\Controllers\Api\V1\StepScreenshotController::class, 'store']);
    Route::put('steps/{step}/screenshots/{screenshot}', [App\Http\Controllers\Api\V1\StepScreenshotController::class, 'update']);
    Route::delete('steps/{step}/screenshots/{screenshot}', [App\Http\Controllers\Api\V1\StepScreenshotController::class, 'destroy']);
    Route::post('steps/{step}/screenshots/reorder', [App\Http\Controllers\Api\V1\StepScreenshotController::class, 'reorder']);

    // Balance Sheet PDF Routes
    Route::post('/balance-sheet/generate-pdf', [App\Http\Controllers\API\BalanceSheetPDFController::class, 'generatePDF']);
    Route::post('/balance-sheet/save-pdf', [App\Http\Controllers\API\BalanceSheetPDFController::class, 'savePDF']);
    Route::get('/balance-sheet/saved-pdfs/{year}', [App\Http\Controllers\API\BalanceSheetPDFController::class, 'getSavedPDFs']);

    // Card routes
    Route::post('/cards/reorder', [CardController::class, 'reorder']);
    Route::apiResource('cards', CardController::class);
    Route::post('/cards/{card}', [CardController::class, 'update']);
    Route::get('/cards/{card}/children', [CardController::class, 'checkForChildren']);

    // Process steps routes
    Route::post('/process-steps/reorder', [App\Http\Controllers\Api\V1\ProcessStepController::class, 'reorder']);

    Route::put('/rfqs/{id}/status', [RfqController::class, 'updateStatus']);

});
