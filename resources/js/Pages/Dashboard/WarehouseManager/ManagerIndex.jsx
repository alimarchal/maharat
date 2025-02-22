import React from "react";
import { Link } from "@inertiajs/react";
import ManagerTable from "./ManagerTable";

const ManagerIndex = () => {
    return (
        <div className="min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C] mb-4">
                    Warehouse Manager
                </h2>
                <Link
                    href="/manager/create"
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                >
                    Create New Manager
                </Link>
            </div>
            <ManagerTable />
        </div>
    );
};

export default ManagerIndex;
