import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { Link } from "@inertiajs/react";

// Status badge component for Budget Requests
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

// Urgency badge component for Budget Requests
const UrgencyBadge = ({ urgency }) => {
    let textClass = "text-base font-bold";

    switch (urgency?.toLowerCase()) {
        case "high":
            textClass += " text-red-600";
            break;
        case "medium":
            textClass += " text-orange-600";
            break;
        case "low":
            textClass += " text-green-600";
            break;
        default:
            textClass += " text-gray-600";
            break;
    }

    return (
        <span className={textClass}>
            {urgency}
        </span>
    );
};

const BudgetRequestTable = () => {
    const [budgetRequests, setBudgetRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    useEffect(() => {
        const fetchBudgetRequests = async () => {
            setLoading(true);
            try {
                const response = await axios.get(
                    `/api/v1/request-budgets?include=fiscalPeriod,department,costCenter,subCostCenter,creator,reallocationHistory&page=${currentPage}&per_page=15&sort=-created_at`
                );
                
                console.log('=== BUDGET REQUEST TABLE API RESPONSE ===', {
                    total_requests: response.data.data?.length || 0,
                    first_request: response.data.data?.[0] || null
                });
                
                // Debug: Check if reallocation_history is loaded
                if (response.data.data && response.data.data.length > 0) {
                    console.log('All request types:', response.data.data.map(r => ({ id: r.id, type: r.type })));
                    
                    const reallocationRequests = response.data.data.filter(r => r.type === 'reallocation');
                    console.log('Reallocation requests found:', reallocationRequests.length);
                    
                    reallocationRequests.forEach(req => {
                        console.log('=== REALLOCATION REQUEST DETAILS ===', {
                            id: req.id,
                            type: req.type,
                            request_reallocate_amount: req.reallocate_amount,
                            has_reallocation_history: !!req.reallocation_history,
                            history_reallocate_amount: req.reallocation_history?.reallocate_amount,
                            history_status: req.reallocation_history?.status,
                            full_history: req.reallocation_history,
                            full_request_object: req
                        });
                    });
                }
                setBudgetRequests(response.data.data);
                setLastPage(response.data.meta?.last_page || 1);
            } catch (err) {
                setError("Failed to fetch budget requests.");
            } finally {
                setLoading(false);
            }
        };

        fetchBudgetRequests();
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
                        <th className="py-3 px-4">Sub Cost Center</th>
                        <th className="py-3 px-4">Previous Budget</th>
                        <th className="py-3 px-4">Requested Amount</th>
                        <th className="py-3 px-4">Urgency</th>
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
                    ) : budgetRequests.length > 0 ? (
                        budgetRequests.map((request) => (
                            <tr key={request.id}>
                                <td className="py-3 px-4">
                                    {request.fiscal_period?.fiscal_year}
                                </td>
                                <td className="py-3 px-4">
                                    {request.department?.name}
                                </td>
                                <td className="py-3 px-4">
                                    {request.cost_center?.name}
                                </td>
                                <td className="py-3 px-4">
                                    {request.sub_cost_center_details?.name}
                                </td>
                                <td className="py-3 px-4">
                                    {request.previous_year_budget_amount} SAR
                                </td>
                                <td className="py-3 px-4">
                                    {(() => {
                                        if (request.type === 'reallocation') {
                                            // For reallocations, use reallocate_amount from history if available
                                            // The history table preserves the original reallocate_amount even after approval
                                            const historyAmount = request.reallocation_history?.reallocate_amount;
                                            if (historyAmount !== null && historyAmount !== undefined && historyAmount !== 0) {
                                                return historyAmount;
                                            }
                                            // Fallback to reallocate_amount from request_budgets (might be 0 after approval)
                                            const requestAmount = request.reallocate_amount;
                                            if (requestAmount !== null && requestAmount !== undefined && requestAmount !== 0) {
                                                return requestAmount;
                                            }
                                            // If both are 0 or null, show 0 (shouldn't happen if history is loaded)
                                            return 0;
                                        }
                                        return request.requested_amount;
                                    })()} SAR
                                </td>
                                <td className="py-3 px-4">
                                    <UrgencyBadge urgency={request.urgency} />
                                </td>
                                <td className="py-3 px-4">
                                    <StatusBadge status={
                                        request.type === 'reallocation' && request.reallocation_history?.status
                                            ? request.reallocation_history.status
                                            : request.status
                                    } />
                                </td>
                                <td className="py-3 px-4 flex items-center justify-center gap-4">
                                    <Link
                                        href={`/statuses/budget-status/${request.id}`}
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
                                No Budget Requests found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && budgetRequests.length > 0 && (
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

export default BudgetRequestTable;
