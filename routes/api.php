<?php

use App\Http\Controllers\Api\V1\BrandController;
use App\Http\Controllers\Api\V1\InventoryAdjustmentController;
use App\Http\Controllers\Api\V1\InventoryTransferController;
use App\Http\Controllers\Api\V1\MaterialRequestController;
use App\Http\Controllers\Api\V1\MaterialRequestItemController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\ProductCategoryController;
use App\Http\Controllers\Api\V1\QuotationController;
use App\Http\Controllers\Api\V1\QuotationDocumentController;
use App\Http\Controllers\Api\V1\RfqController;
use App\Http\Controllers\Api\V1\RfqItemController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\SupplierAddressController;
use App\Http\Controllers\Api\V1\SupplierContactController;
use App\Http\Controllers\Api\V1\SupplierController;
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

// Auth routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');
Route::post('/check-email', [AuthController::class, 'checkEmail']);
Route::get('/statuses', [StatusController::class, 'index']);
//Route::post('/statuses', [StatusController::class, 'store']);

// API V1 routes
Route::middleware('auth')->prefix('v1')->group(function () { 

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
    Route::apiResource('quotation-documents', QuotationDocumentController::class);

});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth');

Route::middleware('auth')->group(function () {
    // RFQ Routes
    Route::get('/rfqs', [RfqApiController::class, 'index']);
    Route::delete('/rfqs/{id}', [RfqApiController::class, 'destroy']);
});
