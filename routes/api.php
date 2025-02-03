<?php

use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\ProductCategoryController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\UnitController;
use App\Http\Controllers\Api\V1\UserRoleController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\StatusController;
use App\Http\Controllers\Api\V1\WarehouseController;

// Auth routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// API V1 routes
Route::prefix('v1')->middleware(['auth:sanctum'])->group(function () {

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
    Route::apiResource('units', UnitController::class);
    Route::apiResource('product-categories', ProductCategoryController::class);



});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
