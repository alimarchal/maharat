import React, { useState, useEffect, lazy, Suspense, useRef } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import RequestIndex from "./Dashboard/Requests/RequestIndex";
import MakeRequest from "./Dashboard/Requests/MakeRequest";
import MainDashboard from "./Dashboard/MainDashboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import StatusIndex from "./Dashboard/Status/StatusIndex";
import CreateStatus from "./Dashboard/Status/CreateStatus";
import UnitIndex from "./Dashboard/Units/UnitIndex";
import CreateUnit from "./Dashboard/Units/CreateUnit";
import CategoryIndex from "./Dashboard/Warehouse/Category/CategoryIndex";
import CreateCategory from "./Dashboard/Warehouse/Category/CreateCategory";
import ProductIndex from "./Dashboard/Warehouse/Products/ProductIndex";
import CreateProduct from "./Dashboard/Warehouse/Products/CreateProduct";
import WarehouseIndex from "./Dashboard/WarehouseManagement/WarehouseIndex";
import CreateWarehouse from "./Dashboard/WarehouseManagement/CreateWarehouse";
import CompanyProfile from "./CompanyProfile/CompanyProfile";
import ProcessFlow from "./Dashboard/Configuration/ProcessFlow/ProcessFlow";
import CreateProcessFlow from "./Dashboard/Configuration/ProcessFlow/CreateProcessFlow";
import RolesPermissions from "./Dashboard/Configuration/RolePermission/RolesPermissions";
import Notification from "./Dashboard/Configuration/NotificationSettings/Notification";
import TasksTable from "./Dashboard/MyTasks/Tasks/TasksTable";
import ReviewTask from "./Dashboard/MyTasks/Tasks/ReviewTask";
import PaymentOrderTable from "./Dashboard/Finance/PaymentOrder/PaymentOrderTable";
import CostCenterTable from "./Dashboard/BudgetAndAccounts/CostCenter/CostCenterTable";
import CreatePaymentOrdersTable from "./Dashboard/Finance/PaymentOrder/CreatePaymentOrdersTable";
import ReceivableTable from "./Dashboard/Finance/AccountReceivables/ReceivableTable";
import PayablesTable from "./Dashboard/Finance/AccountPayables/PayablesTable";
import IncomeStatementTable from "./Dashboard/BudgetAndAccounts/IncomeStatement/IncomeStatementTable";
import ViewIncomeStatement from "./Dashboard/BudgetAndAccounts/IncomeStatement/ViewIncomeStatement";
import BudgetTable from "./Dashboard/BudgetAndAccounts/Budget/BudgetTable";
import CreateBudget from "./Dashboard/BudgetAndAccounts/Budget/CreateBudget";
import ViewBudget from "./Dashboard/BudgetAndAccounts/Budget/ViewBudget";
import BudgetTransactionDetails from "./Dashboard/BudgetAndAccounts/Budget/BudgetTransactionDetails";
import EditFiscalPeriod from "./Dashboard/BudgetAndAccounts/Budget/EditFiscalPeriod";
import ViewBalanceSheet from "./Dashboard/BudgetAndAccounts/BalanceSheet/ViewBalanceSheet";
import BudgetRequestForm from "./Dashboard/BudgetAndAccounts/RequestABudget/BudgetRequestForm";
import ReallocateBudgetForm from "./Dashboard/BudgetAndAccounts/RequestABudget/ReallocateBudgetForm";
import VatBudgetRequestForm from "./Dashboard/BudgetAndAccounts/RequestABudget/VatBudgetRequestForm";
import MaharatInvoicesTable from "./Dashboard/Finance/MaharatInvoices/MaharatInvoicesTable";
import ApproveBudgetForm from "./Dashboard/MyTasks/ApproveBudgetRequest/ApproveBudgetForm";
import SubCostCenterTable from "./Dashboard/BudgetAndAccounts/SubCostCenter/SubCostCenterTable";
import CreateMaharatInvoice from "./Dashboard/Finance/MaharatInvoices/CreateMaharatInvoice";
import ReceivedMRsTable from "./Dashboard/Warehouse/ReceivedMaterialRequest/ReceivedMRsTable";
import Users from "./Dashboard/Configuration/Users/Users";
import AccountsTable from "./Dashboard/Finance/Accounts/AccountsTable";
import Chart from "./Dashboard/Configuration/OrganizationalChart/Chart";
import CustomersTable from "./Dashboard/Customers/CustomersTable";
import CreateCustomer from "./Dashboard/Customers/CreateCustomers";
import SuppliersTable from "./Dashboard/Suppliers/SuppliersTable";
import CreateSuppliers from "./Dashboard/Suppliers/CreateSuppliers";
import RequestBudgetTable from "./Dashboard/BudgetAndAccounts/RequestABudget/RequestBudgetTable";
import InventoryTable from "./Dashboard/Warehouse/Inventory/InventoryTable";
import GRNTable from "./Dashboard/Warehouse/GRN/GRNTable";
import CreateGRNTable from "./Dashboard/Warehouse/GRN/CreateGRNTable";
import ProcessStatuses from "./Dashboard/ReportsAndStatuses/ProcessStatus/processStatus";
import Reports from "./Dashboard/ReportsAndStatuses/Reports/ReportLogs";
import PurchaseStatus from "./Dashboard/ReportsAndStatuses/PurchaseDocStatus/PurchaseStatuses";
import MRStatusFlow from "./Dashboard/ReportsAndStatuses/ProcessStatus/StatusFlow/MRStatusFlow";
import RFQStatusFlow from "./Dashboard/ReportsAndStatuses/ProcessStatus/StatusFlow/RFQStatusFlow";
import POStatusFlow from "./Dashboard/ReportsAndStatuses/ProcessStatus/StatusFlow/POStatusFlow";
import PMTStatusFlow from "./Dashboard/ReportsAndStatuses/ProcessStatus/StatusFlow/PMTStatusFlow";
import MInvoiceStatusFlow from "./Dashboard/ReportsAndStatuses/ProcessStatus/StatusFlow/MInvoiceStatusFlow";
import BudgetRequestStatusFlow from "./Dashboard/ReportsAndStatuses/ProcessStatus/StatusFlow/BudgetRequestStatusFlow";
import TotalBudgetStatusFlow from "./Dashboard/ReportsAndStatuses/ProcessStatus/StatusFlow/TotalBudgetStatusFlow";
import BudgetReallocationStatusFlow from "./Dashboard/ReportsAndStatuses/ProcessStatus/StatusFlow/BudgetReallocationStatusFlow";
import UserProfile from "./UserProfile/UserProfile";
import ViewFAQ from "./FAQs/ViewFAQ";
import FAQAccordion from "./FAQs/FAQ";
import UserManual from "./Dashboard/UserManual/UserManual";
import GuideDetail from "./Dashboard/UserManual/GuideDetail";
import UserManualSubSections from "./Dashboard/UserManual/ManualSubSection";
import ManualSubSubSection from "./Dashboard/UserManual/ManualSubSubSection";
import RFQsTable from "./Dashboard/ProcurementCenter/RFQ/RFQ";
import InvoicesTable from "./Dashboard/ProcurementCenter/Invoices/Invoices";
import PurchaseOrdersTable from "./Dashboard/ProcurementCenter/PurchaseOrder/ViewOrder";
import CreatePurchaseOrder from "./Dashboard/ProcurementCenter/PurchaseOrder/CreateOrder";
import Quotations from "./Dashboard/ProcurementCenter/Quotations/Quotations";
import NewQuotation from "./Dashboard/ProcurementCenter/Quotations/NewQuotation";
import QuotationRFQ from "./Dashboard/ProcurementCenter/Quotations/QuotationRFQ";
import AddQuotationForm from "./Dashboard/ProcurementCenter/RFQ/AddQuotationForm";
import AccountDetailsTable from "./Dashboard/Finance/Accounts/AccountDetailsTable";
import ViewReceivableDetails from "./Dashboard/Finance/AccountReceivables/ViewReceivableDetails";
import ViewPayableDetails from "./Dashboard/Finance/AccountPayables/ViewPayableDetails";
import { preloadDashboardImages } from "@/utils/imageOptimization";
import GRNStatusFlow from "./Dashboard/ReportsAndStatuses/ProcessStatus/StatusFlow/GRNsStatusFlow";

export default function Dashboard({ auth, page }) {
    const [realTimePermissions, setRealTimePermissions] = useState(null);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
    const requestInProgress = useRef(false);

    // Cache permissions in sessionStorage to avoid repeated API calls
    useEffect(() => {
        let isMounted = true; // Prevent state updates if component unmounts
        
        const fetchUserPermissions = async () => {
            // Prevent multiple simultaneous requests
            if (requestInProgress.current) {
                return;
            }
            
            requestInProgress.current = true;
            
            try {
            const cacheKey = `permissions_${auth.user.id}`;
            const cachedPermissions = sessionStorage.getItem(cacheKey);
            const cacheTimestamp = sessionStorage.getItem(`${cacheKey}_timestamp`);
            
                // Clear cache to ensure fresh permissions after role changes
                sessionStorage.removeItem(cacheKey);
                sessionStorage.removeItem(`${cacheKey}_timestamp`);
                
                // Always fetch fresh permissions (no caching for now to ensure real-time updates)
                if (false) {
                    if (isMounted) {
                setRealTimePermissions(JSON.parse(cachedPermissions));
                setIsLoadingPermissions(false);
                    }
                
                // Preload critical images while permissions are cached
                preloadDashboardImages().catch(() => {});
                return;
            }

                const response = await axios.get(`/api/v1/users/${auth.user.id}/combined-permissions?t=${Date.now()}`);
                
                if (isMounted) {
                const permissions = response.data.data;
                setRealTimePermissions(permissions);
                
                // Cache the permissions
                sessionStorage.setItem(cacheKey, JSON.stringify(permissions));
                sessionStorage.setItem(`${cacheKey}_timestamp`, now.toString());
                    
                    setIsLoadingPermissions(false);
                }
                
                // Preload critical images after permissions are loaded
                preloadDashboardImages().catch(() => {});
            } catch (error) {
                if (isMounted) {
                // Fallback to auth permissions if API fails
                setRealTimePermissions(auth.user.permissions);
                    setIsLoadingPermissions(false);
                }
                
                // Still preload images even if permissions fail
                preloadDashboardImages().catch(() => {});
            } finally {
                requestInProgress.current = false;
            }
        };

        fetchUserPermissions();
        
        // Cleanup function to prevent memory leaks
        return () => {
            isMounted = false;
        };
    }, [auth.user.id]);

    const renderComponent = () => {
        if (page === "UserProfile/UserProfile") return <UserProfile />;
        if (page === "Requests/RequestIndex") return <RequestIndex />;
        if (page === "Requests/MakeRequest") return <MakeRequest />;
        if (page === "Status/StatusIndex") return <StatusIndex />;
        if (page === "Status/CreateStatus") return <CreateStatus />;
        if (page === "Units/UnitIndex") return <UnitIndex />;
        if (page === "Units/CreateUnit") return <CreateUnit />;
        if (page === "Warehouse/Category/CategoryIndex")
            return <CategoryIndex />;
        if (page === "Warehouse/Category/CreateCategory")
            return <CreateCategory />;
        if (page === "Warehouse/Products/ProductIndex") return <ProductIndex />;
        if (page === "Warehouse/Products/CreateProduct")
            return <CreateProduct />;
        if (page === "WarehouseManagement/WarehouseIndex")
            return <WarehouseIndex />;
        if (page === "WarehouseManagement/CreateWarehouse")
            return <CreateWarehouse />;
        if (page === "CompanyProfile/CompanyProfile") return <CompanyProfile />;
        if (page === "Configuration/ProcessFlow/ProcessFlow")
            return <ProcessFlow />;
        if (page === "Configuration/ProcessFlow/CreateProcessFlow")
            return <CreateProcessFlow />;
        if (page === "Configuration/RolePermission/RolesPermissions")
            return <RolesPermissions />;
        if (page === "Configuration/NotificationSettings/Notification")
            return <Notification />;
        if (page === "MyTasks/Tasks/TasksTable") return <TasksTable />;
        if (page === "MyTasks/Tasks/ReviewTask") return <ReviewTask />;
        if (page === "MyTasks/ApproveBudgetRequest/ApproveBudgetForm")
            return <ApproveBudgetForm />;
        if (page === "Finance/MaharatInvoices/MaharatInvoicesTable")
            return <MaharatInvoicesTable />;
        if (page === "Finance/MaharatInvoices/CreateMaharatInvoice")
            return <CreateMaharatInvoice />;
        if (page === "Finance/Accounts/AccountsTable") return <AccountsTable />;
        if (page === "Finance/Accounts/AccountDetailsTable") return <AccountDetailsTable />;
        if (page === "Finance/PaymentOrder/PaymentOrderTable")
            return <PaymentOrderTable />;
        if (page === "Finance/PaymentOrder/CreatePaymentOrderTable")
            return <CreatePaymentOrdersTable />;
        if (page === "AccountReceivables/ReceivableTable")
            return <ReceivableTable />;
        if (page === "AccountReceivables/ViewReceivableDetails")
            return <ViewReceivableDetails />;
        if (page === "AccountPayables/PayablesTable") return <PayablesTable />;
        if (page === "AccountPayables/ViewPayableDetails") return <ViewPayableDetails />;
        if (page === "BudgetAndAccounts/CostCenter/CostCenterTable")
            return <CostCenterTable />;
        if (page === "BudgetAndAccounts/SubCostCenter/SubCostCenterTable")
            return <SubCostCenterTable />;
        if (page === "BudgetAndAccounts/IncomeStatement/IncomeStatementTable")
            return <IncomeStatementTable />;
        if (page === "BudgetAndAccounts/IncomeStatement/ViewIncomeStatement")
            return <ViewIncomeStatement />;
        if (page === "BudgetAndAccounts/BalanceSheet/ViewBalanceSheet")
            return <ViewBalanceSheet />;
        if (page === "BudgetAndAccounts/Budget/BudgetTable")
            return <BudgetTable />;
        if (page === "BudgetAndAccounts/Budget/CreateBudget")
            return <CreateBudget />;
        if (page === "BudgetAndAccounts/Budget/ViewBudget")
            return <ViewBudget />;
        if (page === "BudgetAndAccounts/Budget/BudgetTransactionDetails")
            return <BudgetTransactionDetails />;
        if (page === "BudgetAndAccounts/Budget/EditFiscalPeriod")
            return <EditFiscalPeriod />;
        if (page === "BudgetAndAccounts/RequestABudget/RequestBudgetTable")
            return <RequestBudgetTable />;
        if (page === "BudgetAndAccounts/RequestABudget/BudgetRequestForm")
            return <BudgetRequestForm />;
        if (page === "BudgetAndAccounts/RequestABudget/ReallocateBudgetForm")
            return <ReallocateBudgetForm />;
        if (page === "BudgetAndAccounts/RequestABudget/VatBudgetRequestForm")
            return <VatBudgetRequestForm />;
        if (page === "Warehouse/ReceivedMaterialRequest/ReceivedMRsTable")
            return <ReceivedMRsTable />;
        if (page === "Configuration/Users/Users") return <Users />;
        if (page === "Configuration/OrganizationalChart/Chart")
            return <Chart />;
        if (page === "Customers/CustomersTable") return <CustomersTable />;
        if (page === "Customers/CreateCustomers") return <CreateCustomer />;
        if (page === "Suppliers/SuppliersTable") return <SuppliersTable />;
        if (page === "Suppliers/CreateSuppliers") return <CreateSuppliers />;
        if (page === "Warehouse/Inventory/InventoryTable")
            return <InventoryTable />;
        if (page === "Warehouse/GRN/GRNTable") return <GRNTable />;
        if (page === "Warehouse/GRN/CreateGRNTable") return <CreateGRNTable />;
        if (page === "ReportsAndStatuses/Reports/ReportLogs")
            return <Reports />;
        if (page === "ReportsAndStatuses/PurchaseDocStatus/PurchaseStatuses")
            return <PurchaseStatus />;
        if (page === "ReportsAndStatuses/ProcessStatus/ProcessStatus")
            return <ProcessStatuses />;
        if (page === "ReportsAndStatuses/ProcessStatus/StatusFlow/MRStatusFlow")
            return <MRStatusFlow />;
        if (
            page === "ReportsAndStatuses/ProcessStatus/StatusFlow/RFQStatusFlow"
        )
            return <RFQStatusFlow />;
        if (page === "ReportsAndStatuses/ProcessStatus/StatusFlow/POStatusFlow")
            return <POStatusFlow />;
        if (
            page === "ReportsAndStatuses/ProcessStatus/StatusFlow/PMTStatusFlow"
        )
            return <PMTStatusFlow />;
        if (
            page ===
            "ReportsAndStatuses/ProcessStatus/StatusFlow/MInvoiceStatusFlow"
        )
            return <MInvoiceStatusFlow />;
        if (
            page ===
            "ReportsAndStatuses/ProcessStatus/StatusFlow/BudgetRequestStatusFlow"
        )
            return <BudgetRequestStatusFlow />;
        if (
            page ===
            "ReportsAndStatuses/ProcessStatus/StatusFlow/TotalBudgetStatusFlow"
        )
            return <TotalBudgetStatusFlow />;
        if (
            page ===
            "ReportsAndStatuses/ProcessStatus/StatusFlow/BudgetReallocationStatusFlow"
        )
            return <BudgetReallocationStatusFlow />;
        if (
            page ===
            "ReportsAndStatuses/ProcessStatus/StatusFlow/GRNsStatusFlow"
        )
            return <GRNStatusFlow />;
        if (page === "FAQs/FAQ") return <FAQAccordion />;
        if (page === "FAQs/ViewFAQ") return <ViewFAQ />;
        if (page === "UserManual/UserManual") return <UserManual />;
        if (page === "UserManual/GuideDetail") return <GuideDetail />;
        if (page === "UserManual/ManualSubSection") return <UserManualSubSections />;
        if (page === "UserManual/ManualSubSubSection") return <ManualSubSubSection />;
        if (page === "ProcurementCenter/RFQ/RFQ") return <RFQsTable />;
        if (page === "ProcurementCenter/RFQ/AddQuotationForm") return <AddQuotationForm />;
        if (page === "ProcurementCenter/Quotations/Quotations") return <Quotations />;
        if (page === "ProcurementCenter/Quotations/NewQuotation") return <NewQuotation />;
        if (page === "ProcurementCenter/Quotations/QuotationRFQ") return <QuotationRFQ />;
        if (page === "ProcurementCenter/PurchaseOrder/ViewOrder") return <PurchaseOrdersTable />;
        if (page === "ProcurementCenter/PurchaseOrder/CreateOrder") return <CreatePurchaseOrder />;
        if (page === "ProcurementCenter/Invoices/Invoices") return <InvoicesTable />;
        
        // Show loading state while fetching permissions
        if (isLoadingPermissions) {
            return (
                <div className="w-full">
                    {/* Banner placeholder with same responsive sizing as MainDashboard */}
                    <div
                        className="relative w-full h-48 sm:h-56 md:h-64 lg:h-52 xl:h-56 2xl:h-60 bg-gray-200 p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl lg:rounded-3xl animate-pulse"
                    >
                        <div className="absolute bottom-2 sm:bottom-3 lg:bottom-4 text-left">
                            <div className="h-8 sm:h-10 md:h-12 lg:h-10 xl:h-12 2xl:h-14 bg-gray-300 rounded w-48 sm:w-56 md:w-64 lg:w-56 xl:w-64 2xl:w-72 mb-2"></div>
                            <div className="h-4 sm:h-5 md:h-6 lg:h-5 xl:h-6 2xl:h-7 bg-gray-300 rounded w-64 sm:w-72 md:w-80 lg:w-72 xl:w-80 2xl:w-96"></div>
                        </div>
                    </div>
                    
                    {/* Cards grid placeholder with same responsive sizing as MainDashboard */}
                    <div className="grid grid-cols-4 gap-3 sm:gap-4 lg:gap-6 my-4 sm:my-6">
                        {[...Array(8)].map((_, index) => (
                            <div
                                key={index}
                                className="bg-white p-3 sm:p-4 lg:p-6 xl:p-8 rounded-tr-[1.5rem] sm:rounded-tr-[2rem] lg:rounded-tr-[3rem] xl:rounded-tr-[4rem] rounded-bl-[1.5rem] sm:rounded-bl-[2rem] lg:rounded-bl-[3rem] xl:rounded-bl-[4rem] shadow-md border border-gray-100 h-40 sm:h-44 lg:h-48 xl:h-52 2xl:h-56 flex flex-col animate-pulse"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="bg-gray-200 flex justify-center items-center p-1.5 sm:p-2 lg:p-3 rounded-full w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14"></div>
                                    <div className="bg-gray-200 rounded-full w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12"></div>
                                </div>
                                
                                <div className="flex-grow mt-4 sm:mt-6 lg:mt-8"></div>
                                
                                <div className="flex flex-col">
                                    <div className="h-5 sm:h-6 lg:h-7 xl:h-8 2xl:h-9 bg-gray-200 rounded mb-1"></div>
                                    <div className="h-3 sm:h-3 lg:h-4 xl:h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Loading spinner overlay */}
                    <div className="fixed inset-0 bg-white bg-opacity-75 flex justify-center items-center z-50">
                        <div className="text-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-[#7D8086] text-sm sm:text-base lg:text-lg">Loading Dashboard...</p>
                        </div>
                    </div>
                </div>
            );
        }

        // Convert real-time permissions to the format expected by MainDashboard
        const permissionsArray = realTimePermissions ? 
            Object.keys(realTimePermissions)
                .filter(category => realTimePermissions[category]?.main === true)
                .map(category => {
                    // Map category names to permission names
                    const categoryToPermission = {
                        "Requests": "view_requests",
                        "Task Center": "view_tasks", 
                        "Procurement Center": "view_procurement",
                        "Finance Center": "view_finance",
                        "Warehouse": "view_warehouse",
                        "Budget & Accounts": "view_budget",
                        "Status": "view_statuses",
                        "Configuration Center": "view_configuration",
                        "Sidebar": "view_sidebar" // This might not be needed
                    };
                    return categoryToPermission[category];
                })
                .filter(Boolean)
                .concat([
                    // Add all sub-permissions from realTimePermissions
                    ...Object.keys(realTimePermissions).flatMap(category => {
                        const categoryData = realTimePermissions[category];
                        const subPermissions = [];
                        
                        if (categoryData.subOptions) {
                            Object.keys(categoryData.subOptions).forEach(subOption => {
                                const subOptionData = categoryData.subOptions[subOption];
                                if (subOptionData.enabled) {
                                    // Map sub-option names to permissions based on category context
                                    let permission = null;
                                    
                                    // Handle context-specific mappings for duplicate names
                                    if (subOption === "Notification Settings") {
                                        if (category === "Configuration Center") {
                                            permission = "manage_settings";
                                        } else if (category === "Sidebar") {
                                            permission = "sidebar_notification";
                                        }
                                    } else {
                                        // General mapping for non-duplicate names
                                        const subOptionToPermission = {
                                            // Configuration Center
                                            "Organizational Chart": "view_org_chart",
                                            "Process Flow": "view_process_flow", 
                                            "Roles & Permission": "view_permission_settings",
                                            
                                            // Procurement Center
                                            "RFQs": "view_rfqs",
                                            "Quotations": "view_quotations",
                                            "Purchase Orders": "view_purchase_orders",
                                            "External Invoices": "view_invoices",
                                            
                                            // Finance Center
                                            "Maharat Invoices": "view_maharat_invoices",
                                            "Accounts": "view_accounts",
                                            "Payment Orders": "view_payment_orders",
                                            "Account Receivables": "view_account_receivables",
                                            "Account Payables": "view_account_payables",
                                            
                                            // Warehouse
                                            "User Material Requests": "view_material_requests",
                                            "Categories": "view_categories",
                                            "Items": "view_items",
                                            "Goods Receiving Notes": "view_goods_receiving_notes",
                                            "Inventory Tracking": "view_inventory_tracking",
                                            "Create Warehouse": "create_warehouse",
                                            
                                            // Budget & Accounts
                                            "Cost Centers": "view_cost_centers",
                                            "Income Statement": "view_income_statement",
                                            "Balance Sheet": "view_balance_sheet",
                                            "Budget": "manage_budget",
                                            "Request a Budget": "view_request_budget",
                                            
                                            // Status
                                            "Material Request Status": "view_material_request_status",
                                            "RFQ Status": "view_rfq_status",
                                            "Purchase Order Status": "view_purchase_order_status",
                                            "Payment Order Status": "view_payment_order_status",
                                            "Maharat Invoice Status": "view_maharat_invoice_status",
                                            "Budget Request Status": "view_budget_request_status",
                                            "Total Budget Status": "view_total_budget_status",
                                            
                                            // Sidebar (non-duplicate names)
                                            "Profile Settings": "edit_profile",
                                            "User Manual": "view_user_manual",
                                            "FAQs": "view_faqs"
                                        };
                                        
                                        permission = subOptionToPermission[subOption];
                                    }
                                    
                                    if (permission) {
                                        subPermissions.push(permission);
                                    }
                                }
                                
                                // Handle nested sub-options
                                if (subOptionData.subOptions) {
                                    Object.keys(subOptionData.subOptions).forEach(nestedSubOption => {
                                        const nestedData = subOptionData.subOptions[nestedSubOption];
                                        if (nestedData.enabled) {
                                            const nestedToPermission = {
                                                // Employee permissions
                                                "Edit Employee": "edit_employee",
                                                "Add Employee": "add_employee",
                                                "Delete Employee": "delete_employee",
                                                
                                                // Other nested permissions can be added here
                                                "Make New RFQ": "make_new_rfq",
                                                "Add Supplier": "add_supplier",
                                                "Add New Quotation": "add_new_quotation",
                                                "Create New Purchase Order": "create_new_purchase_order",
                                                "Add Invoice": "add_invoice",
                                                "Add Customers": "add_customers",
                                                "Create New Invoice": "create_new_invoice",
                                                "Create New Account": "create_new_account",
                                                "Create Payment Order": "create_payment_order",
                                                "Create New Category": "create_categories",
                                                "Create New Item": "create_items",
                                                "Create Good Receiving Notes": "create_goods_receiving_notes",
                                                "Add Inventory": "add_inventory",
                                                "Create Cost Center": "create_cost_center",
                                                "Create Sub Cost Center": "create_sub_cost_center",
                                                "Create Fiscal Year": "create_fiscal_year",
                                                "Create a Budget": "create_budget",
                                                "Approve Budget": "approve_budget_option",
                                                "Create Department Budget Request": "create_department_budget_request",
                                                "Modify Manual": "modify_user_manual",
                                                "Add FAQ": "create_faqs",
                                                "Edit FAQ": "edit_faqs",
                                                "Delete FAQ": "delete_faqs"
                                            };
                                            
                                            const nestedPermission = nestedToPermission[nestedSubOption];
                                            if (nestedPermission) {
                                                subPermissions.push(nestedPermission);
                                            }
                                        }
                                    });
                                }
                            });
                        }
                        
                        return subPermissions;
                    })
                ]) : // Remove undefined values
            auth.user.permissions;

        
        return <MainDashboard roles={auth.user.roles} permissions={permissionsArray} />;
    };

    const currentPath = window.location.pathname;
    const isDashboard = currentPath === "/dashboard";

    const breadcrumbSegments = currentPath
        .split("/")
        .filter(
            (segment) =>
                segment !== "" && segment !== "dashboard" && isNaN(segment)
        )
        .map((segment, index, array) => {
            const path = `/dashboard/${array.slice(0, index + 1).join("/")}`;
            return {
                label: segment
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (char) => char.toUpperCase()),
                path,
            };
        });

    return (
        <AuthenticatedLayout>
            <Head
                title={
                    isDashboard
                        ? "Dashboard"
                        : breadcrumbSegments.length > 0
                        ? breadcrumbSegments.map((b) => b.label).join(" > ")
                        : "Dashboard"
                }
            />
            {!isDashboard && (
                <div className="p-6 text-[#7D8086] text-xl">
                    {/* Back Button */}
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-[#2C323C] text-2xl font-medium mb-4"
                    >
                        <FontAwesomeIcon
                            icon={faArrowLeft}
                            className="text-2xl"
                        />
                        <span>Back</span>
                    </button>

                    {/* Breadcrumb */}
                    <p className="flex items-center gap-2">
                        <span
                            onClick={() => router.visit("/dashboard")}
                            className="cursor-pointer hover:text-[#009FDC] transition-colors"
                        >
                            Dashboard
                        </span>
                        {breadcrumbSegments.map((segment, index) => {
                            const fullPath =
                                `/` +
                                breadcrumbSegments
                                    .slice(0, index + 1)
                                    .map((s) =>
                                        s.label
                                            .toLowerCase()
                                            .replace(/\s+/g, "-")
                                    )
                                    .join("/");

                            return (
                                <React.Fragment key={index}>
                                    <FontAwesomeIcon
                                        icon={faChevronRight}
                                        className="text-[#7D8086]"
                                    />
                                    <span
                                        onClick={() => router.visit(fullPath)}
                                        className={`cursor-pointer ${
                                            index ===
                                            breadcrumbSegments.length - 1
                                                ? "text-[#009FDC] font-medium"
                                                : "hover:text-[#009FDC] transition-colors"
                                        }`}
                                    >
                                        {segment.label}
                                    </span>
                                </React.Fragment>
                            );
                        })}
                    </p>
                </div>
            )}

            <main className="p-6 flex-1">
                {renderComponent()}
            </main>
        </AuthenticatedLayout>
    );
}
