import React, { useState, useEffect } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { Link, router, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faEdit, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import SelectFloating from "@/Components/SelectFloating";
import ApproveOrder from './ApproveOrder';

export default function CreateOrder({ auth }) {
    const [quotations, setQuotations] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [rfqs, setRfqs] = useState([]);
    const [selectedRfq, setSelectedRfq] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [purchaseOrders, setPurchaseOrders] = useState([]);

    const fetchRfqs = async () => {
        try {
            console.log('Fetching RFQs without purchase orders...');
            const response = await axios.get('/api/v1/rfqs/without-purchase-orders');
            console.log('RFQ Response:', response.data);
            
            if (response.data && response.data.success && response.data.data) {
                console.log('Setting RFQs:', response.data.data);
                setRfqs(response.data.data);
            } else {
                console.warn('No RFQs found or invalid response format:', response.data);
                setError("No RFQs found without purchase orders");
                setRfqs([]);
            }
        } catch (error) {
            console.error('Error fetching RFQs:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            setError("Failed to load RFQs: " + (error.response?.data?.message || 'Unknown error'));
            setRfqs([]);
        }
    };

    const fetchQuotations = async () => {
        setLoading(true);
        setProgress(0);
    
        const interval = setInterval(() => {
            setProgress((oldProgress) => (oldProgress >= 90 ? 90 : oldProgress + 10));
        }, 300);
    
        try {
            let url = '/api/v1/quotations';
            const params = {
                page: currentPage,
                include: 'rfq,purchaseOrder',
                per_page: 10
            };

            const response = await axios.get(url, { params });
            
            let quotationsData = response.data.data || [];
            
            // Filter quotations based on selected RFQ
            if (selectedRfq && selectedRfq !== 'all') {
                quotationsData = quotationsData.filter(quotation => 
                    quotation.rfq && quotation.rfq.id === parseInt(selectedRfq)
                );
            } else if (selectedRfq === 'all') {
                // Show all quotations
                quotationsData = quotationsData;
            } else {
                quotationsData = []; // Show no quotations if no RFQ is selected
            }
    
            // First, fetch all purchase orders to check which quotations have POs
            const purchaseOrdersResponse = await axios.get('/api/v1/purchase-orders');
            const purchaseOrdersData = purchaseOrdersResponse.data.data || [];
            const quotationIdsWithPO = new Set(purchaseOrdersData.map(po => po.quotation_id));
    
            const quotationsWithDetails = await Promise.all(
                quotationsData.map(async (quotation) => {
                    let categoryName = 'N/A';
                    
                    if (quotation.rfq && quotation.rfq.id) {
                        try {
                            const categoryResponse = await axios.get(`/api/v1/rfq-categories/${quotation.rfq.id}`);
                            categoryName = categoryResponse.data.data.category_name;
                        } catch (error) {
                            console.error('Error fetching category:', error);
                        }
                    }

                    // Check if quotation_id exists in purchase_orders table
                    const hasPurchaseOrder = quotationIdsWithPO.has(quotation.id);
                    
                    console.log('Quotation Details:', {
                        id: quotation.id,
                        quotation_number: quotation.quotation_number,
                        has_purchase_order: hasPurchaseOrder,
                        purchaseOrders: purchaseOrdersData.filter(po => po.quotation_id === quotation.id)
                    });
                    
                    return {
                        ...quotation,
                        category_name: categoryName,
                        has_purchase_order: hasPurchaseOrder
                    };
                })
            );
    
            if (quotationsWithDetails.length > 0) {
                quotationsWithDetails.sort((a, b) => a.id - b.id);
            }
    
            console.log('All Quotations with Purchase Order Status:', quotationsWithDetails);
            setQuotations(quotationsWithDetails);
            setLastPage(response.data.meta?.last_page || 1);
            setError("");
    
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
        fetchRfqs();
    }, []);

    useEffect(() => {
        fetchQuotations();
    }, [currentPage, selectedRfq]);

    const handleRfqChange = (e) => {
        setSelectedRfq(e.target.value);
        setCurrentPage(1); // Reset to first page when RFQ changes
    };

    const handleCreatePO = (quotation) => {
        console.log('Creating new PO for quotation:', quotation);
        setSelectedQuotation(quotation);
        setIsModalOpen(true);
    };

    const handleEditPO = (quotation) => {
        console.log('Editing PO for quotation:', quotation);
        // Find the purchase order for this quotation
        const purchaseOrder = purchaseOrders.find(po => po.quotation_id === quotation.id);
        console.log('Found purchase order:', purchaseOrder);
        setSelectedQuotation({
            ...quotation,
            purchaseOrder: purchaseOrder
        });
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedQuotation(null);
        fetchQuotations(); // Refresh the quotations list
    };

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
                    <Link href="/dashboard" className="hover:text-[#009FDC] text-xl">Dashboard</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <Link href="/view-order" className="hover:text-[#009FDC] text-xl">Purchase Orders</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <span className="text-[#009FDC] text-xl">Create Purchase Order</span>
                </div>
                <Head title="Create Purchase Order" />

                <div className="w-full overflow-hidden">
                    <div className="flex justify-between items-center mb-6 pt-4">
                        <h2 className="text-[32px] font-bold text-[#2C323C]">Create Purchase Order</h2>
                        <div className="w-1/3">
                            <SelectFloating
                                label="RFQ to View Quotations"
                                name="rfq"
                                value={selectedRfq || ''}
                                onChange={handleRfqChange}
                                options={[
                                    { id: 'all', label: 'All RFQs' },
                                    ...rfqs.map(rfq => ({
                                        id: rfq.id,
                                        label: rfq.organization_name
                                    }))
                                ]}
                                className="min-h-[70px] py-2"
                            />
                        </div>
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
                                {!selectedRfq ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                            Please select an RFQ to view quotations
                                        </td>
                                    </tr>
                                ) : quotations.length > 0 ? (
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
                                                {quotation.has_purchase_order ? (
                                                    <button
                                                        onClick={() => handleEditPO(quotation)}
                                                        className="text-gray-600 hover:text-gray-800"
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} className="h-5 w-5" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleCreatePO(quotation)}
                                                        className="text-gray-400 hover:text-gray-600"
                                                    >
                                                        <PlusCircleIcon className="h-6 w-6" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                            No quotations found for the selected RFQ
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            )}
                        </table>

                        {/* Pagination - Only show if there are quotations */}
                        {!loading && !error && selectedRfq && quotations.length > 0 && (
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

                {/* ApproveOrder Modal */}
                {isModalOpen && (
                    <ApproveOrder
                        isOpen={isModalOpen}
                        onClose={handleModalClose}
                        onSave={handleModalClose}
                        quotationId={selectedQuotation?.id}
                        purchaseOrder={selectedQuotation?.purchaseOrder}
                        isEdit={selectedQuotation?.has_purchase_order}
                    />
                )}
            </div>
        </AuthenticatedLayout>
    );
}