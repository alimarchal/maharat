<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\PasswordResetLinkController;
use App\Models\Status;
use App\Http\Controllers\StatusController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\RFQController;

// Home Route
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'messages' => [
            'welcome' => __('messages.welcome')
        ],
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Dashboard Routes (Protected by Auth & Email Verification)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () { 
        return Inertia::render('Dashboard'); 
    })->name('dashboard');

    Route::get('/my-requests', function () { 
        return Inertia::render('Dashboard', ['page' => 'Requests/RequestIndex']); 
    })->name('requests.index');
    Route::get('/my-requests/create', function () { 
        return Inertia::render('Dashboard', ['page' => 'Requests/MakeRequest']); 
    })->name('requests.create');
    Route::get('/my-requests/{id}/edit', function ($id) { 
        return Inertia::render('Dashboard', ['page' => 'Requests/MakeRequest', 'requestId' => $id]); 
    })->name('requests.edit');

    Route::get('/warehouse', function () { 
        return Inertia::render('Dashboard/Warehouse/Warehouse'); 
    })->name('warehouse.index');

    Route::get('/rfq', [RFQController::class, 'index'])->name('rfq.index');
    Route::get('/rfq/create', [RFQController::class, 'create'])->name('rfq.create');
    Route::post('/rfq', [RFQController::class, 'store'])->name('rfq.store');
    Route::get('/rfq/{quotation}', [RFQController::class, 'show'])->name('rfq.show');
    Route::get('/rfq/{quotation}/pdf', [RFQController::class, 'generatePDF'])->name('rfq.pdf');

    Route::get('/statuses', [StatusController::class, 'index'])->name('statuses.index');
    Route::get('/status', function () { 
        return Inertia::render('Dashboard', ['page' => 'Status/StatusIndex']); 
    })->name('status.index');
    Route::get('/status/create', function () { 
        return Inertia::render('Dashboard', ['page' => 'Status/CreateStatus']); 
    })->name('status.create');
    Route::get('/status/{id}/edit', function ($id) { 
        return Inertia::render('Dashboard', ['page' => 'Status/CreateStatus', 'statusId' => $id]); 
    })->name('status.edit');

    Route::get('/units', [UnitController::class, 'index'])->name('units.index');
    Route::get('/units', function () { 
        return Inertia::render('Dashboard', ['page' => 'Units/UnitIndex']); 
    })->name('unit.index');
    Route::get('/units/create', function () { 
        return Inertia::render('Dashboard', ['page' => 'Units/CreateUnit']); 
    })->name('unit.create');
    Route::get('/units/{id}/edit', function ($id) { 
        return Inertia::render('Dashboard', ['page' => 'Units/CreateUnit', 'unitId' => $id]); 
    })->name('units.edit');

    Route::get('/product-categories', [ProductCategoryController::class, 'index'])->name('category.index');
    Route::get('/category', function () { 
        return Inertia::render('Dashboard', ['page' => 'Category/CategoryIndex']); 
    })->name('category.index');
    Route::get('/category/create', function () { 
        return Inertia::render('Dashboard', ['page' => 'Category/CreateCategory']); 
    })->name('category.create');
    Route::get('/category/{id}/edit', function ($id) { 
        return Inertia::render('Dashboard', ['page' => 'Category/CreateCategory', 'categoryId' => $id]); 
    })->name('category.edit');

    Route::get('/items', function () { 
        return Inertia::render('Dashboard', ['page' => 'Products/ProductIndex']); 
    })->name('product.index');
    Route::get('/items/create', function () { 
        return Inertia::render('Dashboard', ['page' => 'Products/CreateProduct']); 
    })->name('product.create');
    Route::get('/items/{id}/edit', function ($id) { 
        return Inertia::render('Dashboard', ['page' => 'Products/CreateProduct', 'productId' => $id]); 
    })->name('product.edit');

    Route::get('/warehouse-management', function () { 
        return Inertia::render('Dashboard', ['page' => 'WarehouseManagement/WarehouseIndex']); 
    })->name('warehouse.index');
    Route::get('/warehouse-management/create', function () { 
        return Inertia::render('Dashboard', ['page' => 'WarehouseManagement/CreateWarehouse']); 
    })->name('warehouse.create');
    Route::get('/warehouse-management/{id}/edit', function ($id) { 
        return Inertia::render('Dashboard', ['page' => 'WarehouseManagement/CreateWarehouse', 'warehouseId' => $id]); 
    })->name('warehouse.edit');

    Route::get('/quotations', function () { 
        return Inertia::render('Dashboard/Quotations/Quotation'); 
    })->name('dashboard.quotations.index');
    
    Route::get('/quotations/create', function () { 
        return Inertia::render('Dashboard/Quotations/AddQuotationForm'); 
    })->name('dashboard.quotations.create');

    Route::get('/rfq', function () { 
        return Inertia::render('Dashboard/Quotations/RFQ'); 
    })->name('rfq');
    
    // RFQ Routes
    Route::get('/dashboard/quotations', [RFQController::class, 'index'])->name('dashboard.quotations.index');
    Route::get('/dashboard/quotations/create', [RFQController::class, 'create'])->name('dashboard.quotations.create');
    Route::post('/dashboard/quotations', [RFQController::class, 'store'])->name('dashboard.quotations.store');
    Route::get('/dashboard/quotations/{quotation}', [RFQController::class, 'show'])->name('dashboard.quotations.show');
    Route::get('/dashboard/quotations/{quotation}/edit', [RFQController::class, 'edit'])->name('dashboard.quotations.edit');
    Route::put('/dashboard/quotations/{quotation}', [RFQController::class, 'update'])->name('dashboard.quotations.update');
    Route::delete('/dashboard/quotations/{quotation}', [RFQController::class, 'destroy'])->name('dashboard.quotations.destroy');
});

// Profile Routes (Only for Authenticated Users)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Forgot Password Route (Guest Only)
Route::middleware('guest')->group(function () {
    Route::get('/forgot-password', function () { 
        return Inertia::render('Auth/ForgotPassword');
    })->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');
});

// Language Switch Route
Route::get('language/{locale}', function ($locale) {
    app()->setLocale($locale);
    session()->put('locale', $locale);
    return redirect()->back();
})->name('language.switch');

Route::middleware(['auth', 'verified', 'role:Admin'])->group(function () {
    Route::get('/admin-dashboard', function () {
        return Inertia::render('Dashboard/AdminDashboard');
    })->name('admin.dashboard');
});

Route::middleware(['auth', 'verified', 'role:Manager'])->group(function () {
    Route::get('/manager-dashboard', function () {
        return Inertia::render('Dashboard/ManagerDashboard');
    })->name('manager.dashboard');
});

require __DIR__.'/auth.php';