import React, { useState, useEffect } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { Link, router, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faEdit, faTrash, faCheck, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

export default function CreateOrder({ auth }) {
    const [quotations, setQuotations] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    const fetchQuotations = async () => {
        setLoading(true);
        setProgress(0);
    
        // Smoothly increase progress
        const interval = setInterval(() => {
            setProgress((oldProgress) => (oldProgress >= 90 ? 90 : oldProgress + 10));
        }, 300);
    
        try {
            // Fetch quotations with their relationships
            console.log('Fetching quotations...');
            const response = await axios.get('/api/v1/quotations', {
                params: { 
                    page: currentPage,
                    include: 'rfq',
                    per_page: 10
                }
            });
            console.log('API Response:', response.data);
            
            const quotationsData = response.data.data || [];
    
            // Fetch category details for each quotation
            const quotationsWithDetails = await Promise.all(
                quotationsData.map(async (quotation) => {
                    let categoryName = 'N/A';
                    
                    // If quotation has an RFQ, fetch its category
                    if (quotation.rfq && quotation.rfq.id) {
                        try {
                            const categoryResponse = await axios.get(`/api/v1/rfq-categories/${quotation.rfq.id}`);
                            categoryName = categoryResponse.data.data.category_name;
                        } catch (error) {
                            console.error('Error fetching category:', error);
                        }
                    }
                    
                    return {
                        ...quotation,
                        category_name: categoryName
                    };
                })
            );
    
            // Sort quotations by id in ascending order
            if (quotationsWithDetails.length > 0) {
                quotationsWithDetails.sort((a, b) => a.id - b.id);
            }
    
            setQuotations(quotationsWithDetails);
            setLastPage(response.data.meta?.last_page || 1);
            setError("");
    
            // Ensure full progress bar before hiding
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } catch (error) {
            console.error('API Error:', error);
            setError("Failed to load quotations: " + (error.response?.data?.message || 'Unknown error'));
            setQuotations([]);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } finally {
            clearInterval(interval);
        }
    };    

    useEffect(() => {
        fetchQuotations();
    }, [currentPage]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <div className="min-h-screen p-6">
                {/* Back Button and Breadcrumbs */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => router.visit("/view-order")}
                        className="flex items-center text-black text-2xl font-medium hover:text-gray-800 p-2"
                    >
                        <FontAwesomeIcon icon={faArrowLeftLong} className="mr-2 text-2xl" />
                        Back
                    </button>
                </div>
                <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2 mb-6">
                    <Link href="/dashboard" className="hover:text-[#009FDC] text-xl">Home</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <Link href="/purchase" className="hover:text-[#009FDC] text-xl">Procurement Center</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <Link href="/view-order" className="hover:text-[#009FDC] text-xl">Purchase Orders</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <span className="text-[#009FDC] text-xl">Create Purchase Order</span>
                </div>
                <Head title="Create Purchase Order" />

                <div className="w-full overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[32px] font-bold text-[#2C323C]">Create Purchase Order</h2>
                    </div>

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

                    <div className="w-full overflow-hidden">
                        {!loading && error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        
                        <table className="w-full">
                            {!loading && (
                            <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center">Quotation#</th>
                                    <th className="py-3 px-4 text-center">Date</th>
                                    <th className="py-3 px-4 text-center">Category</th>
                                    <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">Action</th>
                                </tr>
                            </thead>
                            )}

                            {!loading && (
                            <tbody className="bg-transparent divide-y divide-gray-200">
                                {quotations.length > 0 ? (
                                    quotations.map((quotation) => (
                                        <tr key={quotation.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {quotation.quotation_number || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {formatDate(quotation.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {quotation.category_name || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <Link 
                                                    href={`/approve-order?quotation_id=${quotation.id}`}
                                                    onClick={() => console.log('Sending quotation_id:', quotation.id)}
                                                >
                                                    <PlusCircleIcon className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer mx-auto" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                            No quotations found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            )}
                        </table>

                        {/* Pagination */}
                        {!loading && !error && quotations.length > 0 && (
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
                                {Array.from({ length: Math.ceil(quotations.length / 10) }, (_, index) => index + 1).map((page) => (
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
                                        currentPage >= Math.ceil(quotations.length / 10) ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                    disabled={currentPage >= Math.ceil(quotations.length / 10)}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}