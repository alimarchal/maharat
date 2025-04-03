import React, { useState } from "react";
import MRTable from "./StatusTables/MRTable";
import RFQTable from "./StatusTables/RFQTable";
import POTable from "./StatusTables/POTable";
import PMTTable from "./StatusTables/PMTTable";
import MInvoiceTable from "./StatusTables/MInvoiceTable";
import BudgetRequestTable from "./StatusTables/BudgetRequestTable";
import TotalBudgetTable from "./StatusTables/TotalBudgetTable";

const ProcessStatus = () => {
    const [selectedFilter, setSelectedFilter] = useState("MR Status");

    const filters = [
        "MR Status",
        "RFQ Status",
        "PO Status",
        "PMT Status",
        "Invoice Status",
        "Budget Request Status",
        "Total Budget Status",
    ];

    const renderContent = () => {
        switch (selectedFilter) {
            case "MR Status":
                return <MRTable />;
            case "RFQ Status":
                return <RFQTable />;
            case "PO Status":
                return <POTable />;
            case "PMT Status":
                return <PMTTable />;
            case "Invoice Status":
                return <MInvoiceTable />;
            case "Budget Request Status":
                return <BudgetRequestTable />;
            case "Total Budget Status":
                return <TotalBudgetTable />;
            default:
                return <MRTable />;
        }
    };

    return (
        <div className="w-full">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-[#2C323C]">Statuses</h2>
                <div className="w-full lg:w-auto overflow-x-auto">
                    <div className="flex space-x-2 border border-[#B9BBBD] bg-white rounded-full p-1 w-max mx-auto lg:mx-0">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                className={`px-4 py-2 text-sm md:text-base rounded-full transition whitespace-nowrap ${
                                    selectedFilter === filter
                                        ? "bg-[#009FDC] text-white"
                                        : "text-[#9B9DA2]"
                                }`}
                                onClick={() => setSelectedFilter(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {renderContent()}
        </div>
    );
};

export default ProcessStatus;
