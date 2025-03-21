import React, { useState, useEffect } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { Link, router, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faEdit, faTrash, faCheck, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';

const FileDisplay = ({ file, pendingFile }) => {
    // If there's a pending file to be uploaded, show it as a preview with an indicator
    if (pendingFile) {
        // For local file preview, create a temporary URL
        const tempUrl = URL.createObjectURL(pendingFile);
        
        return (
            <div className="flex flex-col items-center justify-center space-y-2">
                <DocumentArrowDownIcon 
                    className="h-10 w-10 text-orange-500 cursor-pointer hover:text-orange-700 transition-colors"
                    onClick={() => window.open(tempUrl, '_blank')}
                />
                <span className="text-sm text-orange-600 text-center break-words whitespace-normal w-full">
                    {pendingFile.name} (Pending save)
                </span>
            </div>
        );
    }

    if (!file) return (
        <span className="text-gray-500">No document attached</span>
    );

    // Show the existing file
    let fileUrl;
    let displayName;
    
    if (typeof file === 'object') {
        fileUrl = file.file_path;
        displayName = file.original_name;
    } else {
        // If file is a string path
        fileUrl = file.startsWith('http') ? file : `/storage/${file}`;
        displayName = 'View Attachment';
    }

    return (
        <div className="flex flex-col items-center justify-center space-y-2">
            <DocumentArrowDownIcon 
                className="h-10 w-10 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => fileUrl && window.open(fileUrl, '_blank')}
            />
            
            <span 
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-center break-words whitespace-normal w-full"
                onClick={() => fileUrl && window.open(fileUrl, '_blank')}
            >
                {displayName}
            </span>
        </div>
    );
};

export default function ApproveOrder({ auth }) {
    const { props } = usePage();
    const urlParams = new URLSearchParams(window.location.search);
    const quotationId = urlParams.get('quotation_id');

    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [attachingFile, setAttachingFile] = useState(false);
    const [tempDocuments, setTempDocuments] = useState({});
    const [quotationDetails, setQuotationDetails] = useState(null);
    const [companies, setCompanies] = useState([]);

    const fetchPurchaseOrders = async () => {
        if (!quotationId) {
            setError("No quotation ID provided");
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setProgress(0);
    
        try {
            // Fetch companies first if not already loaded
            if (companies.length === 0) {
                await fetchCompanies();
            }

            // Fetch the quotation details
            const quotationResponse = await axios.get(`/api/v1/quotations/${quotationId}`);
            setQuotationDetails(quotationResponse.data.data);
            
            // Get purchase orders
            const poResponse = await axios.get('/api/v1/purchase-orders', {
                params: {
                    quotation_id: quotationId,
                    include: 'quotation,company' // Add company to included relations
                }
            });
            
            if (poResponse.data && poResponse.data.data && poResponse.data.data.length > 0) {
                const processedOrders = poResponse.data.data.map(order => {
                    let formattedOrder = {...order};
                    
                    // Get company details
                    if (order.company) {
                        formattedOrder.company_name = order.company.name;
                        formattedOrder.company_id = order.company.id;
                    } else if (order.quotation && order.quotation.company_name) {
                        formattedOrder.company_name = order.quotation.company_name;
                    }
                    
                    // Process attachment
                    if (order.attachment) {
                        formattedOrder.attachment = {
                            file_path: order.attachment.startsWith('http') 
                                ? order.attachment 
                                : `/storage/${order.attachment}`,
                            original_name: order.original_name || 'View Attachment'
                        };
                    }
                    
                    return formattedOrder;
                });
                
                setPurchaseOrders(processedOrders);
            } else {
                // Create new PO if none exists...
            }
            
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } catch (error) {
            console.error('API Error:', error);
            setError(`Failed to load data: ${error.response?.data?.message || error.message}`);
            setPurchaseOrders([]);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        }
    };

    // Fetch companies for dropdown
    const fetchCompanies = async () => {
        try {
            const response = await axios.get('/api/v1/companies');
            if (response.data && response.data.data) {
                setCompanies(response.data.data);
                console.log('Companies fetched:', response.data.data);
            } else {
                console.error('Invalid companies data format:', response.data);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    useEffect(() => {
        // Load companies for dropdown
        fetchCompanies();
        
        // Then fetch purchase orders
        fetchPurchaseOrders();
        
        // Add event listener for beforeunload to warn about unsaved changes
        const handleBeforeUnload = (e) => {
            if (editingId !== null) {
                // Cancel the event
                e.preventDefault();
                // Chrome requires returnValue to be set
                e.returnValue = '';
                return 'You have unsaved changes. Are you sure you want to leave?';
            }
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        // Cleanup
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [quotationId]);

    const handleSave = async (id) => {
        try {
            setAttachingFile(true);
            setProgress(0);
            
            const interval = setInterval(() => {
                setProgress(oldProgress => Math.min(oldProgress + 5, 90));
            }, 200);
            
            const formData = new FormData();
            
            // Required field status to avoid validation errors
            formData.append('status', editData.status || 'Draft');
            
            // Fields to exclude from the form data
            const fieldsToExclude = [
                'id', 
                'attachment', 
                'original_name',
                'purchase_order_no', // Add this to exclude PO number during update
                'created_at',
                'updated_at',
                'user_id'
            ];
            
            // Add all valid fields to the form data
            Object.keys(editData).forEach(key => {
                if (!fieldsToExclude.includes(key) && !key.startsWith('new-')) {
                    if (editData[key] !== null && editData[key] !== undefined && editData[key] !== '') {
                        formData.append(key, editData[key]);
                    }
                }
            });
            
            // Make sure critical fields are present
            if (!formData.has('quotation_id') && quotationId) {
                formData.append('quotation_id', quotationId);
            }
            
            if (!formData.has('supplier_id') && quotationDetails?.supplier_id) {
                formData.append('supplier_id', quotationDetails.supplier_id);
            }
            
            // Add company_id if available
            if (editData.company_id) {
                formData.append('company_id', editData.company_id);
            }
            
            // Handle temporary document if it exists
            if (tempDocuments[id]) {
                formData.append('attachment', tempDocuments[id]);
                formData.append('original_name', tempDocuments[id].name);
            }
            
            try {
                let response;
                if (id.toString().includes('new-')) {
                    response = await axios.post('/api/v1/purchase-orders', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                } else {
                    // For existing records, use PUT
                    response = await axios.post(`/api/v1/purchase-orders/${id}`, formData, {
                        headers: { 
                            'Content-Type': 'multipart/form-data',
                            'X-HTTP-Method-Override': 'PUT'
                        }
                    });
                }
                
                // Clear temporary document state after successful save
                if (tempDocuments[id]) {
                    const updatedTempDocs = {...tempDocuments};
                    delete updatedTempDocs[id];
                    setTempDocuments(updatedTempDocs);
                }
                
                // Reset editing state
                setEditingId(null);
                setError("");
                
                clearInterval(interval);
                setProgress(100);
                
                alert('Purchase order saved successfully!');
                
                setTimeout(() => {
                    setAttachingFile(false);
                    fetchPurchaseOrders();
                }, 500);
            } catch (error) {
                clearInterval(interval);
                console.error('Save error:', error.response?.data || error.message);
                setError(`Failed to save purchase order: ${error.response?.data?.message || error.message}`);
                setAttachingFile(false);
                setProgress(0);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            setError(`An unexpected error occurred: ${error.message}`);
            setAttachingFile(false);
            setProgress(0);
        }
    };

    const handleEdit = (po) => {
        // Create a clean copy of the PO data for editing
        const editablePo = {...po};
        
        // If attachment is in object form, keep the structure
        if (editablePo.attachment && typeof editablePo.attachment === 'object') {
            // Keep attachment as is
        } 
        // If it's a string path, leave as is - the backend expects either a file or null
        
        console.log('Editing purchase order:', editablePo);
        setEditingId(po.id);
        setEditData(editablePo);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this purchase order?")) return;

        try {
            if (id.toString().includes('new-')) {
                setPurchaseOrders(prevOrders => prevOrders.filter(po => po.id !== id));
            } else {
                await axios.delete(`/api/v1/purchase-orders/${id}`);
                fetchPurchaseOrders();
            }
        } catch (error) {
            console.error('Delete error:', error);
            setError('Failed to delete purchase order');
        }
    };

    const addItem = () => {
        const newPurchaseOrder = {
            id: `new-${Date.now()}`,
            purchase_order_no: 'System Generated',  // This will be generated by backend
            quotation_id: quotationId,
            supplier_id: quotationDetails?.supplier_id || null,
            purchase_order_date: '',
            expiry_date: '',
            amount: 0,
            status: 'Draft',
            company_name: '',
            quotation_number: quotationDetails?.quotation_number || '',
            attachment: null,
            original_name: null
        };
        
        setPurchaseOrders([...purchaseOrders, newPurchaseOrder]);
        setEditingId(newPurchaseOrder.id);
        setEditData(newPurchaseOrder);
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format for input
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return "DD/MM/YYYY";
            }
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return "DD/MM/YYYY";
        }
    };

    const handleFileUpload = (poId, file) => {
        if (!file) {
            setError("No file selected.");
            return;
        }
        
        // Store the file temporarily - DO NOT upload immediately
        setTempDocuments({
            ...tempDocuments,
            [poId]: file
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <div className="min-h-screen p-6">
                {/* Back Button and Breadcrumbs */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => router.visit("/create-order")}
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
                    <Link href="/create-order" className="hover:text-[#009FDC] text-xl">Create Purchase Order</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <span className="text-[#009FDC] text-xl">Approve Purchase Order</span>
                </div>
                <Head title="Approve Purchase Order" />

                <div className="w-full overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[32px] font-bold text-[#2C323C]">Approve Purchase Order</h2>
                    </div>

                    {quotationDetails && (
                        <p className="text-purple-600 text-2xl mb-6">Quotation# {quotationDetails.quotation_number}</p>
                    )}

                    <div className="w-full overflow-hidden">
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        
                        {/* Loading Bar */}
                        {(loading || attachingFile) && (
                            <div className="absolute left-[55%] transform -translate-x-1/2 mt-12 w-2/3">
                                <div className="relative w-full h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl font-bold text-white">
                                    <div
                                        className="absolute left-0 top-0 h-12 bg-[#009FDC] rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                    <span className="absolute text-white">
                                        {attachingFile ? "Saving Purchase Order..." : (progress < 60 ? "Please Wait, Fetching Details..." : `${progress}%`)}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        <table className="w-full">
                            <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center">PO#</th>
                                    <th className="py-3 px-4 text-center">Company</th>
                                    <th className="py-3 px-4 text-center">Issue Date</th>
                                    <th className="py-3 px-4 text-center">Expiry Date</th>
                                    <th className="py-3 px-4 text-center">Amount</th>
                                    <th className="py-3 px-4 text-center">Attachment</th>
                                    <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">Actions</th>
                                </tr>
                            </thead>

                            {!loading && !attachingFile && (
                            <tbody className="bg-transparent divide-y divide-gray-200">
                                {purchaseOrders.length > 0 ? (
                                    purchaseOrders.map((po) => (
                                        <tr key={po.id}>
                                            <td className="px-6 py-4 text-center break-words whitespace-normal min-w-[120px] max-w-[150px]">
                                                {/* PO Number is read-only as it's system generated */}
                                                <span className="inline-block break-words w-full text-[17px] text-black">
                                                    {po.purchase_order_no}
                                                </span>
                                            </td>
                                            
                                            <td className="px-6 py-4 text-center break-words whitespace-normal min-w-[150px] max-w-[170px]">
                                                {editingId === po.id ? (
                                                    <select
                                                        value={editData.company_name || ''}
                                                        onChange={(e) => {
                                                            const selectedCompany = companies.find(c => c.name === e.target.value);
                                                            setEditData({ 
                                                                ...editData, 
                                                                company_name: e.target.value,
                                                                company_id: selectedCompany ? selectedCompany.id : null
                                                            });
                                                        }}
                                                        className="text-[17px] text-black bg-transparent border-none focus:ring-0 w-full text-center break-words"
                                                    >
                                                        <option value="">Select a company</option>
                                                        {companies.map((company) => (
                                                            <option key={company.id} value={company.name}>
                                                                {company.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="inline-block break-words w-full text-[17px] text-black">
                                                        {po.company_name || 'N/A'}
                                                    </span>
                                                )}
                                            </td>
                                            
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {editingId === po.id ? (
                                                    <input
                                                        type="date"
                                                        value={editData.purchase_order_date ? formatDateForInput(editData.purchase_order_date) : ""}
                                                        onChange={(e) => setEditData({ ...editData, purchase_order_date: e.target.value })}
                                                        className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center"
                                                        placeholder="DD/MM/YYYY"
                                                    />
                                                ) : (
                                                    formatDateForDisplay(po.purchase_order_date) || "DD/MM/YYYY"
                                                )}
                                            </td>
                                            
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {editingId === po.id ? (
                                                    <input
                                                        type="date"
                                                        value={editData.expiry_date ? formatDateForInput(editData.expiry_date) : ""}
                                                        onChange={(e) => setEditData({ ...editData, expiry_date: e.target.value })}
                                                        className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center"
                                                        placeholder="DD/MM/YYYY"
                                                    />
                                                ) : (
                                                    formatDateForDisplay(po.expiry_date) || "DD/MM/YYYY"
                                                )}
                                            </td>
                                            
                                            <td className="px-6 py-4 whitespace-normal break-words text-center min-w-[120px]">
                                                {editingId === po.id ? (
                                                    <div className="flex items-center justify-center space-x-2">
                                                        {/* Decrement Button */}
                                                        <button
                                                            onClick={() =>
                                                                setEditData((prev) => ({
                                                                    ...prev,
                                                                    amount: Math.max(0, parseInt(prev.amount || 0) - 1),
                                                                }))
                                                            }
                                                            className="text-gray-600 hover:text-gray-900"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>

                                                        {/* Input Field */}
                                                        <input
                                                            type="number"
                                                            value={parseInt(editData.amount || 0)}
                                                            onChange={(e) => {
                                                                const value = Math.max(0, Math.floor(e.target.value)); // Ensure whole number & no negatives
                                                                setEditData({ ...editData, amount: value });
                                                            }}
                                                            className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-[70px] text-center [&::-webkit-inner-spin-button]:hidden"
                                                        />

                                                        {/* Increment Button */}
                                                        <button
                                                            onClick={() =>
                                                                setEditData((prev) => ({
                                                                    ...prev,
                                                                    amount: parseInt(prev.amount || 0) + 1,
                                                                }))
                                                            }
                                                            className="text-gray-600 hover:text-gray-900"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="break-words min-w-[100px] inline-block">{parseInt(po.amount || 0).toLocaleString()}</span>
                                                )}
                                            </td>
                                            
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center justify-center w-full">
                                                    {/* Show pending file preview or the existing document */}
                                                    {tempDocuments[po.id] ? (
                                                        <FileDisplay pendingFile={tempDocuments[po.id]} />
                                                    ) : po.attachment ? (
                                                        <FileDisplay file={po.attachment} />
                                                    ) : (
                                                        <span className="text-gray-500">No document attached</span>
                                                    )}

                                                    {editingId === po.id && (
                                                        <>
                                                            <input
                                                                type="file"
                                                                onChange={(e) => handleFileUpload(po.id, e.target.files[0])}
                                                                className="hidden"
                                                                id={`file-input-${po.id}`}
                                                                accept=".pdf,.doc,.docx"
                                                            />
                                                            <label 
                                                                htmlFor={`file-input-${po.id}`}
                                                                className="mt-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
                                                            >
                                                                {tempDocuments[po.id] || po.attachment
                                                                    ? 'Replace file' 
                                                                    : 'Attach file'
                                                                }
                                                            </label>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex justify-center space-x-3">
                                                    {editingId === po.id ? (
                                                        <button
                                                            onClick={() => handleSave(po.id)}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            <FontAwesomeIcon icon={faCheck} className="h-5 w-5" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEdit(po)}
                                                            className="text-gray-600 hover:text-gray-600"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                    
                                                    <button
                                                        onClick={() => handleDelete(po.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">No purchase order available.</td>
                                    </tr>
                                )}
                            </tbody>
                            )}
                        </table>
                        
                        {/* Add Purchase Order Button - Only show when not loading */}
                        {!loading && !attachingFile && (
                            <div className="mt-4 flex justify-center">
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="text-blue-600 flex items-center"
                                >
                                    + Add Purchase Order
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}