import React, { useState } from "react";
import RequestTable from "./RequestTable";
import { Link } from "@inertiajs/react";
import NewItemModal from "./NewItemModal";
import { useRequestItems } from "@/Components/RequestItemsContext";

const RequestIndex = () => {
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { approvedCount, pendingCount } = useRequestItems();

    const filters = ["All", "Draft", "Pending", "Approved", "Rejected"];

    return (
        <div className="min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    My Requests
                </h2>
                <div className="flex justify-between items-center gap-4">
                    <div className="p-1 space-x-2 border border-[#B9BBBD] bg-white rounded-full">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                className={`px-6 py-2 rounded-full text-xl transition ${
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

                    <button
                        type="button"
                        title="Request a new item that is not listed in the stock items"
                        className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Request New Item
                    </button>

                    <Link
                        href="/my-requests/create"
                        title="Request a new item that is listed in the stock"
                        className="relative bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                    >
                        Make New Request
                        {approvedCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm h-6 w-6 rounded-full flex items-center justify-center">
                                {approvedCount}
                            </span>
                        )}
                    </Link>
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
