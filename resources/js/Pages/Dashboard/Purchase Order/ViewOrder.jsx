import React, { useState, useEffect } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { Link, router, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faEdit, faTrash, faCheck, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const FileDisplay = ({ file, fileName }) => {
    if (!file) return null;

    // Use the file_path directly for download
    const fileUrl = file;
    const displayName = fileName || 'View Attachment';

    return (
        <div className="flex flex-col items-center justify-center space-y-2">
            {/* Clickable PDF Icon */}
            <DocumentArrowDownIcon 
                className="h-10 w-10 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => fileUrl && window.open(fileUrl, '_blank')} // Opens file in a new tab
            />
            
            {/* File Name */}
            {fileUrl && (
                <span 
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-center break-words whitespace-normal w-full"
                    onClick={() => fileUrl && window.open(fileUrl, '_blank')} // Opens file when name is clicked
                >
                    {displayName}
                </span>
            )}
        </div>
    );
};

export default function ViewOrder({ auth }) {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    const fetchPurchaseOrders = async () => {
        setLoading(true);
        setProgress(0);
    
        const interval = setInterval(() => {
            setProgress((oldProgress) => (oldProgress >= 90 ? 90 : oldProgress + 10));
        }, 300);
    
        try {
            // Since we're getting a 500 error, let's debug the API endpoint
            console.log('Fetching purchase orders from API...');
            const response = await axios.get('/api/v1/purchase-orders', {
                params: { page: currentPage, include: 'quotation', per_page: 10 }
            });
            
            console.log('API Response:', response.data);
            
            const purchaseOrdersData = response.data.data || [];
            
            const purchaseOrdersWithDetails = await Promise.all(
                purchaseOrdersData.map(async (order) => {
                    let quotationDetails = { quotation_number: 'N/A', company_name: 'N/A' };
                    
                    // Try to get quotation details from included data first
                    if (order.quotation) {
                        quotationDetails = {
                            quotation_number: order.quotation.quotation_number || 'N/A',
                            company_name: order.quotation.company_name || 'N/A'
                        };
                    } 
                    // Fall back to separate API call if needed
                    else if (order.quotation_id) {
                        try {
                            const quotationResponse = await axios.get(`/api/v1/quotations/${order.quotation_id}`);
                            if (quotationResponse.data.data) {
                                quotationDetails = {
                                    quotation_number: quotationResponse.data.data.quotation_number || 'N/A',
                                    company_name: quotationResponse.data.data.company_name || 'N/A'
                                };
                            }
                        } catch (error) {
                            console.error(`Error fetching quotation ${order.quotation_id}:`, error);
                        }
                    }
                    
                    // Format attachment URL if present
                    let attachmentUrl = null;
                    if (order.attachment) {
                        attachmentUrl = order.attachment.startsWith('http') 
                            ? order.attachment 
                            : `/storage/${order.attachment}`;
                    }
                    
                    // Make sure all date fields are properly handled
                    return {
                        ...order,
                        quotation_number: quotationDetails.quotation_number,
                        company_name: quotationDetails.company_name,
                        purchase_order_date: order.purchase_order_date,
                        expiry_date: order.expiry_date,
                        formatted_attachment: attachmentUrl,
                        original_name: order.original_name || 'Document'
                    };
                })
            );
            
            setPurchaseOrders(purchaseOrdersWithDetails);
            setLastPage(response.data.meta?.last_page || 1);
            setError("");
    
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } catch (error) {
            console.error('API Error:', error);
            console.error('Error details:', error.response?.data);
            setError("Failed to load purchase orders. " + (error.response?.data?.message || ''));
            setPurchaseOrders([]);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } finally {
            clearInterval(interval);
        }
    };

    useEffect(() => {
        fetchPurchaseOrders();
    }, [currentPage]);

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getPaginationData = () => {
        const itemsPerPage = 10;
        const totalItems = purchaseOrders.length;
        const calculatedLastPage = Math.max(1, Math.ceil(totalItems / itemsPerPage));
        
        // Ensure current page is within valid range
        const validCurrentPage = Math.min(Math.max(1, currentPage), calculatedLastPage);
        
        // Calculate start and end indices for current page
        const startIndex = (validCurrentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        // Get current page's data
        const currentPageData = purchaseOrders.slice(startIndex, endIndex);
        
        return {
            totalItems,
            itemsPerPage,
            lastPage: calculatedLastPage,
            currentPage: validCurrentPage,
            currentPageData
        };
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
                    <Link href="/dashboard" className="hover:text-[#009FDC] text-xl">Dashboard</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    {/* <Link href="/purchase" className="hover:text-[#009FDC] text-xl">Procurement Center</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" /> */}
                    <span className="text-[#009FDC] text-xl">Purchase Orders</span>
                </div>
                <Head title="Purchase Orders" />

                <div className="w-full overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[32px] font-bold text-[#2C323C]">Purchase Orders</h2>
                        <Link
                            href="/create-order"
                            className="bg-[#009FDC] text-white px-7 py-3 rounded-full text-xl font-medium"
                        >
                            Create New Purchase Order
                        </Link>
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
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                    
                        
                        <table className="w-full">
                        {!loading && (
                            <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center">PO#</th>
                                    <th className="py-3 px-4 text-center">Quotation#</th>
                                    <th className="py-3 px-4 text-center">Company</th>
                                    <th className="py-3 px-4 text-center">Issue Date</th>
                                    <th className="py-3 px-4 text-center">Expiry Date</th>
                                    <th className="py-3 px-4 text-center">Amount</th>
                                    <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">Attachment</th>
                                </tr>
                            </thead>
                        )}

                            {!loading && (
                            <tbody className="bg-transparent divide-y divide-gray-200">
                                {purchaseOrders.length > 0 ? (
                                    getPaginationData().currentPageData.map((order) => (
                                        <tr key={order.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {order.purchase_order_no || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {order.quotation_number || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {order.company_name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {formatDateForDisplay(order.purchase_order_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {formatDateForDisplay(order.expiry_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {Number(order.amount || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex flex-col items-center justify-center w-full">
                                                    {order.formatted_attachment ? (
                                                        <FileDisplay file={order.formatted_attachment} fileName={order.original_name} />
                                                    ) : (
                                                        <span className="text-gray-500">No attachment</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">No purchase orders available.</td>
                                    </tr>
                                )}
                            </tbody>
                            )}
                        </table>

                        {/* Pagination */}
                        {!loading && purchaseOrders.length > 0 && (
                            <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                                <button
                                    onClick={() => setCurrentPage(getPaginationData().currentPage - 1)}
                                    className={`px-3 py-1 bg-[#009FDC] text-white rounded-full ${
                                        getPaginationData().currentPage <= 1 ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                    disabled={getPaginationData().currentPage <= 1}
                                >
                                    Previous
                                </button>
                                {Array.from({ length: getPaginationData().lastPage }, (_, index) => index + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1 ${
                                            getPaginationData().currentPage === page
                                                ? "bg-[#009FDC] text-white"
                                                : "border border-[#B9BBBD] bg-white text-black"
                                        } rounded-full`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(getPaginationData().currentPage + 1)}
                                    className={`px-3 py-1 bg-[#009FDC] text-white rounded-full ${
                                        getPaginationData().currentPage >= getPaginationData().lastPage ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                    disabled={getPaginationData().currentPage >= getPaginationData().lastPage}
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