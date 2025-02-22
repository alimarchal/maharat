import React from "react";
import { Link } from "@inertiajs/react";
import WarehouseTable from "./WarehouseTable";

const WarehouseIndex = () => {
    return (
        <div className="min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C] mb-4">
                    Warehouse Management
                </h2>
                <Link
                    href="/warehouse-management/create"
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                >
                    Create New Warehouse
                </Link>
            </div>
            <WarehouseTable />
        </div>
    );
};

export default WarehouseIndex;
