import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import axios from "axios";

// Status badge component for Total Budgets
const StatusBadge = ({ status }) => {
    let badgeClass = "px-3 py-1 rounded-full text-xs font-medium";

    switch (status?.toLowerCase()) {
        case "active":
            badgeClass += " bg-green-100 text-green-800";
            break;
        case "pending":
            badgeClass += " bg-yellow-100 text-yellow-800";
            break;
        case "closed":
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

const TotalBudgetTable = () => {
    const [allBudgets, setAllBudgets] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        fetchBudgets();
    }, []);

    useEffect(() => {
        // Handle pagination on frontend
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedBudgets = allBudgets.slice(startIndex, endIndex);
        setBudgets(paginatedBudgets);
        setLastPage(Math.ceil(allBudgets.length / itemsPerPage));
    }, [allBudgets, currentPage]);

    const fetchBudgets = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await axios.get(
                `/api/v1/budgets?include=fiscalPeriod,creator,updater&per_page=1000&sort=-created_at`
            );
            if (response.data && response.data.data) {
                setAllBudgets(response.data.data);
            } else {
                setError("Invalid response format. Please try again.");
            }
        } catch (error) {
            console.error("Error fetching budgets:", error);
            setError(
                error.response?.data?.message ||
                    "Failed to fetch budgets. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Year
                        </th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Total Revenue Planned</th>
                        <th className="py-3 px-4">Total Revenue Actual</th>
                        <th className="py-3 px-4">Total Expense Planned</th>
                        <th className="py-3 px-4">Total Expense Actual</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                            Action
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="7" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="7"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : budgets.length > 0 ? (
                        budgets.map((budget) => (
                            <tr key={budget.id}>
                                <td className="py-3 px-4">
                                    {budget.fiscal_period?.fiscal_year}
                                </td>
                                <td className="py-3 px-4">
                                    <StatusBadge status={budget.status} />
                                </td>
                                <td className="py-3 px-4">
                                    {budget.total_revenue_planned} SAR
                                </td>
                                <td className="py-3 px-4">
                                    {budget.total_revenue_actual} SAR
                                </td>
                                <td className="py-3 px-4">
                                    {budget.total_expense_planned} SAR
                                </td>
                                <td className="py-3 px-4">
                                    {budget.total_expense_actual} SAR
                                </td>
                                <td className="py-3 px-4 flex items-center justify-center gap-4">
                                    <Link
                                        href={`/statuses/total-budget-status/${budget.id}`}
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
                                colSpan="7"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Budgets found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && budgets.length > 0 && (
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

export default TotalBudgetTable;
