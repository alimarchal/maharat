import React from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import RequestIndex from "./Dashboard/Requests/RequestIndex";
import MakeRequest from "./Dashboard/Requests/MakeRequest";
import MainDashboard from "./Dashboard/MainDashboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
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

        return <MainDashboard />;
    };

    const currentPath = window.location.pathname;
    const isDashboard = currentPath === "/dashboard";

    const breadcrumbSegments = currentPath
        .split("/")
        .filter(
            (segment) =>
                segment !== "" && segment !== "dashboard" && isNaN(segment)
        )
        .map((segment) =>
            segment
                .replace(/-/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase())
        );

    return (
        <AuthenticatedLayout>
            <Head
                title={
                    isDashboard
                        ? "Dashboard"
                        : breadcrumbSegments.length > 0
                        ? breadcrumbSegments.join(" > ")
                        : "Dashboard"
                }
            />
            {!isDashboard && (
                <div className="p-6 text-[#7D8086] text-xl">
                    <p className="flex items-center gap-2">
                        <span>Dashboard</span>
                        {breadcrumbSegments.map((segment, index) => (
                            <React.Fragment key={index}>
                                <FontAwesomeIcon
                                    icon={faChevronRight}
                                    className="text-[#7D8086]"
                                />
                                <span
                                    className={
                                        index === breadcrumbSegments.length - 1
                                            ? "text-[#009FDC] font-medium"
                                            : ""
                                    }
                                >
                                    {segment}
                                </span>
                            </React.Fragment>
                        ))}
                    </p>
                </div>
            )}

            <main className="p-6 flex-1">{renderComponent()}</main>
        </AuthenticatedLayout>
    );
}
