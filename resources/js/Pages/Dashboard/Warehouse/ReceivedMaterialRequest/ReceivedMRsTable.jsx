import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faEye } from "@fortawesome/free-solid-svg-icons";
import ReceivedMRsModal from "./ReceivedMRsModal";
import axios from "axios";

const ReceivedMRsTable = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState("All");

    const filters = ["All", "New", "Pending", "Issued"];

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/v1/material-requests?include=requester,warehouse,department,costCenter,subCostCenter,status,items.product,items.unit,items.category,items.urgencyStatus&page=${currentPage}`
            );
            const data = await response.json();
            if (response.ok) {
                setRequests(data.data || []);
                setLastPage(data.meta?.last_page || 1);
            } else {
                setError(data.message || "Failed to fetch requests.");
            }
        } catch (err) {
            console.error("Error fetching requests:", err);
            setError("Error loading received material requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [currentPage]);

    const statusColors = {
        Pending: "text-yellow-500",
        Issued: "text-green-500",
    };

    const priorityColors = {
        High: "text-red-500",
        Medium: "text-orange-500",
        Low: "text-green-500",
        Normal: "text-green-500",
    };

    const handleSave = async (newRequest) => {
        try {
            const response = await axios.post(
                "/api/v1/issue-materials",
                newRequest
            );

            if (response.data.data?.status === "Issue Material") {
                const stockOutPayload = {
                    warehouse_id: selectedRequest?.warehouse_id,
                    product_id: selectedRequest?.items[0]?.product_id,
                    quantity: selectedRequest?.items[0]?.quantity,
                    reorder_level: selectedRequest?.items[0]?.quantity,
                    description: selectedRequest?.items[0]?.description,
                    transaction_type: "stock_out",
                };

                await axios.post(
                    `/api/v1/inventories/product/${selectedRequest?.items[0]?.product_id}/stock-out`,
                    stockOutPayload
                );
            }

            if (response.data) {
                await fetchRequests();
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving requests:", error);
        }
    };

    return (
        <div className="w-full overflow-hidden">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    User Material Requests
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
                </div>
            </div>

            <table className="w-full">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Request #
                        </th>
                        <th className="py-3 px-4">User Name</th>
                        <th className="py-3 px-4">Items</th>
                        <th className="py-3 px-4">Cost Centers</th>
                        <th className="py-3 px-4">Sub Cost Centers</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Actions
                        </th>
                    </tr>
                </thead>

                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="10" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="10"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : requests.length > 0 ? (
                        requests
                            .filter(
                                (req) =>
                                    selectedFilter === "All" ||
                                    req.status?.name === selectedFilter
                            )
                            .map((req) => (
                                <tr key={req.id}>
                                    <td className="py-3 px-4">MR-{req.id}</td>
                                    <td className="py-3 px-4">
                                        {req.requester?.name || "N/A"}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col">
                                            {req.items?.map((item, index) => (
                                                <span
                                                    key={index}
                                                    className="block"
                                                >
                                                    {item.product?.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        {req.costCenter?.name || "N/A"}
                                    </td>
                                    <td className="py-3 px-4">
                                        {req.subCostCenter?.name || "N/A"}
                                    </td>
                                    <td className="py-3 px-4">
                                        {req.department?.name || "N/A"}
                                    </td>
                                    <td
                                        className={`py-3 px-4 ${
                                            priorityColors[
                                                req.items?.[0]?.urgency_status
                                                    ?.name
                                            ] || "text-gray-500"
                                        }`}
                                    >
                                        {req.items?.[0]?.urgency_status?.name ||
                                            "N/A"}
                                    </td>
                                    <td
                                        className={`py-3 px-4 font-semibold ${
                                            statusColors[req.status?.name] ||
                                            "text-gray-500"
                                        }`}
                                    >
                                        {req.status?.name || "N/A"}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col">
                                            {req.created_at
                                                ? new Date(
                                                      req.created_at
                                                  ).toLocaleDateString()
                                                : "N/A"}
                                            <span className="text-gray-400">
                                                {req.created_at
                                                    ? new Date(
                                                          req.created_at
                                                      ).toLocaleTimeString()
                                                    : ""}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 flex justify-center text-center space-x-3">
                                        <button
                                            className="text-[#9B9DA2] hover:text-gray-500"
                                            title="View Request"
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedRequest(req);
                                                setIsModalOpen(true);
                                            }}
                                            className="text-[#9B9DA2] hover:text-gray-500"
                                            title="Issue Material Request"
                                        >
                                            <FontAwesomeIcon
                                                icon={faChevronRight}
                                            />
                                        </button>
                                    </td>
                                </tr>
                            ))
                    ) : (
                        <tr>
                            <td
                                colSpan="10"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No User Material Requests found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Render the modal */}
            {isModalOpen && (
                <ReceivedMRsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    requestData={selectedRequest}
                />
            )}
        </div>
    );
};

export default ReceivedMRsTable;
