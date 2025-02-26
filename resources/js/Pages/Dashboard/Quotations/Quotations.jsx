import React, { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faEdit, faTrash, faCheck, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const RFQ = ({ auth }) => {
    const [quotations, setQuotations] = useState([]);
    const [filteredQuotations, setFilteredQuotations] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [selectedFilter, setSelectedFilter] = useState("All");
    const filters = ["All", "Expired", "Active", "Approved"];

    const fetchQuotations = async () => {
        try {
            const response = await axios.get(`/api/v1/quotations?page=${currentPage}`);
            const quotationsData = response.data.data;
            
            // Fetch status details for each quotation
            const quotationsWithDetails = await Promise.all(
                quotationsData.map(async (quotation) => {
                    // Fetch status details
                    const statusResponse = await axios.get(`/api/v1/statuses/${quotation.status_id}`);
                    // Fetch RFQ details
                    const rfqResponse = await axios.get(`/api/v1/rfqs/${quotation.rfq_id}`);
                    
                    return {
                        ...quotation,
                        organization_name: rfqResponse.data.data.organization_name,
                        status_type: statusResponse.data.data.type,
                        status_name: statusResponse.data.data.name
                    };
                })
            );
            
            setQuotations(quotationsWithDetails);
            applyFilter(selectedFilter, quotationsWithDetails);
            setLastPage(response.data.meta.last_page);
            setError("");
        } catch (error) {
            console.error('API Error:', error);
            setError("Failed to load quotations");
            setQuotations([]);
            setFilteredQuotations([]);
        }
    };

    // Apply filter function
    const applyFilter = (filter, data = quotations) => {
        const quotationsToFilter = data.length > 0 ? data : quotations;
        
        switch(filter) {
            case 'Expired':
                setFilteredQuotations(quotationsToFilter.filter(
                    quotation => quotation.status_name.toLowerCase() === 'expired'
                ));
                break;
            case 'Active':
                setFilteredQuotations(quotationsToFilter.filter(
                    quotation => quotation.status_name.toLowerCase() === 'active'
                ));
                break;
            case 'Approved':
                setFilteredQuotations(quotationsToFilter.filter(
                    quotation => quotation.status_name.toLowerCase() === 'approved'
                ));
                break;
            default: // 'All'
                setFilteredQuotations(quotationsToFilter);
                break;
        }
    };

    // Handle filter change
    const handleFilterChange = (filter) => {
        setSelectedFilter(filter);
        applyFilter(filter);
    };

    useEffect(() => {
        fetchQuotations();
    }, [currentPage]);

    const handleEdit = (quotation) => {
        setEditingId(quotation.id);
        setEditData(quotation);
    };

    const handleSave = async (id) => {
        try {
            const response = await axios.put(`/api/v1/quotations/${id}`, editData);
            if (response.data) {
                setEditingId(null);
                fetchQuotations(); // Refresh the data
            }
        } catch (error) {
            console.error('Save error:', error);
            setError('Failed to save changes');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            await axios.delete(`/api/v1/quotations/${id}`);
            fetchQuotations(); // Refresh data
        } catch (error) {
            console.error('Error deleting record:', error);
        }
    };

    const handleChange = (field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const formatDateTime = (dateString) => {
        const optionsDate = { year: "numeric", month: "long", day: "numeric" };
        const optionsTime = { hour: "2-digit", minute: "2-digit", hour12: true };
    
        const dateObj = new Date(dateString);
        const formattedDate = dateObj.toLocaleDateString("en-US", optionsDate);
        const formattedTime = dateObj.toLocaleTimeString("en-US", optionsTime);
    
        return (
            <div>
                {formattedDate}
                <br />
                <span className="text-gray-500">at {formattedTime}</span>
            </div>
        );
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <div className="min-h-screen p-6">
                {/* Back Button and Breadcrumbs */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => router.visit("/dashboard")}
                        className="flex items-center text-black text-2xl font-medium hover:text-gray-800 p-2"
                    >
                        <FontAwesomeIcon icon={faArrowLeftLong} className="mr-2 text-2xl" />
                        Back
                    </button>
                </div>
                <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2 mb-6">
                    <Link href="/dashboard" className="hover:text-[#009FDC] text-xl">Home</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <Link href="/purchase" className="hover:text-[#009FDC] text-xl">Purchases</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <span className="text-[#009FDC] text-xl">Quotations</span>
                </div>

                {/* Quotations Heading and Buttons */}
                <div className="flex justify-between items-center mb-12">
                    <h2 className="text-[32px] font-bold text-[#2C323C] whitespace-nowrap">Quotations</h2>
                    <div className="flex items-center space-x-4">
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
                        <Link
                            href="/quotations/create"
                            className="bg-[#009FDC] text-white px-6 py-2 rounded-full text-xl font-medium"
                        >
                            Add Quotation
                        </Link>
                    </div>
                </div>

                {/* Quotations Table */}
                <div className="w-full overflow-hidden">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    <table className="w-full">
                        <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center">Quotation#</th>
                                <th className="py-3 px-4 text-center">RFQ#</th>
                                <th className="py-3 px-4 text-center">Company</th>
                                <th className="py-3 px-4 text-center">Amount</th>
                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">Expiry Date</th>
                            </tr>
                        </thead>

                        <tbody className="bg-transparent divide-y divide-gray-200">
                            {filteredQuotations.map((quotation) => (
                                <tr key={quotation.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {quotation.quotation_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {quotation.rfq_id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {quotation.organization_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {quotation.total_amount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {new Date(quotation.valid_until).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {!error && filteredQuotations.length > 0 && (
                        <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                className={`px-3 py-1 bg-[#009FDC] text-white rounded-full ${
                                    currentPage <= 1 ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                                disabled={currentPage <= 1}
                            >
                                Previous
                            </button>
                            {Array.from({ length: lastPage }, (_, index) => index + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 ${
                                        currentPage === page
                                            ? "bg-[#009FDC] text-white"
                                            : "border border-[#B9BBBD] bg-white text-black"
                                    } rounded-full`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                className={`px-3 py-1 bg-[#009FDC] text-white rounded-full ${
                                    currentPage >= lastPage ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                                disabled={currentPage >= lastPage}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default RFQ;