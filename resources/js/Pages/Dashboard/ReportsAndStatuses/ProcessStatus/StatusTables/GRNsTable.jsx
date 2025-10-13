import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";

const GRNsTable = () => {
    const [grns, setGrns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        const fetchGrns = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `/api/v1/grns?include=user,quotation,purchaseOrder&filter[status]=Adjusted Delivery&sort=-created_at`
                );
                const data = await response.json();
                if (response.ok) {
                    setGrns(data.data || []);
                    setTotalPages(Math.ceil((data.data || []).length / itemsPerPage));
                } else {
                    setError(data.message || "Failed to fetch GRNs.");
                }
            } catch (err) {
                console.error("Error fetching GRNs:", err);
                setError("Error loading GRNs.");
            } finally {
                setLoading(false);
            }
        };

        fetchGrns();
    }, []);

    // Frontend pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedGrns = grns.slice(startIndex, endIndex);

    const statusColors = {
        "Pending": "text-yellow-500",
        "Approved": "text-green-500",
        "Rejected": "text-red-500",
        "Referred": "text-blue-500",
        "Draft": "text-gray-500",
    };

    return (
        <div className="w-full overflow-hidden">
            <table className="w-full">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-lg font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            GRN #
                        </th>
                        <th className="py-3 px-4">Quotation #</th>
                        <th className="py-3 px-4">Purchase Order #</th>
                        <th className="py-3 px-4">Quantity</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Created By</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Action
                        </th>
                    </tr>
                </thead>

                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="8" className="text-center py-12">
                                <div className="flex justify-start">
                                    <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="8"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : paginatedGrns.length > 0 ? (
                        paginatedGrns.map((grn) => (
                            <tr key={grn.id}>
                                <td className="py-3 px-4">{grn.grn_number}</td>
                                <td className="py-3 px-4 capitalize">
                                    {grn.quotation?.quotation_number || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {grn.purchase_order?.purchase_order_no || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {grn.quantity || "N/A"}
                                </td>
                                <td
                                    className={`py-3 px-4 font-semibold ${
                                        statusColors[grn.task_status] || ""
                                    }`}
                                >
                                    {grn.task_status || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {grn.user?.name || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex flex-col">
                                        {grn.created_at
                                            ? new Date(
                                                  grn.created_at
                                              ).toLocaleDateString()
                                            : "N/A"}
                                        <span className="text-gray-400">
                                            {grn.created_at
                                                ? new Date(
                                                      grn.created_at
                                                  ).toLocaleTimeString()
                                                : ""}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 flex justify-center space-x-3">
                                    <Link
                                        href={`/statuses/grns/${grn.id}`}
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
                                colSpan="9"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No GRNs found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && paginatedGrns.length > 0 && (
                <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                    {Array.from(
                        { length: totalPages },
                        (_, index) => index + 1
                    ).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 ${
                                currentPage === page
                                    ? "bg-[#009FDC] text-white"
                                    : "border border-[#B9BBBD] bg-white"
                            } rounded-full hover:bg-[#0077B6] hover:text-white transition`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className={`px-3 py-1 bg-[#009FDC] text-white rounded-full hover:bg-[#0077B6] transition ${
                            currentPage >= totalPages
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                        }`}
                        disabled={currentPage >= totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default GRNsTable;
