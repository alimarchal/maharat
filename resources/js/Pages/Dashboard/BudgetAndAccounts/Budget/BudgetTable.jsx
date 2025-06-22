import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faEye, faFileExcel } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import axios from "axios";
import BudgetPDF from "./BudgetPDF";
import BudgetExcel from "./BudgetExcel";
import FiscalYearModal from "./FiscalYearModal";

const BudgetTable = () => {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    // const [expandedYears, setExpandedYears] = useState(new Set());

    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [selectedBudgetId, setSelectedBudgetId] = useState(null);

    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
    const [selectedExcelBudgetId, setSelectedExcelBudgetId] = useState(null);

    const [isFiscalYearModalOpen, setIsFiscalYearModalOpen] = useState(false);

    const filters = ["All", "Active", "Pending", "Frozen", "Closed"];

    useEffect(() => {
        fetchBudgets();
    }, [currentPage, selectedFilter]);

    const fetchBudgets = async () => {
        setLoading(true);
        setError("");

        try {
            let url = `/api/v1/budgets?include=fiscalPeriod,department,costCenter,creator,updater&page=${currentPage}`;

            if (selectedFilter !== "All") {
                url += `&filter[status]=${selectedFilter}`;
            }

            const response = await axios.get(url);

            if (response.data && response.data.data) {
                setBudgets(response.data.data);
                setLastPage(response.data.meta?.last_page || 1);
            } else {
                setError("Invalid response format. Please try again.");
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to fetch budgets. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    // Group budgets by fiscal year and status
    const groupBudgetsByYear = () => {
        const grouped = {};

        budgets.forEach((budget) => {
            // Use fiscal_period_id AND status as the key
            const fiscalPeriodId = budget.fiscal_period_id || budget.fiscal_period?.id;
            const status = budget.status || "Unknown";
            const key = `${fiscalPeriodId}_${status}`;
            
            const fiscalPeriod = budget.fiscal_period?.period_name || `Fiscal Period ${fiscalPeriodId}`;

            if (!grouped[key]) {
                grouped[key] = {
                    fiscalPeriodId,
                    fiscalPeriod,
                    status,
                    budgets: [],
                    totalRevenuePlanned: 0,
                    totalRevenueActual: 0,
                    totalExpensePlanned: 0,
                    totalExpenseActual: 0,
                };
            }

            // Only add the first budget for each fiscal period to avoid double counting
            if (grouped[key].budgets.length === 0) {
                grouped[key].budgets.push(budget);
                grouped[key].totalRevenuePlanned = parseFloat(
                    budget.total_revenue_planned || 0
                );
                grouped[key].totalRevenueActual = parseFloat(
                    budget.total_revenue_actual || 0
                );
                grouped[key].totalExpensePlanned = parseFloat(
                    budget.total_expense_planned || 0
                );
                grouped[key].totalExpenseActual = parseFloat(
                    budget.total_expense_actual || 0
                );
            }
        });

        return Object.values(grouped);
    };

    // const toggleYearExpansion = (year) => {
    //     const newExpanded = new Set(expandedYears);
    //     if (newExpanded.has(year)) {
    //         newExpanded.delete(year);
    //     } else {
    //         newExpanded.add(year);
    //     }
    //     setExpandedYears(newExpanded);
    // };

    // Handle PDF generation
    const handleGeneratePDF = (budgetId) => {
        setIsGeneratingPDF(true);
        setSelectedBudgetId(budgetId);
    };

    const handlePDFGenerated = (documentUrl) => {
        setIsGeneratingPDF(false);
        setSelectedBudgetId(null);
        fetchBudgets();
    };

    // Handle Excel generation
    const handleGenerateExcel = (budgetId) => {
        setIsGeneratingExcel(true);
        setSelectedExcelBudgetId(budgetId);
    };

    const handleExcelGenerated = (excelUrl, error) => {
        setIsGeneratingExcel(false);
        setSelectedExcelBudgetId(null);

        if (!error) {
            fetchBudgets();
        } else {
            console.error("Excel generation failed:", error);
        }
    };

    const handleFilterChange = (filter) => {
        setSelectedFilter(filter);
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= lastPage && !loading) {
            setCurrentPage(page);
        }
    };

    const refreshData = () => {
        fetchBudgets();
    };

    const groupedBudgets = groupBudgetsByYear();

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
                                onClick={() => handleFilterChange(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                    {/* <Link
                        href="/budget/create"
                        className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                    >
                        Create a Budget
                    </Link> */}
                    <button
                        onClick={() => setIsFiscalYearModalOpen(true)}
                        className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                        type="button"
                    >
                        Create Fiscal Year
                    </button>
                    <Link
                        href="/budget/fiscal-years"
                        className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                    >
                        Create a Budget
                    </Link>
                </div>
            </div>

            {/* PDF Generation Component */}
            {isGeneratingPDF && selectedBudgetId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">
                            Generating PDF
                        </h3>
                        <div className="flex items-center">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                            <p>Please wait, generating PDF document...</p>
                        </div>
                        <BudgetPDF
                            budgetId={selectedBudgetId}
                            onGenerated={handlePDFGenerated}
                        />
                    </div>
                </div>
            )}

            {/* Excel Generation Component */}
            {isGeneratingExcel && selectedExcelBudgetId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">
                            Generating Excel
                        </h3>
                        <div className="flex items-center">
                            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                            <p>Please wait, generating Excel file...</p>
                        </div>
                        <BudgetExcel
                            budgetId={selectedExcelBudgetId}
                            onGenerated={handleExcelGenerated}
                        />
                    </div>
                </div>
            )}

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Fiscal Period
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
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin mx-auto"></div>
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
                    ) : groupedBudgets.length > 0 ? (
                        groupedBudgets.map((yearGroup) => (
                            <tr
                                key={yearGroup.fiscalPeriodId}
                                className="bg-transparent"
                            >
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">
                                            {yearGroup.fiscalPeriod}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            ({yearGroup.budgets.length}{" "}
                                            {yearGroup.budgets.length === 1
                                                ? "Department"
                                                : "Departments"}
                                            )
                                        </span>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <span
                                        className={`px-2 py-1 rounded-full text-sm ${
                                            yearGroup.budgets[0]?.status === "Active"
                                                ? "bg-green-100 text-green-800"
                                                : yearGroup.budgets[0]?.status === "Pending"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : yearGroup.budgets[0]?.status === "Frozen"
                                                ? "bg-blue-100 text-blue-800"
                                                : yearGroup.budgets[0]?.status === "Closed"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-gray-100 text-gray-800"
                                        }`}
                                    >
                                        {yearGroup.budgets[0]?.status || "Unknown"}
                                    </span>
                                </td>
                                <td className="py-3 px-4 font-semibold">
                                    {yearGroup.totalRevenuePlanned.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 font-semibold">
                                    {yearGroup.totalRevenueActual.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 font-semibold">
                                    {yearGroup.totalExpensePlanned.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 font-semibold">
                                    {yearGroup.totalExpenseActual.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 flex items-center justify-center text-center gap-4">
                                    <Link
                                        href={`budget/details/${yearGroup.budgets[0]?.id}?fiscal_period_id=${yearGroup.fiscalPeriodId}`}
                                        className="text-[#9B9DA2] hover:text-gray-500"
                                        title="View Budget Details"
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                    </Link>
                                    {yearGroup.budgets[0]?.status === 'Pending' && (
                                        <Link
                                            href={`budget/details/${yearGroup.budgets[0]?.id}?fiscal_period_id=${yearGroup.fiscalPeriodId}&mode=edit`}
                                            className="text-blue-400 hover:text-blue-500"
                                            title="Approve Budget"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </Link>
                                    )}
                                    <button
                                        className="w-4 h-4"
                                        onClick={() =>
                                            handleGeneratePDF(
                                                yearGroup.budgets[0]?.id
                                            )
                                        }
                                        title={`Download PDF for ${yearGroup.fiscalPeriod}`}
                                    >
                                        <img
                                            src="/images/pdf-file.png"
                                            alt="PDF"
                                            className="w-full h-full"
                                        />
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleGenerateExcel(
                                                yearGroup.budgets[0]?.id
                                            )
                                        }
                                        className="text-green-500 hover:text-green-600"
                                        title={`Export ${yearGroup.fiscalPeriod} to Excel`}
                                    >
                                        <FontAwesomeIcon icon={faFileExcel} />
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

            {/* Fiscal Period Modal */}
            {/* <FiscalPeriodModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                fetchFiscalPeriods={refreshData}
            /> */}

            {/* Fiscal Year Modal */}
            <FiscalYearModal
                isOpen={isFiscalYearModalOpen}
                onClose={() => setIsFiscalYearModalOpen(false)}
                fetchFiscalYears={refreshData}
            />

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
