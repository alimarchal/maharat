import React from "react";
import { Link } from "@inertiajs/react";
import UnitTable from "./UnitTable";

const UnitIndex = () => {
    return (
        <div className="min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C] mb-4">
                    Units
                </h2>
                <Link
                    href="/new-unit"
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                >
                    Create New Unit
                </Link>
            </div>
            <UnitTable />
        </div>
    );
};

export default UnitIndex;
