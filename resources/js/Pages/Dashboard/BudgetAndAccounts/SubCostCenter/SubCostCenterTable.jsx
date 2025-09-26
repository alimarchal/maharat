import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import SubCostCenterModal from "./SubCostCenterModal";

const SubCostCenterTable = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [selectedFilter, setSelectedFilter] = useState("All");
    const [subCostCenters, setSubCostCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSubCostCenter, setSelectedSubCostCenter] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const filters = ["All", "Approved", "Pending"];

    const fetchSubCostCenters = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `/api/v1/cost-centers?include=parent,children,department,manager,budgetOwner&page=${currentPage}&per_page=15&is_main=false&status_filter=${selectedFilter}`
            );
            
            setSubCostCenters(response.data.data || []);
            setLastPage(response.data.meta?.last_page || 1);
            setError(null);
        } catch (error) {
            console.error("Error details:", error.response?.data);
            setError(
                "Failed to load sub-cost centers. Please try again later."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubCostCenters();
    }, [currentPage, selectedFilter]); // Added selectedFilter to dependency array

    const handleDelete = async (id) => {
        if (
            window.confirm(
                "Are you sure you want to delete this Sub Cost Center?"
            )
        ) {
            try {
                await axios.delete(`/api/v1/cost-centers/${id}`);
                fetchSubCostCenters();
            } catch (error) {
                console.error("Error deleting sub cost center:", error);
                alert("An error occurred while deleting the sub cost center. Please try again.");
            }
        }
    };

    // Function to get parent name
    const getParentName = (center) => {
        if (!center.parent_id) return "No Parent";
        
        // Use the included parent data directly
        if (center.parent) {
            return center.parent.name;
        }
        return "N/A";
    };

    // Format currency for display
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return "0.00";
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-[#2C323C] mb-4">
                    Sub Cost Centers
                </h2>
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
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                ID
                            </th>
                            <th className="py-3 px-4">Cost Center Name</th>
                            <th className="py-3 px-4">Sub Cost Center Name</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Department/Unit</th>
                            <th className="py-3 px-4">Manager</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Expenses</th>
                            <th className="py-3 px-4">Balance</th>
                            <th className="py-3 px-4">Description</th>
                            <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                        {loading ? (
                            <tr>
                                <td colSpan="11" className="py-12">
                                    <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td
                                    colSpan="11"
                                    className="text-center text-red-500 font-medium py-4"
                                >
                                    {error}
                                </td>
                            </tr>
                        ) : subCostCenters.length > 0 ? (
                            subCostCenters
                                .map((center, index) => {
                                    // Calculate display ID based on current page and items per page
                                    const itemsPerPage = 15; // Default Laravel pagination
                                    const displayId = (currentPage - 1) * itemsPerPage + index + 1;
                                    
                                    return (
                                        <tr key={center.id}>
                                            <td className="py-3 px-4">{displayId}</td>
                                            <td className="py-3 px-4">
                                                {getParentName(center)}
                                            </td>
                                            <td className="py-3 px-4">{center.name}</td>
                                            <td className="py-3 px-4">
                                                {center.cost_center_type || "N/A"}
                                            </td>
                                            <td className="py-3 px-4">
                                                {center.department?.name || "N/A"}
                                            </td>
                                            <td className="py-3 px-4">
                                                {center.manager?.name || "N/A"}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    center.status === 'Approved' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {center.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-red-600">
                                                    {formatCurrency(center.total_expenses)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-green-600">
                                                    {formatCurrency(center.total_balance)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {center.description || "N/A"}
                                            </td>
                                            <td className="py-3 px-4 flex justify-center text-center space-x-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedSubCostCenter(
                                                            center
                                                        );
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="text-blue-400 hover:text-blue-500"
                                                    title="Edit Sub Cost Center"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(center.id)
                                                    }
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Delete Sub Cost Center"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                        ) : (
                            <tr>
                                <td
                                    colSpan="11"
                                    className="text-center text-[#2C323C] font-medium py-4"
                                >
                                    No Sub Cost Centers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!loading && !error && subCostCenters.length > 0 && (
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
                            currentPage >= lastPage || subCostCenters.length < 15
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-[#009FDC] text-white hover:bg-[#0077B6]"
                        }`}
                        disabled={currentPage >= lastPage || subCostCenters.length < 15}
                    >
                        Next
                    </button>
                </div>
            )}

            <div className="flex justify-center items-center relative w-full my-8">
                <div
                    className="absolute top-1/2 left-0 w-[45%] h-[3px] max-sm:w-[35%] flex-grow"
                    style={{
                        background:
                            "linear-gradient(to right, #9B9DA2, #9B9DA200)",
                    }}
                ></div>
                <button
                    type="button"
                    className="p-2 text-base sm:text-lg flex items-center bg-white rounded-full border border-[#B9BBBD] text-[#9B9DA2] transition-all duration-300 hover:border-[#009FDC] hover:bg-[#009FDC] hover:text-white hover:scale-105"
                    onClick={() => {
                        setSelectedSubCostCenter(null);
                        setIsModalOpen(true);
                    }}
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add a Sub
                    Cost Center
                </button>
                <div
                    className="absolute top-1/2 right-0 w-[45%] h-[3px] max-sm:w-[35%] flex-grow"
                    style={{
                        background:
                            "linear-gradient(to left, #9B9DA2, #9B9DA200)",
                    }}
                ></div>
            </div>

            {/* Render the modal */}
            <SubCostCenterModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedSubCostCenter(null);
                }}
                subCostCenterData={selectedSubCostCenter}
                fetchSubCostCenters={fetchSubCostCenters}
            />
        </div>
    );
};

export default SubCostCenterTable;
