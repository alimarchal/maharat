import React from "react";
import { Link } from "@inertiajs/react";
import StatusTable from "./StatusTable";

const StatusIndex = () => {
    return (
        <div className="min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C] mb-4">Status</h2>
                <Link
                    href="/new-status"
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                >
                    Create New Status
                </Link>
            </div>
            <StatusTable />
        </div>
    );
};

export default StatusIndex;
