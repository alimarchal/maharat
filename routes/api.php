<?php

use App\Http\Controllers\Api\V1\BrandController;
use App\Http\Controllers\Api\V1\CompanyController;
use App\Http\Controllers\Api\V1\InventoryAdjustmentController;
use App\Http\Controllers\Api\V1\InventoryTransferController;
use App\Http\Controllers\Api\V1\MaterialRequestController;
use App\Http\Controllers\Api\V1\MaterialRequestItemController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\ProcessController;
use App\Http\Controllers\Api\V1\ProcessStepController;
use App\Http\Controllers\Api\V1\ProductCategoryController;
use App\Http\Controllers\Api\V1\PurchaseOrderController;
use App\Http\Controllers\Api\V1\QuotationController;
use App\Http\Controllers\Api\V1\QuotationDocumentController;
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
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware(['auth:sanctum']);
Route::post('/check-email', [AuthController::class, 'checkEmail']);
Route::get('/statuses', [StatusController::class, 'index']);
//Route::post('/statuses', [StatusController::class, 'store']);

// API V1 routes
Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {

    Route::get('/users/hierarchy/{user?}', [UserController::class, 'hierarchy']);
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
    // Inventory routes
    Route::apiResource('inventories', InventoryController::class);
    // Inventory Adjustments routes
    Route::apiResource('inventory-adjustments', InventoryAdjustmentController::class);
    // Inventory Transfers routes
    Route::apiResource('inventory-transfers', InventoryTransferController::class);
    // Material Requests routes
    Route::apiResource('material-requests', MaterialRequestController::class);
    // Material Request Items routes
    Route::apiResource('material-request-items', MaterialRequestItemController::class);
    // RFQ routes
    Route::apiResource('rfqs', RfqController::class);
    // RFQ Items routes
    Route::apiResource('rfq-items', RfqItemController::class);

    Route::apiResource('suppliers', SupplierController::class);
    Route::apiResource('supplier-contacts', SupplierContactController::class);
    Route::apiResource('supplier-addresses', SupplierAddressController::class);
    Route::apiResource('quotations', QuotationController::class);
    Route::post('/quotation-documents', [QuotationDocumentController::class, 'store']);
    Route::put('/quotation-documents/{id}', [QuotationDocumentController::class, 'update']);


    // Process routes
    Route::apiResource('processes', ProcessController::class);
    Route::patch('processes/{process}/toggle-active', [ProcessController::class, 'toggleActive']);
    Route::patch('processes/{process}/status', [ProcessController::class, 'updateStatus']);

    // Process step routes
    Route::apiResource('process-steps', ProcessStepController::class);
    Route::patch('process-steps/{processStep}/status', [ProcessStepController::class, 'updateStatus']);
    Route::patch('process-steps/{processStep}/toggle-active', [ProcessStepController::class, 'toggleActive']);
    Route::post('process-steps/reorder', [ProcessStepController::class, 'reorder']);

    // Form Data Routes
    Route::get('/warehouses', [WarehouseController::class, 'index']);
    Route::get('/product-categories', [ProductCategoryController::class, 'index']);
    Route::get('/statuses', [StatusController::class, 'index']);
    Route::get('/units', [UnitController::class, 'index']);
    Route::get('/brands', [BrandController::class, 'index']);

    Route::get('/rfq-status-logs', [RfqStatusLogController::class, 'index']);
    Route::put('/rfq-status-logs/{id}', [RfqStatusLogController::class, 'update']);
    Route::delete('/rfq-status-logs/{id}', [RfqStatusLogController::class, 'destroy']);

    Route::get('/statuses/payment-types', [StatusController::class, 'getPaymentTypes']);

    Route::post('/api/v1/rfq-items', [RfqItemController::class, 'store']);
    Route::put('/api/v1/rfq-items', [RfqItemController::class, 'update']);

    Route::get('/rfq-categories/{rfq_id}', [RfqCategoryController::class, 'show']);

    Route::get('/quotations-by-rfq/{rfq_id}', [QuotationController::class, 'getQuotationsByRfq']);
    Route::post('/upload-terms', [QuotationController::class, 'uploadTerms']);
    Route::post('/update-quotations', [QuotationController::class, 'updateQuotations']);

    Route::get('/quotations/by-rfq/{rfqId}', [QuotationController::class, 'getByRfqId']);
    Route::post('/quotations/update-batch', [QuotationController::class, 'updateBatch']);
    Route::post('/quotations/upload-terms', [QuotationController::class, 'uploadTerms']);


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


});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware(['auth:sanctum']);

Route::middleware(['auth:sanctum'])->group(function () {
    // RFQ Routes
    Route::get('/rfqs', [RfqController::class, 'index']);
    Route::get('/rfqs/{id}', [RfqController::class, 'show']);
    Route::post('/rfqs', [RfqController::class, 'store']);
    Route::delete('/rfqs/{id}', [RfqController::class, 'destroy']);

    // RFQ Form Data endpoints
    Route::get('/form-data', [RfqController::class, 'getFormData']);
    Route::get('/warehouses', [WarehouseController::class, 'index']);
    Route::get('/product-categories', [ProductCategoryController::class, 'index']);
    Route::get('/statuses', [StatusController::class, 'index']);
    Route::get('/units', [UnitController::class, 'index']);
    Route::get('/brands', [BrandController::class, 'index']);
});

Route::get('download/{filename}', function ($filename) {
    $path = storage_path('app/public/rfq-attachments/' . $filename);

    if (!file_exists($path)) {
        abort(404);
    }

    return response()->file($path);
})->where('filename', '.*')->name('file.download');
