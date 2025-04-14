import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEye,
    faFilePdf,
    faFileExcel,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import axios from "axios";

const BudgetTable = () => {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const filters = ["All", "Active", "Frozen", "Closed"];

    useEffect(() => {
        fetchBudgets();
    }, [currentPage]);

    const fetchBudgets = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await axios.get(
                `/api/v1/budgets?include=fiscalPeriod,department,costCenter,creator,updater&page=${currentPage}`
            );
            if (response.data && response.data.data) {
                setBudgets(response.data.data);
                setLastPage(response.data.meta?.last_page || 1);
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
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">Budgets</h2>
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
                    <Link
                        href="/budget/create"
                        className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                    >
                        Create a Budget
                    </Link>
                </div>
            </div>

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
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Actions
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
                        budgets
                            .filter(
                                (req) =>
                                    selectedFilter === "All" ||
                                    req.status === selectedFilter
                            )
                            .map((budget) => (
                                <tr key={budget.id}>
                                    <td className="py-3 px-4">
                                        {budget.fiscal_period?.fiscal_year}
                                    </td>
                                    <td className="py-3 px-4">
                                        {budget.status}
                                    </td>
                                    <td className="py-3 px-4">
                                        {budget.total_revenue_planned}
                                    </td>
                                    <td className="py-3 px-4">
                                        {budget.total_revenue_actual}
                                    </td>
                                    <td className="py-3 px-4">
                                        {budget.total_expense_planned}
                                    </td>
                                    <td className="py-3 px-4">
                                        {budget.total_expense_actual}
                                    </td>
                                    <td className="py-3 px-4 flex items-center justify-center text-center gap-4">
                                        <Link
                                            href={`budget/details/${budget.id}`}
                                            className="text-[#9B9DA2] hover:text-gray-500"
                                            title="View Budget"
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </Link>
                                        <button
                                            className="w-4 h-4"
                                            title="Download Budget"
                                        >
                                            <img
                                                src="/images/pdf-file.png"
                                                alt="PDF"
                                                className="w-full h-full"
                                            />
                                        </button>
                                        <button
                                            className="text-green-500 hover:text-green-700 transition duration-200"
                                            title="Export to Excel"
                                        >
                                            <FontAwesomeIcon
                                                icon={faFileExcel}
                                            />
                                        </button>
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

export default BudgetTable;
