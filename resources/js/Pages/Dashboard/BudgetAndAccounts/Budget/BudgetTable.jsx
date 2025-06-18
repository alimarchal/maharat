import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEye,
    faRemove,
    faFileExcel,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import axios from "axios";
import BudgetPDF from "./BudgetPDF";
import BudgetExcel from "./BudgetExcel";
import FiscalPeriodModal from "./FiscalPeriodModal";

const BudgetTable = () => {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [selectedBudgetId, setSelectedBudgetId] = useState(null);

    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
    const [selectedExcelBudgetId, setSelectedExcelBudgetId] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fixed: Added missing state variables that were being used in fetchDropdownData
    const [departments, setDepartments] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [subCostCenters, setSubCostCenters] = useState([]);
    const [fiscalPeriod, setFiscalPeriod] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const filters = ["All", "Active", "Frozen", "Closed"];

    useEffect(() => {
        fetchBudgets();
        fetchDropdownData();
    }, [currentPage]);

    // Fixed: Added dependency for selectedFilter to refetch when filter changes
    useEffect(() => {
        fetchBudgets();
    }, [selectedFilter]);

    const fetchBudgets = async () => {
        setLoading(true);
        setError("");

        try {
            // Fixed: Include filter parameter in API call
            const filterParam =
                selectedFilter !== "All" ? `&status=${selectedFilter}` : "";
            const response = await axios.get(
                `/api/v1/budgets?include=fiscalPeriod,department,costCenter,creator,updater&page=${currentPage}${filterParam}`
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

    const fetchDropdownData = async () => {
        setIsLoading(true);
        try {
            const [deptResponse, costCenterResponse, fiscalPeriodResponse] =
                await Promise.all([
                    axios.get("/api/v1/departments"),
                    axios.get("/api/v1/cost-centers"),
                    axios.get("/api/v1/fiscal-periods"),
                ]);
            setDepartments(deptResponse.data.data || []);
            setCostCenters(costCenterResponse.data.data || []);
            setSubCostCenters(costCenterResponse.data.data || []);
            setFiscalPeriod(fiscalPeriodResponse.data.data || []);
        } catch (error) {
            console.error("Error fetching dropdown data:", error);
            // Fixed: setError should be a string, not an object
            setError("Failed to load form data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

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

    // Fixed: Reset to page 1 when filter changes
    const handleFilterChange = (filter) => {
        setSelectedFilter(filter);
        setCurrentPage(1);
    };

    // Fixed: Add loading state check for pagination
    const handlePageChange = (page) => {
        if (page >= 1 && page <= lastPage && !loading) {
            setCurrentPage(page);
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
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                        type="button"
                    >
                        Create a Fiscal Period
                    </button>
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
                                            onClick={() =>
                                                handleGeneratePDF(budget.id)
                                            }
                                            title="Download PDF"
                                        >
                                            <img
                                                src="/images/pdf-file.png"
                                                alt="PDF"
                                                className="w-full h-full"
                                            />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleGenerateExcel(budget.id)
                                            }
                                            className="text-green-500 hover:text-green-600"
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

            {/* Fiscal Period Modal */}
            <FiscalPeriodModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                fetchFiscalPeriods={fetchDropdownData}
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
