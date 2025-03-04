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
use App\Models\Quotation;
use App\Http\Controllers\QuotationPDFController;

// Redirect root to login
Route::get('/', function () {
    return redirect()->route('login');
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
        return Inertia::render('Dashboard/RFQ/AddQuotationForm'); 
    })->name('dashboard.quotations.create');

    Route::get('/rfq', function () { 
        return Inertia::render('Dashboard/RFQ/RFQ'); 
    })->name('rfq');

    Route::get('/quotation', function () { 
        return Inertia::render('Dashboard/Quotations/Quotations'); 
    })->name('Quotation');

    Route::get('/new-quotation', function () { 
        return Inertia::render('Dashboard/Quotations/NewQuotation'); 
    })->name('new-quotation');

    Route::get('/quotation-to-rfq', function () { 
        return Inertia::render('Dashboard/Quotations/QuotationRFQ'); 
    })->name('quotation-to-rfq');

    Route::get('/view-order', function () { 
        return Inertia::render('Dashboard/Purchase Order/ViewOrder'); 
    })->name('view-order');

    Route::get('/approve-order', function () { 
        return Inertia::render('Dashboard/Purchase Order/ApproveOrder'); 
    })->name('approve-order');

    Route::get('/create-order', function () { 
        return Inertia::render('Dashboard/Purchase Order/CreateOrder'); 
    })->name('create-order');

    Route::get('/grn', function () { 
        return Inertia::render('Dashboard/GRN/GRNs'); 
    })->name('grn');

    Route::get('/receive-goods', function () { 
        return Inertia::render('Dashboard/GRN/ReceiveGoods'); 
    })->name('receive-goods');

    Route::get('/add-goods', function () { 
        return Inertia::render('Dashboard/GRN/AddGoods'); 
    })->name('add-goods');

    Route::get('/doc-status', function () { 
        return Inertia::render('Dashboard/Reports/Statuses'); 
    })->name('doc-status');

    Route::get('/report-logs', function () { 
        return Inertia::render('Dashboard/Reports/ReportLogs'); 
    })->name('report-logs');

    Route::get('/invoices', function () { 
        return Inertia::render('Dashboard/Invoices/Invoices'); 
    })->name('invoices');
    
    // RFQ Routes
    Route::get('/dashboard/quotations', [RFQController::class, 'index'])->name('dashboard.quotations.index');
    Route::get('/dashboard/quotations/create', [RFQController::class, 'create'])->name('dashboard.quotations.create');
    Route::post('/dashboard/quotations', [RFQController::class, 'store'])->name('dashboard.quotations.store');
    Route::get('/dashboard/quotations/{quotation}', [RFQController::class, 'show'])->name('dashboard.quotations.show');
    Route::get('/dashboard/quotations/{quotation}/edit', [RFQController::class, 'edit'])->name('dashboard.quotations.edit');
    Route::put('/dashboard/quotations/{quotation}', [RFQController::class, 'update'])->name('dashboard.quotations.update');
    Route::delete('/dashboard/quotations/{quotation}', [RFQController::class, 'destroy'])->name('dashboard.quotations.destroy');
    Route::get('/quotations/{id}/pdf', function ($id) {
        return Inertia::render('Dashboard/Quotations/QuotationPDF', [
            'quotation' => Quotation::with(['rfq', 'supplier', 'status', 'documents'])->findOrFail($id)
        ]);
    })->name('quotations.pdf');

    Route::get('/company-profile', function () { 
        return Inertia::render('Dashboard', ['page' => 'CompanyProfile/CompanyProfile']); 
    })->name('company.create');

    Route::get('/process-flow', function () { 
        return Inertia::render('Dashboard', ['page' => 'ProcessFlow/ProcessFlow']); 
    })->name('process.index');
    Route::get('/process-flow/create', function () { 
        return Inertia::render('Dashboard', ['page' => 'ProcessFlow/CreateProcessFlow']); 
    })->name('process.create');

    Route::get('/roles-permissions', function () { 
        return Inertia::render('Dashboard', ['page' => 'RolePermission/RolesPermissions']); 
    })->name('permission.index');

    Route::get('/notification-settings', function () { 
        return Inertia::render('Dashboard', ['page' => 'NotificationSettings/Notification']); 
    })->name('notification.index');

    Route::get('/tasks', function () { 
        return Inertia::render('Dashboard', ['page' => 'Tasks/TasksTable']); 
    })->name('tasks.index');
    Route::get('/tasks/new', function () { 
        return Inertia::render('Dashboard', ['page' => 'Tasks/ReviewTask']); 
    })->name('tasks.create');

    Route::get('/cost-centers', function () { 
        return Inertia::render('Dashboard', ['page' => 'Finance/CostCenter/CostCenterTable']); 
    })->name('costCenter.index');

    Route::get('/ledgers', function () { 
        return Inertia::render('Dashboard', ['page' => 'Finance/Ledgers/LedgersTable']); 
    })->name('ledgers.index');

    Route::get('/payment-orders', function () { 
        return Inertia::render('Dashboard', ['page' => 'Finance/PaymentOrder/PaymentOrderTable']); 
    })->name('paymentOrder.index');
    Route::get('/payment-orders/create', function () { 
        return Inertia::render('Dashboard', ['page' => 'Finance/PaymentOrder/CreatePaymentOrderTable']); 
    })->name('PaymentOrder.create');
    Route::get('/payment-orders/{id}/create-payment-order', function ($id) { 
        return Inertia::render('Dashboard', ['page' => 'Finance/PaymentOrder/CreatePaymentOrder']); 
    })->name('createPaymentOrder.create');

    Route::get('/account-receivables', function () { 
        return Inertia::render('Dashboard', ['page' => 'AccountReceivables/ReceivableTable']); 
    })->name('receivable.index');
    Route::get('/account-receivables/create', function () { 
        return Inertia::render('Dashboard', ['page' => 'AccountReceivables/CreateReceivable']); 
    })->name('receivable.create');
    Route::get('/account-receivables/view/{id}', function () { 
        return Inertia::render('Dashboard', ['page' => 'AccountReceivables/ViewReceivable']); 
    })->name('receivable.view');

    Route::get('/account-payables', function () { 
        return Inertia::render('Dashboard', ['page' => 'AccountPayables/PayablesTable']); 
    })->name('payables.index');
    Route::get('/account-payables/view/{id}', function () { 
        return Inertia::render('Dashboard', ['page' => 'AccountPayables/ViewPayable']); 
    })->name('payables.view');

    Route::get('/income-statement', function () { 
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/IncomeStatement/IncomeStatementTable']); 
    })->name('statement.index');

    // Profile routes
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

// Add these routes
Route::get('/quotations/{quotation}/pdf/view', [QuotationPDFController::class, 'show'])->name('quotations.pdf.view');
Route::get('/quotations/{quotation}/pdf/download', [QuotationPDFController::class, 'download'])->name('quotations.pdf.download');

Route::get('/quotations/rfq/{rfqId}', function ($rfqId) {
    return Inertia::render('Dashboard/Quotations/QuotationRFQ', [
        'params' => [
            'rfqId' => $rfqId
        ]
    ]);
})->name('quotations.rfq');

require __DIR__.'/auth.php';