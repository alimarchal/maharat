import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { Link } from "@inertiajs/react";

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
                    `/api/v1/request-budgets?include=fiscalPeriod,department,costCenter,subCostCenter,creator&page=${currentPage}`
                );
                setBudgetRequests(response.data.data);
                setLastPage(response.meta?.last_page || 1);
            } catch (err) {
                setError("Failed to fetch budget requests.");
            } finally {
                setLoading(false);
            }
        };

        fetchBudgetRequests();
    }, []);

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
                        <th className="py-3 px-4">Description</th>
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
                                    {request.previous_year_budget_amount}
                                </td>
                                <td className="py-3 px-4">
                                    {request.requested_amount}
                                </td>
                                <td className="py-3 px-4">{request.urgency}</td>
                                <td className="py-3 px-4">
                                    {request.reason_for_increase}
                                </td>
                                <td className="py-3 px-4 flex items-center justify-center gap-4">
                                    <Link
                                        href={`/statuses/request-status/${request.id}`}
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

export default BudgetRequestTable;
