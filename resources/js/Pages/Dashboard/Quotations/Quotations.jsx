import React, { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const Quotations = ({ auth }) => {
    const [quotations, setQuotations] = useState([]);
    const [filteredQuotations, setFilteredQuotations] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [selectedFilter, setSelectedFilter] = useState("All");
    const filters = ["All", "Expired", "Active", "Approved"];
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    const fetchQuotations = async () => {
        setLoading(true);
        setProgress(0);
    
        const interval = setInterval(() => {
            setProgress((oldProgress) => (oldProgress >= 90 ? 90 : oldProgress + 10));
        }, 300);
    
        try {
            const response = await axios.get(`/api/v1/quotations?page=${currentPage}`);
            const quotationsData = response.data.data;
            console.log("Quotations API Response:", response.data);
    
            const quotationsWithDetails = await Promise.all(
                quotationsData.map(async (quotation) => {
                    const [statusResponse, rfqResponse] = await Promise.all([
                        axios.get(`/api/v1/statuses/${quotation.status_id}`),
                        axios.get(`/api/v1/rfqs/${quotation.rfq_id}`)
                    ]);

                    console.log("RFQ API Response:", rfqResponse.data);
    
                    const companyName = quotation.rfq?.company?.name || "N/A"; 
    
                    if (rfqResponse.data.data.company_id) {
                        try {
                            const companyResponse = await axios.get(`/api/v1/companies/${rfqResponse.data.data.company_id}`);
                            companyName = companyResponse.data.data.name;
                            console.log("Company API Response:", companyResponse.data);
                        } catch (companyError) {
                            console.error("Failed to fetch company:", companyError);
                        }
                    }
    
                    return {
                        ...quotation,
                        company_name: companyName, // Store the company name
                        status_type: statusResponse.data.data.type,
                        status_name: statusResponse.data.data.name,
                    };
                })
            );
    
            setQuotations(quotationsWithDetails);
            applyFilter(selectedFilter, quotationsWithDetails);
            setLastPage(response.data.meta.last_page);
            setError("");
    
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } catch (error) {
            console.error("API Error:", error);
            setError("Failed to load quotations");
            setQuotations([]);
            setFilteredQuotations([]);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } finally {
            clearInterval(interval);
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
        setLoading(true);
        setProgress(0);
        setSelectedFilter(filter);
    
        const interval = setInterval(() => {
            setProgress((oldProgress) => (oldProgress >= 90 ? 90 : oldProgress + 10));
        }, 300);
    
        setTimeout(() => {
            applyFilter(filter);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
            clearInterval(interval);
        }, 3000); 
    };

    useEffect(() => {
        fetchQuotations();
    }, [currentPage]);

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
                            href="/new-quotation"
                            className="bg-[#009FDC] text-white px-7 py-3 rounded-full text-xl font-medium"
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

                        {/* Loading Bar */}
                        {loading && (
                            <div className="absolute left-[55%] transform -translate-x-1/2 mt-12 w-2/3">
                                <div className="relative w-full h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl font-bold text-white">
                                    <div
                                        className="absolute left-0 top-0 h-12 bg-[#009FDC] rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                    <span className="absolute text-white">
                                        {progress < 60 ? "Please Wait, Fetching Details..." : `${progress}%`}
                                    </span>
                                </div>
                            </div>
                        )}

                        {!loading && (
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
                                        {quotation.company_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {Number(quotation.total_amount).toLocaleString("en-US", {
                                            maximumFractionDigits: 0,
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        }) : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        )}
                    </table>

                    {/* Pagination */}
                    {!loading && !error && filteredQuotations.length > 0 && Math.ceil(filteredQuotations.length / 10) > 1 && (
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
                            {Array.from({ length: Math.ceil(filteredQuotations.length / 10) }, (_, index) => index + 1).map((page) => (
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
                                    currentPage >= Math.ceil(filteredQuotations.length / 10) ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                                disabled={currentPage >= Math.ceil(filteredQuotations.length / 10)}
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

export default Quotations;