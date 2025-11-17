import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import axios from "axios";
import { usePermissions } from "@/hooks/usePermissions";

const RequestBudgetTable = () => {
    const { hasPermission } = usePermissions();
    const [budgetRequests, setBudgetRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [selectedFilter, setSelectedFilter] = useState("Draft");

    const filters = ["All", "Draft", "Approved", "Pending", "Rejected"];

    useEffect(() => {
        const fetchBudgetRequests = async () => {
            setLoading(true);
            setError("");
            try {
                let url = `/api/v1/request-budgets?include=fiscalPeriod,department,costCenter,subCostCenter,reallocateToSubCostCenter,creator,reallocationHistory.sourceBudgetRequest,reallocationHistory.destinationBudgetRequest&page=${currentPage}&per_page=15&sort=-created_at`;
                
                // Apply filter if not "All"
                if (selectedFilter !== "All") {
                    url += `&filter[status]=${selectedFilter}`;
                }

                const response = await axios.get(url);
                setBudgetRequests(response.data.data);
                setLastPage(response.data.meta?.last_page || 1);
            } catch (err) {
                setError("Failed to fetch budget requests.");
            } finally {
                setLoading(false);
            }
        };

        fetchBudgetRequests();
    }, [currentPage, selectedFilter]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this budget request? This will also delete any associated tasks and approval transactions.")) {
            return;
        }

        setDeletingId(id);
        try {
            await axios.delete(`/api/v1/request-budgets/${id}`);
            setBudgetRequests(prev => prev.filter(request => request.id !== id));
        } catch (err) {
            alert("Failed to delete budget request. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleFilterChange = (filter) => {
        setSelectedFilter(filter);
        setCurrentPage(1);
    };

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#2C323C]">
                    Department Budget Requests
                </h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    {hasPermission('create_department_budget_request') && (
                        <div className="p-0.5 sm:p-1 border border-[#B9BBBD] bg-white rounded-full overflow-x-auto flex">
                            {filters.map((filter) => (
                                <button
                                    key={filter}
                                    className={`px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm lg:text-base transition whitespace-nowrap flex-shrink-0 ${
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
                    )}
                    {hasPermission('create_department_budget_request') && (
                        <>
                            <Link
                                href={`/request-budgets/reallocate`}
                                className="bg-[#009FDC] text-white px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-full text-sm sm:text-base lg:text-xl font-medium whitespace-nowrap"
                            >
                                Reallocate Budget
                            </Link>
                            <Link
                                href={`/request-budgets/create`}
                                className="bg-[#009FDC] text-white px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-full text-sm sm:text-base lg:text-xl font-medium whitespace-nowrap"
                            >
                                Budget Request
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Year
                        </th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Created By</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Cost Center</th>
                        <th className="py-3 px-4">Sub Cost Center</th>
                        <th className="py-3 px-4">Previous Budget</th>
                        <th className="py-3 px-4">Requested Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="10" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="10"
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
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap inline-block ${
                                        request.type === 'reallocation' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {request.type === 'reallocation' ? 'Reallocation' : 'Budget Request'}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    {request.creator?.name}
                                </td>
                                <td className="py-3 px-4">
                                    {request.department?.name}
                                </td>
                                <td className="py-3 px-4">
                                    {request.cost_center?.name}
                                </td>
                                <td className="py-3 px-4">
                                    {request.type === 'reallocation'
                                        ? (request.reallocate_to_sub_cost_center_details?.name || 'N/A')
                                        : request.sub_cost_center_details?.name}
                                </td>
                                <td className="py-3 px-4">
                                    {request.type === 'reallocation' 
                                        ? (request.reallocation_history?.destination_budget_request?.approved_amount || 'N/A')
                                        : request.previous_year_budget_amount}
                                </td>
                                <td className="py-3 px-4">
                                    {request.type === 'reallocation'
                                        ? (request.reallocation_history?.reallocate_amount ?? request.reallocate_amount ?? 'N/A')
                                        : request.requested_amount}
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        request.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                                        request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                        request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                        request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                        {request.status}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-start justify-center gap-4">
                                        {request.status === 'Draft' && hasPermission('create_department_budget_request') && (
                                            <Link
                                                href={`/request-budgets/${request.id}/edit`}
                                                className="text-blue-400 hover:text-blue-500"
                                                title="Edit Budget Request"
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </Link>
                                        )}
                                        {request.attachment_path && (
                                            <button
                                                className="w-4 h-4"
                                                onClick={() => {
                                                    const filePath = request.attachment_path;
                                                    if (filePath) {
                                                        const fixedPath = filePath.startsWith("http") 
                                                            ? filePath 
                                                            : filePath.startsWith("/storage/") 
                                                                ? filePath 
                                                                : `/storage/${filePath}`;
                                                        window.open(fixedPath, "_blank");
                                                    }
                                                }}
                                                title="View Attachment"
                                            >
                                                <img
                                                    src="/images/pdf-file.png"
                                                    alt="PDF"
                                                    className="w-full h-full"
                                                />
                                            </button>
                                        )}
                                        {request.status === 'Draft' && hasPermission('create_department_budget_request') && (
                                            <button
                                                className={`text-red-500 hover:text-red-800 ${
                                                    deletingId === request.id ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                                title="Delete Budget Request"
                                                onClick={() => handleDelete(request.id)}
                                                disabled={deletingId === request.id}
                                            >
                                                {deletingId === request.id ? (
                                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <FontAwesomeIcon icon={faTrash} />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="10"
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
                            } rounded-full hover:bg-[#0077B6] hover:text-white transition`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className={`px-3 py-1 rounded-full transition ${
                            currentPage >= lastPage || budgetRequests.length < 15
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-[#009FDC] text-white hover:bg-[#0077B6]"
                        }`}
                        disabled={currentPage >= lastPage || budgetRequests.length < 15}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default RequestBudgetTable;
