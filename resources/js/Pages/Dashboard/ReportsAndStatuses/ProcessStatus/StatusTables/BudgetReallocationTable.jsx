import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { Link } from "@inertiajs/react";

// Status badge component for Budget Reallocations
const StatusBadge = ({ status }) => {
    let badgeClass = "px-3 py-1 rounded-full text-xs font-medium";

    switch (status?.toLowerCase()) {
        case "draft":
            badgeClass += " bg-gray-100 text-gray-800";
            break;
        case "approved":
        case "submitted":
            badgeClass += " bg-green-100 text-green-800";
            break;
        case "pending":
            badgeClass += " bg-yellow-100 text-yellow-800";
            break;
        case "referred":
            badgeClass += " bg-blue-100 text-blue-800";
            break;
        case "rejected":
            badgeClass += " bg-red-100 text-red-800";
            break;
        default:
            badgeClass += " bg-gray-300 text-gray-800";
            break;
    }

    return (
        <span className={badgeClass}>
            {status}
        </span>
    );
};

const BudgetReallocationTable = () => {
    const [reallocations, setReallocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    useEffect(() => {
        const fetchReallocations = async () => {
            setLoading(true);
            try {
                const response = await axios.get(
                    `/api/v1/request-budgets?include=fiscalPeriod,department,costCenter,subCostCenter,reallocateToSubCostCenter,originalDestinationSubCostCenter,updatedDestinationSubCostCenter,updatedByUser,purchaseOrder,creator,reallocationHistory&filter[type]=reallocation&page=${currentPage}&per_page=15&sort=-created_at`
                );
                
                setReallocations(response.data.data || []);
                setLastPage(response.data.meta?.last_page || 1);
            } catch (err) {
                setError("Failed to fetch budget reallocations.");
            } finally {
                setLoading(false);
            }
        };

        fetchReallocations();
    }, [currentPage]);

    return (
        <div className="w-full">
            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Year
                        </th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Cost Center</th>
                        <th className="py-3 px-4">Taking From</th>
                        <th className="py-3 px-4">Reallocating To</th>
                        <th className="py-3 px-4">Reallocation Amount</th>
                        <th className="py-3 px-4">Reference</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                            Action
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
                    ) : reallocations.length > 0 ? (
                        reallocations.map((reallocation) => (
                            <tr key={reallocation.id}>
                                <td className="py-3 px-4">
                                    {reallocation.fiscal_period?.fiscal_year || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {reallocation.department?.name || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {reallocation.cost_center?.name || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {reallocation.sub_cost_center_details?.name || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {reallocation.updated_destination_sub_cost_center_details?.name || 
                                     reallocation.reallocate_to_sub_cost_center_details?.name || 
                                     "Not Selected"}
                                </td>
                                <td className="py-3 px-4">
                                    {parseFloat(reallocation.reallocation_history?.reallocate_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </td>
                                <td className="py-3 px-4">
                                    {reallocation.purchase_order_id ? (reallocation.purchase_order?.purchase_order_no || "N/A") : reallocation.id}
                                </td>
                                <td className="py-3 px-4">
                                    <StatusBadge status={reallocation.status} />
                                </td>
                                <td className="py-3 px-4 flex items-center justify-center gap-4">
                                    <Link
                                        href={`/statuses/budget-reallocation-status/${reallocation.id}`}
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
                                No Budget Reallocations found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && reallocations.length > 0 && (
                <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className={`px-3 py-1 bg-[#009FDC] text-white rounded-full hover:bg-[#0077B6] transition ${
                            currentPage <= 1
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                        }`}
                        disabled={currentPage <= 1}
                    >
                        Previous
                    </button>
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
                            } rounded-full hover:bg-[#0077B6] hover:text-white transition`}
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

export default BudgetReallocationTable;


