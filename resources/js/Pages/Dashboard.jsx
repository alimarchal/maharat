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
import CategoryIndex from "./Dashboard/Category/CategoryIndex";
import CreateCategory from "./Dashboard/Category/CreateCategory";
import ProductIndex from "./Dashboard/Products/ProductIndex";
import CreateProduct from "./Dashboard/Products/CreateProduct";
import WarehouseIndex from "./Dashboard/WarehouseManagement/WarehouseIndex";
import CreateWarehouse from "./Dashboard/WarehouseManagement/CreateWarehouse";
import CompanyProfile from "./CompanyProfile/CompanyProfile";
import ProcessFlow from "./Dashboard/ProcessFlow/ProcessFlow";
import CreateProcessFlow from "./Dashboard/ProcessFlow/CreateProcessFlow";
import RolesPermissions from "./Dashboard/RolePermission/RolesPermissions";
import Notification from "./Dashboard/NotificationSettings/Notification";
import TasksTable from "./Dashboard/Tasks/TasksTable";
import ReviewTask from "./Dashboard/Tasks/ReviewTask";

export default function Dashboard({ auth, page }) {
    const renderComponent = () => {
        if (page === "Requests/RequestIndex") return <RequestIndex />;
        if (page === "Requests/MakeRequest") return <MakeRequest />;
        if (page === "Status/StatusIndex") return <StatusIndex />;
        if (page === "Status/CreateStatus") return <CreateStatus />;
        if (page === "Units/UnitIndex") return <UnitIndex />;
        if (page === "Units/CreateUnit") return <CreateUnit />;
        if (page === "Category/CategoryIndex") return <CategoryIndex />;
        if (page === "Category/CreateCategory") return <CreateCategory />;
        if (page === "Products/ProductIndex") return <ProductIndex />;
        if (page === "Products/CreateProduct") return <CreateProduct />;
        if (page === "WarehouseManagement/WarehouseIndex")
            return <WarehouseIndex />;
        if (page === "WarehouseManagement/CreateWarehouse")
            return <CreateWarehouse />;
        if (page === "CompanyProfile/CompanyProfile") return <CompanyProfile />;
        if (page === "ProcessFlow/ProcessFlow") return <ProcessFlow />;
        if (page === "ProcessFlow/CreateProcessFlow")
            return <CreateProcessFlow />;
        if (page === "RolePermission/RolesPermissions")
            return <RolesPermissions />;
        if (page === "NotificationSettings/Notification")
            return <Notification />;
        if (page === "Tasks/TasksTable") return <TasksTable />;
        if (page === "Tasks/ReviewTask") return <ReviewTask />;

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
