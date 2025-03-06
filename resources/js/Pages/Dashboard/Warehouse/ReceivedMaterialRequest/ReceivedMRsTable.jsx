import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faEye } from "@fortawesome/free-solid-svg-icons";
import ReceivedMRsModal from "./ReceivedMRsModal";

const ReceivedMRsTable = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [selectedFilter, setSelectedFilter] = useState("All");
    const filters = [
        "All",
        "Pending",
        "Referred",
        "Rejected",
        "Approved",
        "Issued",
    ];

    const staticRequests = [
        {
            id: 1,
            items: [
                {
                    product: { name: "Steel Rod" },
                    urgency_status: { name: "High" },
                },
            ],
            costCenter: "Construction",
            subCostCenter: "Building A",
            department: "Engineering",
            status: { name: "Pending" },
            created_at: "2024-03-06T10:30:00Z",
        },
        {
            id: 2,
            items: [
                {
                    product: { name: "Cement" },
                    urgency_status: { name: "Medium" },
                },
            ],
            costCenter: "Infrastructure",
            subCostCenter: "Roads",
            department: "Logistics",
            status: { name: "Approved" },
            created_at: "2024-03-05T14:00:00Z",
        },
    ];

    useEffect(() => {
        const fetchRequests = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `/api/v1/material-requests?include=requester,warehouse,status,items.product,items.unit,items.category,items.urgencyStatus&page=${currentPage}`
                );
                const data = await response.json();

                if (response.ok) {
                    setRequests(data.data || []);
                    setLastPage(data.meta?.last_page || 1);
                } else {
                    setError(
                        data.message ||
                            "Failed to fetch received material requests."
                    );
                }
            } catch (err) {
                console.error(
                    "Error fetching received material requests:",
                    err
                );
                setError("Error loading received material requests.");
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [currentPage]);

    const statusColors = {
        Pending: "text-yellow-500",
        Approved: "text-green-500",
        Rejected: "text-red-500",
    };

    const priorityColors = {
        High: "text-red-500",
        Medium: "text-orange-500",
        Low: "text-green-500",
        Normal: "text-green-500",
    };

    const handleSave = async (newRequests) => {
        try {
            const response = await axios.post(
                "/api/v1/material-requests",
                newRequests
            );
            setRequests([...newRequests, response.data]);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving requests:", error);
        }
    };

    return (
        <div className="w-full overflow-hidden">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    Received Material Requests
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
                        <th className="py-3 px-4">Items</th>
                        <th className="py-3 px-4">Cost Centers</th>
                        <th className="py-3 px-4">Sub Cost Centers</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            Actions
                        </th>
                    </tr>
                </thead>

                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="9" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="9"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : staticRequests.length > 0 ? (
                        staticRequests
                            .filter(
                                (req) =>
                                    selectedFilter === "All" ||
                                    req.status?.name === selectedFilter
                            )
                            .map((req) => (
                                <tr key={req.id}>
                                    <td className="py-3 px-4">MR-{req.id}</td>
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
                                        {req.costCenter}
                                    </td>
                                    <td className="py-3 px-4">
                                        {req.subCostCenter}
                                    </td>
                                    <td className="py-3 px-4">
                                        {req.department}
                                    </td>
                                    <td
                                        className={`py-3 px-4 ${
                                            priorityColors[
                                                req.items?.[0]?.urgency_status
                                                    ?.name
                                            ]
                                        }`}
                                    >
                                        {req.items?.[0]?.urgency_status?.name}
                                    </td>
                                    <td
                                        className={`py-3 px-4 font-semibold ${
                                            statusColors[req.status?.name]
                                        }`}
                                    >
                                        {req.status?.name}
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
                                    <td className="py-3 px-4 flex space-x-3">
                                        <button className="text-[#9B9DA2] hover:text-gray-500">
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button className="text-[#9B9DA2] hover:text-gray-500">
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                    ) : (
                        <tr>
                            <td
                                colSpan="9"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Material Requests found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="flex justify-center items-center relative w-full my-8">
                <div
                    className="absolute top-1/2 left-0 w-[45%] h-[3px] max-sm:w-[35%] flex-grow"
                    style={{
                        background:
                            "linear-gradient(to right, #9B9DA2, #9B9DA200)",
                    }}
                ></div>
                <button
                    type="button"
                    className="p-2 text-base sm:text-lg flex items-center bg-white rounded-full border border-[#B9BBBD] text-[#9B9DA2] transition-all duration-300 hover:border-[#009FDC] hover:bg-[#009FDC] hover:text-white hover:scale-105"
                    onClick={() => setIsModalOpen(true)}
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add a
                    Material Request
                </button>
                <div
                    className="absolute top-1/2 right-0 w-[45%] h-[3px] max-sm:w-[35%] flex-grow"
                    style={{
                        background:
                            "linear-gradient(to left, #9B9DA2, #9B9DA200)",
                    }}
                ></div>
            </div>

            {/* Render the modal */}
            {isModalOpen && (
                <ReceivedMRsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default ReceivedMRsTable;
