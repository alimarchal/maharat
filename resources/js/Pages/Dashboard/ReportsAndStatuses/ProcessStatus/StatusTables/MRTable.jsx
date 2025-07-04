import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";

const MRTable = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    useEffect(() => {
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
                setError("Error loading requests.");
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

    return (
        <div className="w-full overflow-hidden">
            <table className="w-full">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Request #
                        </th>
                        <th className="py-3 px-4">Items</th>
                        <th className="py-3 px-4">Warehouse Name</th>
                        <th className="py-3 px-4">Cost Center</th>
                        <th className="py-3 px-4">Sub Cost Center</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            Action
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
                        requests.map((req) => (
                            <tr key={req.id}>
                                <td className="py-3 px-4">MR-{req.id}</td>
                                <td className="py-3 px-4">
                                    <div className="flex flex-col">
                                        {req.items?.map((item, index) => (
                                            <span key={index} className="block">
                                                {item.product?.name}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    {req.warehouse?.name || "N/A"}
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
                                            req.items?.[0]?.urgency_status?.name
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
                                <td className="py-3 px-4 flex justify-center space-x-3">
                                    <Link
                                        href={`/statuses/request-status/${req.id}`}
                                        className="text-[#9B9DA2] hover:text-gray-500"
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                    </Link>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="10"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Material Requests found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && requests.length > 0 && (
                <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                    {Array.from(
                        { length: lastPage },
                        (_, index) => index + 1
                    ).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 ${
                                currentPage === page
                                    ? "bg-[#009FDC] text-white"
                                    : "border border-[#B9BBBD] bg-white"
                            } rounded-full hover:bg-[#0077B6] transition`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className={`px-3 py-1 bg-[#009FDC] text-white rounded-full hover:bg-[#0077B6] transition ${
                            currentPage >= lastPage
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                        }`}
                        disabled={currentPage >= lastPage}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default MRTable;
