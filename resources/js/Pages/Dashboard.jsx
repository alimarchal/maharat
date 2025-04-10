import React from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
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
import CreateReceivable from "./Dashboard/Finance/AccountReceivables/CreateReceivable";
import ViewReceivable from "./Dashboard/Finance/AccountReceivables/ViewReceivable";
import PayablesTable from "./Dashboard/Finance/AccountPayables/PayablesTable";
import ViewPayable from "./Dashboard/Finance/AccountPayables/ViewPayable";
import IncomeStatementTable from "./Dashboard/BudgetAndAccounts/IncomeStatement/IncomeStatementTable";
import ViewIncomeStatement from "./Dashboard/BudgetAndAccounts/IncomeStatement/ViewIncomeStatement";
import BudgetTable from "./Dashboard/BudgetAndAccounts/Budget/BudgetTable";
import CreateBudget from "./Dashboard/BudgetAndAccounts/Budget/CreateBudget";
import ViewBudget from "./Dashboard/BudgetAndAccounts/Budget/ViewBudget";
import ViewBalanceSheet from "./Dashboard/BudgetAndAccounts/BalanceSheet/ViewBalanceSheet";
import BudgetRequestForm from "./Dashboard/BudgetAndAccounts/RequestABudget/BudgetRequestForm";
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
import UserProfile from "./UserProfile/UserProfile";

export default function Dashboard({ auth, page }) {
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
        if (page === "Finance/PaymentOrder/PaymentOrderTable")
            return <PaymentOrderTable />;
        if (page === "Finance/PaymentOrder/CreatePaymentOrderTable")
            return <CreatePaymentOrdersTable />;
        if (page === "AccountReceivables/ReceivableTable")
            return <ReceivableTable />;
        if (page === "AccountReceivables/CreateReceivable")
            return <CreateReceivable />;
        if (page === "AccountReceivables/ViewReceivable")
            return <ViewReceivable />;
        if (page === "AccountPayables/PayablesTable") return <PayablesTable />;
        if (page === "AccountPayables/ViewPayable") return <ViewPayable />;
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
        if (page === "BudgetAndAccounts/RequestABudget/RequestBudgetTable")
            return <RequestBudgetTable />;
        if (page === "BudgetAndAccounts/RequestABudget/BudgetRequestForm")
            return <BudgetRequestForm />;
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

        return <MainDashboard roles={auth.user.roles} />;
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

            <main className="p-6 flex-1">{renderComponent()}</main>
        </AuthenticatedLayout>
    );
}
