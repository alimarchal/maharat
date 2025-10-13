import React, { useState } from "react";
import MRTable from "./StatusTables/MRTable";
import RFQTable from "./StatusTables/RFQTable";
import POTable from "./StatusTables/POTable";
import PMTTable from "./StatusTables/PMTTable";
import MInvoiceTable from "./StatusTables/MInvoiceTable";
import BudgetRequestTable from "./StatusTables/BudgetRequestTable";
import TotalBudgetTable from "./StatusTables/TotalBudgetTable";
import { usePermissions } from "@/hooks/usePermissions";
import GRNsTable from "./StatusTables/GRNsTable";

const ProcessStatus = () => {
    const { hasPermission } = usePermissions();
    const [selectedFilter, setSelectedFilter] = useState("MR Status");

    const allFilters = [
        { name: "MR Status", permission: "view_material_request_status" },
        { name: "RFQ Status", permission: "view_rfq_status" },
        { name: "PO Status", permission: "view_purchase_order_status" },
        { name: "PMT Status", permission: "view_payment_order_status" },
        { name: "Invoice Status", permission: "view_maharat_invoice_status" },
        { name: "Budget Request Status", permission: "view_budget_request_status" },
        { name: "Total Budget Status", permission: "view_total_budget_status" },
        { name: "Short Delivery Status", permission: "view_material_request_status" }
    ];

    const filters = allFilters.filter(filter => hasPermission(filter.permission));

    // Auto-select first available filter if current selection is not available
    React.useEffect(() => {
        if (filters.length > 0 && !filters.some(filter => filter.name === selectedFilter)) {
            setSelectedFilter(filters[0].name);
        }
    }, [filters, selectedFilter]);

    const renderContent = () => {
        // If no filters are available, show a message
        if (filters.length === 0) {
            return (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No status views available based on your permissions.</p>
                </div>
            );
        }

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
            case "Short Delivery Status":
                return <GRNsTable />;
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
                                key={filter.name}
                                className={`px-4 py-2 text-sm md:text-base rounded-full transition whitespace-nowrap ${
                                    selectedFilter === filter.name
                                        ? "bg-[#009FDC] text-white"
                                        : "text-[#9B9DA2]"
                                }`}
                                onClick={() => setSelectedFilter(filter.name)}
                            >
                                {filter.name}
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
