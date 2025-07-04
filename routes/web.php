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
use App\Http\Controllers\FAQController;

// Redirect root to login
Route::get('/', function () {
    return redirect()->route('login');
});

// Dashboard Routes (Protected by Auth & Email Verification)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/user-profile', function () {
        return Inertia::render('Dashboard', ['page' => 'UserProfile/UserProfile']);
    })->name('userProfile.index');

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
    })->name('category.page');
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
    })->name('warehouse.management.index');
    Route::get('/warehouse-management/create', function () {
        return Inertia::render('Dashboard', ['page' => 'WarehouseManagement/CreateWarehouse']);
    })->name('warehouse.create');
    Route::get('/warehouse-management/{id}/edit', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'WarehouseManagement/CreateWarehouse', 'warehouseId' => $id]);
    })->name('warehouse.edit');

    Route::get('/rfqs', function () { return Inertia::render('Dashboard', ['page' => 'ProcurementCenter/RFQ/RFQ']); })->name('rfq.index');
    Route::get('/rfqs/create-rfq', function () { return Inertia::render('Dashboard', ['page' => 'ProcurementCenter/RFQ/AddQuotationForm']); })->name('rfq.create');
    Route::get('/rfqs/{id}/edit', function ($id) { return Inertia::render('Dashboard', ['page' => 'ProcurementCenter/RFQ/AddQuotationForm', 'rfqId' => $id]); })->name('rfq.edit');

    Route::prefix('quotations')->name('quotations.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Dashboard', ['page' => 'ProcurementCenter/Quotations/Quotations']);
        })->name('list');
        Route::get('/create-quotation', function () {
            return Inertia::render('Dashboard', [
                'page' => 'ProcurementCenter/Quotations/NewQuotation']);
        })->name('create');
        Route::get('/create-quotation/add-quotation-to-rfq', function () {
            return Inertia::render('Dashboard', [
                'page' => 'ProcurementCenter/Quotations/QuotationRFQ']);
        })->name('add-to-rfq');
    });

    Route::get('/purchase-orders', function () { return Inertia::render('Dashboard', ['page' => 'ProcurementCenter/PurchaseOrder/ViewOrder']); })->name('view-order');
    Route::get('/purchase-orders/create-order', function () { return Inertia::render('Dashboard', ['page' => 'ProcurementCenter/PurchaseOrder/CreateOrder']); })->name('create-order');

    Route::get('/external-invoices', function () { return Inertia::render('Dashboard', ['page' => 'ProcurementCenter/Invoices/Invoices']); })->name('invoices');

    Route::get('/goods-receiving-notes', function () {
        return Inertia::render('Dashboard', ['page' => 'Warehouse/GRN/GRNTable']);
    })->name('grns.page');
    Route::get('/goods-receiving-notes/create', function () {
        return Inertia::render('Dashboard', ['page' => 'Warehouse/GRN/CreateGRNTable']);
    })->name('grns.create');

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
    })->name('processStatus.request');
    Route::get('/statuses/rfq-status/{id}', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'ReportsAndStatuses/ProcessStatus/StatusFlow/RFQStatusFlow', 'id' => $id]);
    })->name('processStatus.rfq');
    Route::get('/statuses/po-status/{id}', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'ReportsAndStatuses/ProcessStatus/StatusFlow/POStatusFlow', 'id' => $id]);
    })->name('processStatus.po');
    Route::get('/statuses/pmt-status/{id}', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'ReportsAndStatuses/ProcessStatus/StatusFlow/PMTStatusFlow', 'id' => $id]);
    })->name('processStatus.pmt');
    Route::get('/statuses/invoice-status/{id}', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'ReportsAndStatuses/ProcessStatus/StatusFlow/MInvoiceStatusFlow', 'id' => $id]);
    })->name('processStatus.invoice');
    Route::get('/statuses/budget-status/{id}', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'ReportsAndStatuses/ProcessStatus/StatusFlow/BudgetRequestStatusFlow', 'id' => $id]);
    })->name('processStatus.budget');
    Route::get('/statuses/total-budget-status/{id}', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'ReportsAndStatuses/ProcessStatus/StatusFlow/TotalBudgetStatusFlow', 'id' => $id]);
    })->name('processStatus.totalBudget');

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
    })->name('tasks.page');
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
    })->name('accounts.page');
    Route::get('/accounts/{id}/details', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'Finance/Accounts/AccountDetailsTable', 'accountId' => $id]);
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
    Route::get('/account-receivables/{id}/details', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'AccountReceivables/ViewReceivableDetails', 'receivableId' => $id]);
    })->name('receivable.index');

    Route::get('/account-payables', function () {
        return Inertia::render('Dashboard', ['page' => 'AccountPayables/PayablesTable']);
    })->name('payables.index');
    Route::get('/account-payables/{id}/details', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'AccountPayables/ViewPayableDetails', 'payableId' => $id]);
    })->name('payables.index');

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

    Route::get('/balance-sheet-old', function () {
        return Inertia::render('Dashboard/BudgetAndAccounts/BalanceSheet/BalanceSheetOld');
    })->name('balance-old.index');

    Route::get('/budget', function () {
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/Budget/BudgetTable']);
    })->name('budget.index');
    Route::get('/budget/create', function () {
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/Budget/CreateBudget']);
    })->name('budget.create');
    Route::get('/budget/details/{id}', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/Budget/ViewBudget','budgetId' => $id]);
    })->name('budget.view');

    Route::get('/budget/fiscal-years', function () {
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/Budget/EditFiscalPeriod']);
    })->name('fiscal-periods.index');

    Route::get('/request-budgets', function () {
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/RequestABudget/RequestBudgetTable']);
    })->name('requestBudget.index');
    Route::get('/request-budgets/create', function () {
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/RequestABudget/BudgetRequestForm']);
    })->name('requestBudget.create');
    Route::get('/request-budgets/{id}/edit', function ($id) {
        return Inertia::render('Dashboard', ['page' => 'BudgetAndAccounts/RequestABudget/BudgetRequestForm', 'budgetRequestId' => $id]);
    })->name('requestBudget.edit');

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
    
    // user manual routes
    Route::get('/user-manual', function () {
        return Inertia::render('Dashboard', ['page' => 'UserManual/UserManual']);
    })->name('user-manual.index');

    // Guide details by ID
    Route::get('/user-manual/guide/{id}', function ($id) {
        $numericId = is_numeric($id) ? (int)$id : $id;
        $guide = \App\Models\UserManual::with('card')->find($numericId);
        
        if ($guide && $guide->card) {
            $card = $guide->card;
            $parentCard = \App\Models\Card::find($card->parent_id);
            $mainCard = $parentCard ? \App\Models\Card::find($parentCard->parent_id) : null;
            
            return Inertia::render('Dashboard', [
                'page' => 'UserManual/GuideDetail',
                'id' => $numericId,
                'sectionId' => $mainCard ? $mainCard->section_id : null,
                'subsectionId' => $parentCard ? $parentCard->subsection_id : null,
                'cardId' => $card->id,
                'card' => $card->toArray()
            ]);
        }
        
        return Inertia::render('Dashboard', [
            'page' => 'UserManual/GuideDetail',
            'id' => $numericId
        ]);
    })->name('user-manual.guide');

    // For sections (both with and without subsections)
    Route::get('/user-manual/{sectionId}', function ($sectionId) {
        $card = \App\Models\Card::where('section_id', $sectionId)->first();
        
        if ($card && $card->children()->exists()) {
            return Inertia::render('Dashboard', [
                'page' => 'UserManual/ManualSubSection',
                'section' => $sectionId
            ]);
        } else {
            return Inertia::render('Dashboard', [
                'page' => 'UserManual/GuideDetail',
                'section' => $sectionId
            ]);
        }
    })->name('user-manual.section');

    // For subsection details
    Route::get('/user-manual/{sectionId}/{subsectionId}', function ($sectionId, $subsectionId) {
        \Log::info('ManualSubSection route hit', [
            'sectionId' => $sectionId,
            'subsectionId' => $subsectionId,
            'url' => request()->url()
        ]);

        // First try to find the card by id
        $card = \App\Models\Card::where('id', $subsectionId)->first();
        
        // If not found, try to find by subsection_id
        if (!$card) {
            $card = \App\Models\Card::where('subsection_id', $subsectionId)->first();
        }

        // If still not found, try to find by section_id and id
        if (!$card) {
            $card = \App\Models\Card::where('section_id', $sectionId)
                ->where('id', $subsectionId)
                ->first();
        }

        \Log::info('Card found', [
            'card' => $card ? $card->toArray() : null,
            'hasChildren' => $card ? $card->children()->exists() : false,
            'url' => request()->url()
        ]);

        if (!$card) {
            \Log::info('No card found, rendering ManualSubSection', [
                'sectionId' => $sectionId,
                'subsectionId' => $subsectionId,
                'url' => request()->url()
            ]);
            return Inertia::render('Dashboard', [
                'page' => 'UserManual/ManualSubSection',
                'section' => $sectionId,
                'subsection' => $subsectionId
            ]);
        }

        // Check if this card has a guide
        $guide = \App\Models\UserManual::where('card_id', $card->id)->first();
        
        if ($guide) {
            \Log::info('Card has guide, rendering GuideDetail', [
                'card' => $card->toArray(),
                'guide' => $guide->toArray(),
                'url' => request()->url()
            ]);
            return Inertia::render('Dashboard', [
                'page' => 'UserManual/GuideDetail',
                'id' => $guide->id,
                'sectionId' => $sectionId,
                'subsectionId' => $subsectionId,
                'cardId' => $card->id,
                'card' => $card->toArray()
            ]);
        }

        if ($card->children()->exists()) {
            \Log::info('Card has children, rendering ManualSubSubSection', [
                'card' => $card->toArray(),
                'url' => request()->url()
            ]);
            return Inertia::render('Dashboard', [
                'page' => 'UserManual/ManualSubSubSection',
                'section' => $sectionId,
                'subsection' => $subsectionId,
                'card' => $card->toArray()
            ]);
        }

        \Log::info('Card has no children and no guide, rendering GuideDetail with under construction', [
            'card' => $card->toArray(),
            'url' => request()->url()
        ]);
        return Inertia::render('Dashboard', [
            'page' => 'UserManual/GuideDetail',
            'sectionId' => $sectionId,
            'subsectionId' => $subsectionId,
            'cardId' => $card->id,
            'card' => $card->toArray()
        ]);
    })->name('user-manual.subsection');

    // For sub-sub-section details
    Route::get('/user-manual/{sectionId}/{subsectionId}/{cardId}', function ($sectionId, $subsectionId, $cardId) {
        \Log::info('ManualSubSubSection route hit', [
            'sectionId' => $sectionId,
            'subsectionId' => $subsectionId,
            'cardId' => $cardId,
            'url' => request()->url()
        ]);

        // First try to find the card by id
        $card = \App\Models\Card::where('id', $cardId)->first();
        
        // If not found, try to find by name
        if (!$card) {
            $card = \App\Models\Card::where('name', str_replace('-', ' ', $cardId))->first();
        }

        \Log::info('Card found', [
            'card' => $card ? $card->toArray() : null,
            'hasChildren' => $card ? $card->children()->exists() : false,
            'url' => request()->url()
        ]);

        if (!$card) {
            \Log::info('No card found, rendering ManualSubSubSection', [
                'sectionId' => $sectionId,
                'subsectionId' => $subsectionId,
                'cardId' => $cardId,
                'url' => request()->url()
            ]);
            return Inertia::render('Dashboard', [
                'page' => 'UserManual/ManualSubSubSection',
                'section' => $sectionId,
                'subsection' => $subsectionId,
                'cardId' => $cardId
            ]);
        }

        // Check if this card has a guide
        $guide = \App\Models\UserManual::where('card_id', $card->id)->first();
        
        if ($guide) {
            \Log::info('Card has guide, rendering GuideDetail', [
                'card' => $card->toArray(),
                'guide' => $guide->toArray(),
                'url' => request()->url()
            ]);
            return Inertia::render('Dashboard', [
                'page' => 'UserManual/GuideDetail',
                'id' => $guide->id,
                'sectionId' => $sectionId,
                'subsectionId' => $subsectionId,
                'cardId' => $card->id,
                'card' => $card->toArray()
            ]);
        }

        if ($card->children()->exists()) {
            \Log::info('Card has children, rendering ManualSubSubSection', [
                'card' => $card->toArray(),
                'url' => request()->url()
            ]);
            return Inertia::render('Dashboard', [
                'page' => 'UserManual/ManualSubSubSection',
                'section' => $sectionId,
                'subsection' => $subsectionId,
                'cardId' => $card->id,
                'card' => $card->toArray()
            ]);
        }

        \Log::info('Card has no children and no guide, rendering GuideDetail with under construction', [
            'card' => $card->toArray(),
            'url' => request()->url()
        ]);
        return Inertia::render('Dashboard', [
            'page' => 'UserManual/GuideDetail',
            'sectionId' => $sectionId,
            'subsectionId' => $subsectionId,
            'cardId' => $card->id,
            'card' => $card->toArray()
        ]);
    })->name('user-manual.subsubsection');

    // FAQ routes
    Route::get('/faqs', function () {
        return Inertia::render('Dashboard', ['page' => 'FAQs/FAQ']);
    })->name('faqs.index');
    Route::get('/faqs/view', function () {
        return Inertia::render('Dashboard', ['page' => 'FAQs/ViewFAQ']);
    })->name('faqs.view');    
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
