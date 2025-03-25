<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Api\V1\BrandController;
use App\Http\Controllers\Api\V1\BudgetApprovalTransactionController;
use App\Http\Controllers\Api\V1\BudgetController;
use App\Http\Controllers\Api\V1\BudgetRequestApprovalTransactionController;
use App\Http\Controllers\Api\V1\ChartOfAccountController;
use App\Http\Controllers\Api\V1\CompanyController;
use App\Http\Controllers\Api\V1\CostCenterController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\DepartmentController;
use App\Http\Controllers\Api\V1\DesignationController;
use App\Http\Controllers\Api\V1\ExternalDeliveryNoteController;
use App\Http\Controllers\Api\V1\ExternalInvoiceController;
use App\Http\Controllers\Api\V1\FinancialTransactionController;
use App\Http\Controllers\Api\V1\FiscalPeriodController;
use App\Http\Controllers\Api\V1\GrnController;
use App\Http\Controllers\Api\V1\GrnReceiveGoodController;
use App\Http\Controllers\Api\V1\InventoryAdjustmentController;
use App\Http\Controllers\Api\V1\InventoryTransactionController;
use App\Http\Controllers\Api\V1\InventoryTransferController;
use App\Http\Controllers\Api\V1\InvoiceController;
use App\Http\Controllers\Api\V1\IssueMaterialController;
use App\Http\Controllers\Api\V1\MahratInvoiceApprovalTransactionController;
use App\Http\Controllers\Api\V1\MaterialRequestController;
use App\Http\Controllers\Api\V1\MaterialRequestItemController;
use App\Http\Controllers\Api\V1\MaterialRequestTransactionController;
use App\Http\Controllers\Api\V1\NotificationController;
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

// Auth routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware(['auth:sanctum']);
Route::post('/check-email', [AuthController::class, 'checkEmail']);

// API V1 routes
Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {

    Route::get('/users/hierarchy/{user?}', [UserController::class, 'hierarchy']);
    Route::get('/users/hierarchy-level/{level}', [UserController::class, 'getUsersByLevel']);
    Route::get('/users/reporting-chain/{user?}', [UserController::class, 'reportingChain']);
    Route::get('/users/organogram/{user?}', [UserController::class, 'organogram']);
    Route::apiResource('users', UserController::class);

    // Note the order is important - specific routes before resource routes
    Route::get('roles/hierarchy', [RoleController::class, 'hierarchy']);
    Route::apiResource('roles', RoleController::class);
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

    // RFQ routes
    Route::get('/rfqs/form-data', [RfqController::class, 'getFormData']);
    Route::apiResource('rfqs', RfqController::class);
    // RFQ Items routes
    Route::apiResource('rfq-items', RfqItemController::class);

    Route::apiResource('suppliers', SupplierController::class);
    Route::apiResource('supplier-contacts', SupplierContactController::class);
    Route::apiResource('supplier-addresses', SupplierAddressController::class);

    Route::apiResource('quotations', QuotationController::class);
    Route::post('/quotation-documents', [QuotationDocumentController::class, 'store']);
    Route::put('/quotation-documents/{id}', [QuotationDocumentController::class, 'update']);

    Route::get('/inventories', [InventoryController::class, 'index']);
    Route::post('/inventories', [InventoryController::class, 'store']);
    Route::put('/inventories/{id}', [InventoryController::class, 'update']);
    Route::delete('/inventories/{id}', [InventoryController::class, 'destroy']);

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

    Route::get('/purchaseorder/next-number', [PurchaseOrderController::class, 'getNextPurchaseOrderNumber']);
    Route::apiResource('purchase-orders', PurchaseOrderController::class);

    // Task Routes
    Route::apiResource('tasks', TaskController::class);
    Route::put('tasks/{task}/mark-as-read', [TaskController::class, 'markAsRead']);
    Route::get('tasks/urgency/{urgency}', [TaskController::class, 'getByUrgency']);

    // Task Description Routes
    Route::apiResource('task-descriptions', TaskDescriptionController::class);
    Route::get('task-descriptions/action/{action}', [TaskDescriptionController::class, 'getByAction']);
    Route::get('task-descriptions/task/{taskId}', [TaskDescriptionController::class, 'getByTaskId']);

    // Purchase Orders API Routes
    Route::apiResource('purchase-orders', PurchaseOrderController::class);
    // GRN routes
    Route::apiResource('grns', GrnController::class);
    Route::post('/grns/save-all', [GrnController::class, 'saveAll']);

    // GRN Receive Goods routes
    Route::apiResource('grn-receive-goods', GrnReceiveGoodController::class);
    Route::apiResource('external-delivery-notes', ExternalDeliveryNoteController::class);


    // Category Routes
    Route::get('/categories', [CategoryController::class, 'index']);


    // Start Inventory
    // Inventory Management
    Route::get('inventories/low-stock', [InventoryController::class, 'getLowStockItems']);
    Route::apiResource('inventories', InventoryController::class);

    // Inventory Transactions
    Route::apiResource('inventory-transactions', InventoryTransactionController::class)->only(['index', 'show']);

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
    Route::apiResource('departments', DepartmentController::class);
    Route::get('departments-tree', [DepartmentController::class, 'tree']);
    Route::post('departments/{id}/restore', [DepartmentController::class, 'restore']);


    Route::apiResource('cost-centers', CostCenterController::class);
    Route::get('cost-centers-tree', [CostCenterController::class, 'tree']);
    Route::post('cost-centers/{id}/restore', [CostCenterController::class, 'restore']);

//    Route::apiResource('ledgers', LedgerController::class);
//    Route::post('ledgers/{id}/restore', [LedgerController::class, 'restore']);

    Route::apiResource('accounts', AccountController::class);
    Route::post('accounts/{id}/restore', [AccountController::class, 'restore']);


    Route::get('chart-of-accounts-tree', [ChartOfAccountController::class, 'tree']);
    Route::post('chart-of-accounts/{id}/restore', [ChartOfAccountController::class, 'restore']);
    Route::apiResource('chart-of-accounts', ChartOfAccountController::class);



    Route::post('fiscal-periods/{id}/restore', [FiscalPeriodController::class, 'restore']);
    Route::post('fiscal-periods/{fiscalPeriod}/close', [FiscalPeriodController::class, 'close']);
    Route::post('fiscal-periods/{fiscalPeriod}/reopen', [FiscalPeriodController::class, 'reopen']);
    Route::apiResource('fiscal-periods', FiscalPeriodController::class);
    // Request Budget Routes
    Route::apiResource('request-budgets', RequestBudgetController::class);
    Route::post('request-budgets/{id}/restore', [RequestBudgetController::class, 'restore']);
    Route::patch('request-budgets/{requestBudget}/status', [RequestBudgetController::class, 'updateStatus']);

    Route::apiResource('budgets', BudgetController::class);
    Route::post('budgets/{id}/restore', [BudgetController::class, 'restore']);

    // Customers routes
    Route::apiResource('customers', CustomerController::class);
    Route::post('customers/{id}/restore', [CustomerController::class, 'restore']);

    // Maharat Invoices
    Route::get('/invoices/next-number', [InvoiceController::class, 'getNextInvoiceNumber']);
    Route::apiResource('invoices', InvoiceController::class);
    Route::post('invoices/{id}/restore', [InvoiceController::class, 'restore']);

    Route::get('/invoices/payment-methods', [InvoiceController::class, 'getPaymentMethods']);

    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
    Route::get('/companies/{company}', [CompanyController::class, 'show']);


    Route::get('invoices/{invoice}/items', [InvoiceItemController::class, 'index']);
    Route::post('invoices/{invoice}/items', [InvoiceItemController::class, 'storeItems']);
    Route::put('invoices/{invoice}/items', [InvoiceItemController::class, 'updateItems']);

    // Payment Orders routes
    Route::apiResource('payment-orders', PaymentOrderController::class);
    // Payment Order Logs routes
    Route::apiResource('payment-order-logs', PaymentOrderLogController::class);
    Route::apiResource('designations', DesignationController::class);

    Route::get('users/organogram', [UserController::class, 'organogram']);
    Route::post('users/{id}/restore', [UserController::class, 'restore']);

    // Departments routes
    Route::apiResource('departments', DepartmentController::class);
    Route::post('departments/{id}/restore', [DepartmentController::class, 'restore']);

    Route::apiResource('designations', DesignationController::class);
    Route::post('designations/{id}/restore', [DesignationController::class, 'restore']);


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



});


//Route::get('/api/files/{path}', function ($path) {
//    $fullPath = 'rfq-attachments/' . $path;
//
//    if (Storage::disk('public')->exists($fullPath)) {
//        return Storage::disk('public')->download($fullPath);
//    }
//
//    abort(404, 'File not found');
//})->where('path', '.*')->name('file.download');
