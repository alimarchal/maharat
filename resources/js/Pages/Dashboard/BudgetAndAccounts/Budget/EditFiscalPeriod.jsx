import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faPlus, faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import axios from "axios";
import FiscalPeriodModal from "./FiscalPeriodModal";

const EditFiscalPeriod = () => {
    const [fiscalPeriods, setFiscalPeriods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFiscalPeriod, setEditingFiscalPeriod] = useState(null);
    const [expandedYears, setExpandedYears] = useState(new Set());

    useEffect(() => {
        fetchFiscalPeriods();
    }, [currentPage]);

    const fetchFiscalPeriods = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await axios.get(`/api/v1/fiscal-periods?page=${currentPage}&include=fiscalYear,creator,updater`);
            console.log('API Response:', response.data); // Debug log
            if (response.data && response.data.data) {
                setFiscalPeriods(response.data.data);
                // Fix: Handle last_page as array or single value
                const lastPageValue = response.data.meta?.last_page;
                const lastPage = Array.isArray(lastPageValue) ? lastPageValue[0] : (lastPageValue || 1);
                setLastPage(lastPage);
                console.log('Current Page:', currentPage, 'Last Page:', lastPage); // Debug log
            } else {
                setError("Invalid response format. Please try again.");
            }
        } catch (error) {
            console.error("Error fetching fiscal periods:", error);
            setError(
                error.response?.data?.message ||
                    "Failed to fetch fiscal periods. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    // Group fiscal periods by fiscal year
    const groupFiscalPeriodsByYear = () => {
        const grouped = {};
        
        fiscalPeriods.forEach(fiscalPeriod => {
            const fiscalYear = fiscalPeriod.fiscal_year;
            
            if (!grouped[fiscalYear]) {
                grouped[fiscalYear] = {
                    fiscalYear,
                    fiscalPeriods: [],
                    totalPeriods: 0
                };
            }
            
            grouped[fiscalYear].fiscalPeriods.push(fiscalPeriod);
            grouped[fiscalYear].totalPeriods += 1;
        });
        
        return Object.values(grouped);
    };

    const toggleYearExpansion = (year) => {
        const newExpanded = new Set(expandedYears);
        if (newExpanded.has(year)) {
            newExpanded.delete(year);
        } else {
            newExpanded.add(year);
        }
        setExpandedYears(newExpanded);
    };

    const handleEdit = (fiscalPeriod) => {
        setEditingFiscalPeriod(fiscalPeriod);
        setIsModalOpen(true);
    };

    const handleDelete = async (fiscalPeriodId) => {
        if (window.confirm("Are you sure you want to delete this fiscal period? This action cannot be undone.")) {
            try {
                await axios.delete(`/api/v1/fiscal-periods/${fiscalPeriodId}`);
                fetchFiscalPeriods(); // Refresh the list
            } catch (error) {
                console.error("Error deleting fiscal period:", error);
                const errorMessage = error.response?.data?.message || "Failed to delete fiscal period. Please try again.";
                alert(errorMessage);
            }
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingFiscalPeriod(null);
    };

    const handleModalSave = () => {
        fetchFiscalPeriods(); // Refresh the list after save
        handleModalClose();
    };

    const refreshData = () => {
        fetchFiscalPeriods();
    };

    const groupedFiscalPeriods = groupFiscalPeriodsByYear();

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">Fiscal Periods</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                    type="button"
                >
                    Create a Fiscal Period
                </button>
            </div>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Fiscal Year
                        </th>
                        <th className="py-3 px-4">Period Name</th>
                        <th className="py-3 px-4">Start Date</th>
                        <th className="py-3 px-4">End Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="6" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin mx-auto"></div>
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
                    ) : groupedFiscalPeriods.length > 0 ? (
                        groupedFiscalPeriods.map((yearGroup) => (
                            <React.Fragment key={yearGroup.fiscalYear}>
                                {/* Main year row */}
                                <tr className="bg-transparent">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleYearExpansion(yearGroup.fiscalYear)}
                                                className="text-[#009FDC] hover:text-[#0077B6] transition-colors"
                                            >
                                                <FontAwesomeIcon 
                                                    icon={expandedYears.has(yearGroup.fiscalYear) ? faChevronDown : faChevronRight} 
                                                    className="text-lg"
                                                />
                                            </button>
                                            <span className="font-semibold">{yearGroup.fiscalYear}</span>
                                            <span className="text-sm text-gray-500">
                                                ({yearGroup.totalPeriods} {yearGroup.totalPeriods === 1 ? 'period' : 'periods'})
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4" colSpan="4">
                                        {/* Removed "Click to expand" text */}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {/* No actions for the main row */}
                                    </td>
                                </tr>
                                
                                {/* Expanded fiscal periods */}
                                {expandedYears.has(yearGroup.fiscalYear) && yearGroup.fiscalPeriods.map((fiscalPeriod) => (
                                    <tr key={fiscalPeriod.id} className="bg-transparent">
                                        <td className="py-3 px-4">
                                            {/* Empty cell for alignment */}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-semibold">{fiscalPeriod.period_name}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {new Date(fiscalPeriod.start_date).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4">
                                            {new Date(fiscalPeriod.end_date).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-sm ${
                                                fiscalPeriod.status === 'Open' ? 'bg-green-100 text-green-800' :
                                                fiscalPeriod.status === 'Adjusting' ? 'bg-yellow-100 text-yellow-800' :
                                                fiscalPeriod.status === 'Closed' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {fiscalPeriod.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-start justify-center gap-4">
                                                <button
                                                    onClick={() => handleEdit(fiscalPeriod)}
                                                    className="text-blue-400 hover:text-blue-500"
                                                    title={fiscalPeriod.budgets_count > 0 ? "Edit Status Only (Budget Allocated)" : "Edit Fiscal Period"}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button
                                                    onClick={() => fiscalPeriod.budgets_count === 0 && handleDelete(fiscalPeriod.id)}
                                                    className={`${
                                                        fiscalPeriod.budgets_count === 0 
                                                            ? 'text-red-500 hover:text-red-800' 
                                                            : 'text-transparent cursor-default'
                                                    }`}
                                                    title={fiscalPeriod.budgets_count === 0 ? "Delete Fiscal Period" : ""}
                                                    disabled={fiscalPeriod.budgets_count > 0}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="6"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Fiscal Periods found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Fiscal Period Modal */}
            <FiscalPeriodModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSave={handleModalSave}
                fiscalPeriod={editingFiscalPeriod}
                fetchFiscalPeriods={refreshData}
            />

            {/* Pagination */}
            {!loading && !error && fiscalPeriods.length > 0 && (
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

export default EditFiscalPeriod; 