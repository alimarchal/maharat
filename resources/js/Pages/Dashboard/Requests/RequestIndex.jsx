import React, { useState } from "react";
import RequestTable from "./RequestTable";
import { Link } from "@inertiajs/react";
import NewItemModal from "./NewItemModal";
import { useRequestItems } from "@/Components/RequestItemsContext";
import { usePermissions } from "@/hooks/usePermissions";

const RequestIndex = () => {
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { approvedCount, pendingCount } = useRequestItems();
    const { hasPermission } = usePermissions();
    
    // Check permissions for buttons
    const canRequestNewItem = hasPermission("request_new_item");
    const canMakeNewRequest = hasPermission("make_new_request");

    const filters = ["All", "Draft", "Pending", "Approved", "Referred", "Rejected"];

    return (
        <div className="min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#2C323C]">
                    My Requests
                </h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="p-0.5 sm:p-1 border border-[#B9BBBD] bg-white rounded-full overflow-x-auto flex">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                className={`px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm lg:text-base transition whitespace-nowrap flex-shrink-0 ${
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

                    {canRequestNewItem && (
                        <button
                            type="button"
                            title="Request a new item that is not listed in the stock items"
                            className="bg-[#009FDC] text-white px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-full text-sm sm:text-base lg:text-xl font-medium whitespace-nowrap"
                            onClick={() => setIsModalOpen(true)}
                        >
                            Request New Item
                        </button>
                    )}

                    {canMakeNewRequest && (
                        <Link
                            href="/my-requests/create"
                            title="Request a new item that is listed in the stock"
                            className="relative bg-[#009FDC] text-white px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-full text-sm sm:text-base lg:text-xl font-medium whitespace-nowrap"
                        >
                            Make New Request
                            {approvedCount > 0 && (
                                <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-xs sm:text-sm h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center">
                                    {approvedCount}
                                </span>
                            )}
                        </Link>
                    )}
                </div>
            </div>
            <RequestTable selectedFilter={selectedFilter} />

            {/* Render the modal */}
            <NewItemModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
};

export default RequestIndex;
