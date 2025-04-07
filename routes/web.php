<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\PasswordResetLinkController;
use App\Models\Status;
use App\Http\Controllers\StatusController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\Api\V1\ProductCategoryController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\RfqController;
use App\Models\Quotation;
use App\Http\Controllers\QuotationPDFController;
use Illuminate\Http\Request;

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

    Route::get('/rfq', [RfqController::class, 'index'])->name('rfq.index');
    Route::get('/rfq/create', [RfqController::class, 'create'])->name('rfq.create');
    Route::post('/rfq', [RfqController::class, 'store'])->name('rfq.store');
    Route::get('/rfq/{quotation}', [RfqController::class, 'show'])->name('rfq.show');
    Route::get('/rfq/{quotation}/pdf', [RfqController::class, 'generatePDF'])->name('rfq.pdf');

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
        return Inertia::render('Dashboard', ['page' => 'Warehouse/Category/CategoryIndex']);
    })->name('category.index');
    Route::get('/category/create', function () {
        return Inertia::render('Dashboard', ['page' => 'Warehouse/Category/CreateCategory']);
    })->name('category.create');
    Route::get('/category/{id}/edit', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'Warehouse/Category/CreateCategory', 'categoryId' => $id]);
    })->name('category.edit');

    Route::get('/items', function () {
        return Inertia::render('Dashboard', ['page' => 'Warehouse/Products/ProductIndex']);
    })->name('product.index');
    Route::get('/items/create', function () {
        return Inertia::render('Dashboard', ['page' => 'Warehouse/Products/CreateProduct']);
    })->name('product.create');
    Route::get('/items/{id}/edit', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'Warehouse/Products/CreateProduct', 'productId' => $id]);
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

    Route::get('/quotations', function () { return Inertia::render('Dashboard/Quotations/Quotation'); })->name('dashboard.quotations.index');

    Route::get('/quotations/create', function (Request $request) {
        return Inertia::render('Dashboard/RFQ/AddQuotationForm', [
            'rfqId' => $request->query('rfqId')
        ]);
    })->name('quotations.create');   

    Route::get('/rfq', function () {
        return Inertia::render('Dashboard/RFQ/RFQ');
    })->name('rfq.index');

    Route::get('/quotation', function () { return Inertia::render('Dashboard/Quotations/Quotations'); })->name('Quotation');

    Route::get('/new-quotation', function () { return Inertia::render('Dashboard/Quotations/NewQuotation'); })->name('new-quotation');

    Route::get('/quotation-to-rfq', function () { return Inertia::render('Dashboard/Quotations/QuotationRFQ'); })->name('quotation-to-rfq');

    Route::get('/view-order', function () { return Inertia::render('Dashboard/Purchase Order/ViewOrder'); })->name('view-order');

    Route::get('/approve-order', function () { return Inertia::render('Dashboard/Purchase Order/ApproveOrder'); })->name('approve-order');

    Route::get('/create-order', function () { return Inertia::render('Dashboard/Purchase Order/CreateOrder'); })->name('create-order');

    Route::get('/goods-receiving-notes', function () {
        return Inertia::render('Dashboard', ['page' => 'Warehouse/GRN/GRNTable']);
    })->name('grns.index');
    Route::get('/goods-receiving-notes/create', function () {
        return Inertia::render('Dashboard', ['page' => 'Warehouse/GRN/CreateGRNTable']);
    })->name('grns.create');

    Route::get('/external-invoices', function () { return Inertia::render('Dashboard/Invoices/Invoices'); })->name('invoices');

    Route::get('/chart', function () {
        return Inertia::render('Dashboard', ['page' => 'Configuration/OrganizationalChart/Chart']);
    })->name('chart.index');

    Route::get('/users', function () { return Inertia::render('Dashboard/Users/Users'); })->name('users');

    //Route::get('/chart', function () { return Inertia::render('Dashboard/OrganizationalChart/Chart'); })->name('chart');

    Route::get('/rfq-status', function () { return Inertia::render('Dashboard/RFQ/RFQStatus'); })->name('rfq-status');
    
    Route::get('/reports', function () {
        return Inertia::render('Dashboard', ['page' => 'ReportsAndStatuses/Reports/ReportLogs']);
    })->name('reports.index');

    Route::get('/purchase-doc-status', function () {
        return Inertia::render('Dashboard', ['page' => 'ReportsAndStatuses/PurchaseDocStatus/PurchaseStatuses']);
    })->name('purchase.index');

    Route::get('/statuses', function () {
        return Inertia::render('Dashboard', ['page' => 'ReportsAndStatuses/ProcessStatus/ProcessStatus']);
    })->name('processStatus.index');
    Route::get('/statuses/request-status/{id}', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'ReportsAndStatuses/ProcessStatus/StatusFlow/MRStatusFlow', 'id' => $id]);
    })->name('processStatus.index');
    Route::get('/statuses/rfq-status/{id}', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'ReportsAndStatuses/ProcessStatus/StatusFlow/RFQStatusFlow', 'id' => $id]);
    })->name('processStatus.index');
    Route::get('/statuses/po-status/{id}', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'ReportsAndStatuses/ProcessStatus/StatusFlow/POStatusFlow', 'id' => $id]);
    })->name('processStatus.index');
    Route::get('/statuses/pmt-status/{id}', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'ReportsAndStatuses/ProcessStatus/StatusFlow/PMTStatusFlow', 'id' => $id]);
    })->name('processStatus.index');
    Route::get('/statuses/invoice-status/{id}', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'ReportsAndStatuses/ProcessStatus/StatusFlow/MInvoiceStatusFlow', 'id' => $id]);
    })->name('processStatus.index');
    Route::get('/statuses/budget-status/{id}', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'ReportsAndStatuses/ProcessStatus/StatusFlow/BudgetRequestStatusFlow', 'id' => $id]);
    })->name('processStatus.index');
    Route::get('/statuses/total-budget-status/{id}', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'ReportsAndStatuses/ProcessStatus/StatusFlow/TotalBudgetStatusFlow', 'id' => $id]);
    })->name('processStatus.index');

    Route::get('/inventory-tracking', function () {
        return Inertia::render('Dashboard', ['page' => 'Warehouse/Inventory/InventoryTable']);
    })->name('inventory.index');

    // RFQ Routes
    Route::get('/dashboard/quotations', [RfqController::class, 'index'])->name('dashboard.quotations.index');
    Route::get('/dashboard/quotations/create', [RfqController::class, 'create'])->name('dashboard.quotations.create');
    Route::post('/dashboard/quotations', [RfqController::class, 'store'])->name('dashboard.quotations.store');
    Route::get('/dashboard/quotations/{quotation}', [RfqController::class, 'show'])->name('dashboard.quotations.show');
    Route::get('/dashboard/quotations/{quotation}/edit', [RfqController::class, 'edit'])->name('dashboard.quotations.edit');
    Route::put('/dashboard/quotations/{quotation}', [RfqController::class, 'update'])->name('dashboard.quotations.update');
    Route::delete('/dashboard/quotations/{quotation}', [RfqController::class, 'destroy'])->name('dashboard.quotations.destroy');
    Route::get('/quotations/{id}/pdf', function ($id) {
        return Inertia::render('Dashboard/Quotations/QuotationPDF', [
            'quotation' => Quotation::with(['rfq', 'supplier', 'status', 'documents'])->findOrFail($id)
        ]);
    })->name('quotations.pdf');

    Route::get('/company-profile', function () {
        return Inertia::render('Dashboard', ['page' => 'CompanyProfile/CompanyProfile']);
    })->name('company.create');

    Route::get('/process-flow', function () {
        return Inertia::render('Dashboard', ['page' => 'Configuration/ProcessFlow/ProcessFlow']);
    })->name('process.index');
    Route::get('/process-flow/create', function () {
        return Inertia::render('Dashboard', ['page' => 'Configuration/ProcessFlow/CreateProcessFlow']);
    })->name('process.create');

    Route::get('/roles-permissions', function () {
        return Inertia::render('Dashboard', ['page' => 'Configuration/RolePermission/RolesPermissions']);
    })->name('permission.index');

    Route::get('/notification-settings', function () {
        return Inertia::render('Dashboard', ['page' => 'Configuration/NotificationSettings/Notification']);
    })->name('notification.index');

    Route::get('/users', function () {
        return Inertia::render('Dashboard', ['page' => 'Configuration/Users/Users']);
    })->name('users.index');

    Route::get('/tasks', function () {
        return Inertia::render('Dashboard', ['page' => 'MyTasks/Tasks/TasksTable']);
    })->name('tasks.index');
    Route::get('/tasks/{id}/new', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'MyTasks/Tasks/ReviewTask', 'id' => $id]);
    })->name('tasks.create');

    Route::get('/approve-budget', function () {
        return Inertia::render('Dashboard', ['page' => 'MyTasks/ApproveBudgetRequest/ApproveBudgetForm']);
    })->name('approveBudgets.create');

    Route::get('/maharat-invoices', function () {
        return Inertia::render('Dashboard', ['page' => 'Finance/MaharatInvoices/MaharatInvoicesTable']);
    })->name('maharatInvoices.index');

    Route::get('/maharat-invoices/create', function () {
        return Inertia::render('Dashboard', ['page' => 'Finance/MaharatInvoices/CreateMaharatInvoice']);
    })->name('maharatInvoices.create');

    Route::get('/maharat-invoices/create/{id?}', function ($id = null) {
    return Inertia::render('Dashboard', [
        'page' => 'Finance/MaharatInvoices/CreateMaharatInvoice',
        'invoiceId' => $id  
    ]);
    })->name('maharatInvoices.edit');

    Route::get('/accounts', function () {
        return Inertia::render('Dashboard', ['page' => 'Finance/Accounts/AccountsTable']);
    })->name('accounts.index');

    Route::get('/payment-orders', function () {
        return Inertia::render('Dashboard', ['page' => 'Finance/PaymentOrder/PaymentOrderTable']);
    })->name('paymentOrder.index');
    Route::get('/payment-orders/create', function () {
        return Inertia::render('Dashboard', ['page' => 'Finance/PaymentOrder/CreatePaymentOrderTable']);
    })->name('PaymentOrder.create');

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

    Route::get('/cost-centers', function () {
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/CostCenter/CostCenterTable']);
    })->name('costCenter.index');

    Route::get('/cost-centers/sub-cost-centers', function () {
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/SubCostCenter/SubCostCenterTable']);
    })->name('subCostCenter.index');

    Route::get('/income-statement', function () {
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/IncomeStatement/IncomeStatementTable']);
    })->name('statement.index');
    Route::get('/income-statement/details/{id}', function () {
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/IncomeStatement/ViewIncomeStatement']);
    })->name('statement.view');

    Route::get('/balance-sheet', function () {
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/BalanceSheet/ViewBalanceSheet']);
    })->name('balance.index');

    Route::get('/budget', function () {
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/Budget/BudgetTable']);
    })->name('budget.index');
    Route::get('/budget/create', function () {
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/Budget/CreateBudget']);
    })->name('budget.create');
    Route::get('/budget/details/{id}', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/Budget/ViewBudget','budgetId' => $id]);
    })->name('budget.view');

    Route::get('/request-budgets', function () {
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/RequestABudget/RequestBudgetTable']);
    })->name('budget.index');
    Route::get('/request-budgets/create', function () {
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/RequestABudget/BudgetRequestForm']);
    })->name('budget.create');

    Route::get('/material-requests', function () {
        return Inertia::render('Dashboard', ['page' => 'Warehouse/ReceivedMaterialRequest/ReceivedMRsTable']);
    })->name('material.index');

    Route::get('/customers', function () {
        return Inertia::render('Dashboard', ['page' => 'Customers/CustomersTable']);
    })->name('customer.index');
    Route::get('/customers/create', function () {
        return Inertia::render('Dashboard', ['page' => 'Customers/CreateCustomers']);
    })->name('customer.create');
    Route::get('/customers/{id}/edit', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'Customers/CreateCustomers', 'customerId' => $id]);
    })->name('customer.edit');

    Route::get('/suppliers', function () {
        return Inertia::render('Dashboard', ['page' => 'Suppliers/SuppliersTable']);
    })->name('supplier.index');
    Route::get('/suppliers/create', function () {
        return Inertia::render('Dashboard', ['page' => 'Suppliers/CreateSuppliers']);
    })->name('supplier.create');
    Route::get('/suppliers/{id}/edit', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'Suppliers/CreateSuppliers', 'supplierId' => $id]);
    })->name('supplier.edit');

    // Profile routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // FAQ route
    Route::get('/faqs', function () {
        return Inertia::render('FAQs/FAQ');
    })->name('faqs.index');
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

Route::get('/debug-storage', function () {
    $path = 'rfq-attachments/PassportMADA.pdf';
    
    // Check if the file exists in storage
    $exists = Storage::disk('public')->exists($path);
    
    // Get the full path to the file
    $fullPath = Storage::disk('public')->path($path);
    
    // Check if it's readable
    $isReadable = is_readable($fullPath);
    
    // Get the URL
    $url = Storage::disk('public')->url($path);
    
    return [
        'file_exists' => $exists,
        'full_path' => $fullPath, 
        'is_readable' => $isReadable,
        'url' => $url,
        'storage_path' => storage_path('app/public'),
        'public_path' => public_path('storage')
    ];
});

require __DIR__.'/auth.php';
