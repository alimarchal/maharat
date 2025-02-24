import React, { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

const RequestTable = ({ selectedFilter }) => {
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
                    `/api/v1/material-requests?include=requester,warehouse,status,items.product,items.unit,items.category,items.urgencyStatus&page=${currentPage}`
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

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this Request?")) return;

        try {
            const response = await fetch(`/api/v1/material-requests/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                setRequests((prevRequests) =>
                    prevRequests.filter((req) => req.id !== id)
                );
            } else {
                const data = await response.json();
                alert(data.message || "Failed to delete request.");
            }
        } catch (err) {
            console.error("Error deleting request:", err);
            alert("An error occurred while deleting the request.");
        }
    };

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
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            More
                        </th>
                    </tr>
                </thead>

                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="6" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="6"
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
                                    <td className="py-3 px-4">{req.id}</td>
                                    <td className="py-3 px-4">
                                        {req.items?.map(
                                            (item) => item.product?.name
                                        )}
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
                                        {/* <button className="text-[#9B9DA2] hover:text-gray-500">
                                            <FontAwesomeIcon icon={faEye} />
                                        </button> */}
                                        <Link
                                            href={`/my-requests/${req.id}/edit`}
                                            className="text-[#9B9DA2] hover:text-gray-500"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(req.id)}
                                            className="text-[#9B9DA2] hover:text-gray-500"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                    ) : (
                        <tr>
                            <td
                                colSpan="6"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Requests found.
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

export default RequestTable;
