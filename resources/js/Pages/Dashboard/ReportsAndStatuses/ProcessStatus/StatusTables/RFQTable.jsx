import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";

const RFQTable = () => {
    const [rfqLogs, setRfqLogs] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRFQLogs = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `/api/v1/rfqs?page=${currentPage}`
                );
                const data = await response.json();

                if (response.ok) {
                    setRfqLogs(data.data || []);
                    setLastPage(data.meta?.last_page || 1);
                } else {
                    setError(data.message || "Failed to fetch rfq.");
                }
            } catch (err) {
                console.error("Error fetching rfq:", err);
                setError("Error loading rfq.");
            } finally {
                setLoading(false);
            }
        };

        fetchRFQLogs();
    }, [currentPage]);

    return (
        <div className="w-full overflow-hidden">
            <table className="w-full">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            RFQ #
                        </th>
                        <th className="py-3 px-4">Requested By</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="5" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="5"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : rfqLogs.length > 0 ? (
                        rfqLogs.map((log) => (
                            <tr key={log.id}>
                                <td className="px-3 py-4">
                                    {log.rfq_number || "N/A"}
                                </td>
                                <td className="px-3 py-4">
                                    {log.requester?.name || "N/A"}
                                </td>
                                <td className="px-3 py-4">
                                    {typeof log.status?.name === "object" ? (
                                        <span className="text-red-500">
                                            Invalid Status
                                        </span>
                                    ) : (
                                        <span
                                            className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${
                                                log.status?.name === "Active"
                                                    ? "bg-green-100 text-green-800"
                                                    : log.status?.name ===
                                                      "Rejected"
                                                    ? "bg-red-100 text-red-800"
                                                    : log.status?.name ===
                                                      "Expired"
                                                    ? "bg-gray-100 text-gray-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                            }`}
                                        >
                                            {log.status?.name || "Pending"}
                                        </span>
                                    )}
                                </td>
                                <td className="px-3 py-4">
                                    <div className="flex flex-col">
                                        {log.created_at
                                            ? new Date(
                                                  log.created_at
                                              ).toLocaleDateString()
                                            : "N/A"}
                                        <span className="text-gray-400">
                                            {log.created_at
                                                ? new Date(
                                                      log.created_at
                                                  ).toLocaleTimeString()
                                                : ""}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 flex justify-center space-x-3">
                                    <button className="text-[#9B9DA2] hover:text-gray-500">
                                        <FontAwesomeIcon icon={faEye} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="5"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No RFQs found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && rfqLogs.length > 0 && (
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

export default RFQTable;
