import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faEye, faArrowLeftLong } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { Link, router, usePage } from "@inertiajs/react";
import CreatePayable from "./CreatePayable";

const ViewPayable = ({ id }) => {
    const params = usePage().props.params || {};
    const paymentOrderId = id || params.id;
    const showEditModal = params.showEditModal || false;
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [paymentOrderData, setPaymentOrderData] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(showEditModal);
    
    useEffect(() => {
        // Update the edit modal state when params change
        setIsEditModalOpen(params.showEditModal || false);
    }, [params.showEditModal]);
    
    useEffect(() => {
        const fetchPaymentOrderDetails = async () => {
            if (!paymentOrderId) {
                setError("Payment Order ID is missing");
                setLoading(false);
                return;
            }
            
            setLoading(true);
            
            try {
                // Try to use the raw-data endpoint first for complete data
                let paymentOrder;
                let response;
                
                try {
                    response = await axios.get(`/api/v1/payment-orders/${paymentOrderId}/raw-data`);
                    console.log("Raw data response:", response.data);
                    paymentOrder = response.data.data;
                } catch (rawDataError) {
                    console.log("Raw data API failed, falling back to standard API");
                    response = await axios.get(`/api/v1/payment-orders/${paymentOrderId}?include=user,purchaseOrder`);
                    paymentOrder = response.data.data;
                }
                
                if (!paymentOrder) {
                    setError("Invalid payment order data");
                    setLoading(false);
                    return;
                }
                
                console.log("Payment order data:", paymentOrder);
                console.log("Available fields:", Object.keys(paymentOrder));
                
                // Calculate balance
                const totalAmount = paymentOrder.total_amount || 0;
                const paidAmount = paymentOrder.paid_amount || 0;
                const balance = totalAmount - paidAmount;
                
                // Set supplier data variables
                let supplierName = "N/A";
                let contactNumber = "N/A";
                
                // If user is included in the response
                if (paymentOrder.user) {
                    supplierName = paymentOrder.user.name || "N/A";
                    contactNumber = paymentOrder.user.mobile || "N/A";
                } 
                // If we need to fetch user separately
                else if (paymentOrder.user_id) {
                    try {
                        const supplierResponse = await axios.get(`/api/v1/users/${paymentOrder.user_id}`);
                        if (supplierResponse.data && supplierResponse.data.data) {
                            const supplierData = supplierResponse.data.data;
                            supplierName = supplierData.name || "N/A";
                            contactNumber = supplierData.mobile || "N/A";
                        }
                    } catch (supplierError) {
                        console.error("Error fetching supplier:", supplierError);
                    }
                }
                
                // Format the status from snake_case to title case
                let formattedStatus = "Pending";
                let originalStatus = "";
                
                if (paymentOrder.status) {
                    originalStatus = paymentOrder.status;
                    // Check if it's draft status - convert to lowercase first
                    const statusLower = String(paymentOrder.status).toLowerCase().trim();
                    
                    if (statusLower === "draft") {
                        formattedStatus = "Draft";
                    } else {
                        // Handle other statuses
                        formattedStatus = paymentOrder.status
                            .replace(/_/g, " ") // Replace all underscores with spaces
                            .replace(/\b\w/g, (l) => l.toUpperCase());
                    }
                }
                
                // Get payment terms/method with fallbacks
                const paymentTerms = paymentOrder.payment_type || 
                                     paymentOrder.payment_terms || 
                                     paymentOrder.payment_method || 
                                     "N/A";
                
                // Prepare dates
                const issueDate = paymentOrder.issue_date || paymentOrder.date || paymentOrder.created_at;
                const dueDate = paymentOrder.due_date || null;
                
                // Create formatted payment order with supplier data
                let formattedPaymentOrder = {
                    ...paymentOrder,
                    payment_order_no: paymentOrder.payment_order_number || `PO-${paymentOrder.id.toString().padStart(5, "0")}`,
                    supplier: supplierName,
                    contact: contactNumber,
                    status: formattedStatus,
                    originalStatus: originalStatus,
                    amount: totalAmount,
                    paid_amount: paidAmount,
                    balance: balance,
                    payment_method: paymentTerms,
                    issue_date: issueDate,
                    due_date: dueDate
                };
                
                console.log("Formatted payment order:", formattedPaymentOrder);
                setPaymentOrderData(formattedPaymentOrder);
                setError("");
            } catch (error) {
                console.error("API error:", error);
                setError("Failed to load payable details: " + (error.response?.data?.message || error.message));
            } finally {
                setLoading(false);
            }
        };
        
        fetchPaymentOrderDetails();
    }, [paymentOrderId]);
    
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            
            return date.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (error) {
            console.error("Date formatting error:", error);
            return dateString;
        }
    };
    
    const formatCurrency = (amount) => {
        // Handle null, undefined, or NaN values
        if (amount === null || amount === undefined || isNaN(parseFloat(amount))) {
            return "0.00";
        }
        
        // Convert to number if it's a string
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        
        return numAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };
    
    // Handle view document
    const handleViewDocument = (documentUrl) => {
        if (!documentUrl) {
            alert("No payment order document available");
            return;
        }
        
        // Construct full URL with proper base path
        const fullUrl = documentUrl.startsWith('http') 
            ? documentUrl 
            : documentUrl.startsWith('/uploads/') 
                ? documentUrl 
                : `/uploads/${documentUrl}`;
            
        console.log("Opening document URL:", fullUrl);
        window.open(fullUrl, '_blank');
    };
    
    // Handle download document
    const handleDownloadDocument = (documentUrl, orderNumber) => {
        if (!documentUrl) {
            alert("No payment order document available");
            return;
        }
        
        // Construct full URL with proper base path
        const fullUrl = documentUrl.startsWith('http') 
            ? documentUrl 
            : documentUrl.startsWith('/uploads/') 
                ? documentUrl 
                : `/uploads/${documentUrl}`;
            
        console.log("Downloading document URL:", fullUrl);
        
        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = fullUrl;
        link.setAttribute('download', `PaymentOrder_${orderNumber || 'document'}.pdf`);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEditModalClose = () => {
        setIsEditModalOpen(false);
    };

    const handleEditModalSave = async (data) => {
        setIsEditModalOpen(false);
        
        // Show loading indicator
        setLoading(true);
        
        // Use a short timeout to allow the server to process the update
        setTimeout(async () => {
            try {
                // Try to fetch the updated data using raw-data endpoint first
                let paymentOrder;
                let response;
                
                try {
                    response = await axios.get(`/api/v1/payment-orders/${paymentOrderId}/raw-data`);
                    paymentOrder = response.data.data;
                } catch (rawDataError) {
                    // Fall back to standard API
                    response = await axios.get(`/api/v1/payment-orders/${paymentOrderId}?include=user,purchaseOrder`);
                    paymentOrder = response.data.data;
                }
                
                if (paymentOrder) {
                    // Calculate balance from updated data
                    const totalAmount = paymentOrder.total_amount || 0;
                    const paidAmount = paymentOrder.paid_amount || 0;
                    const balance = totalAmount - paidAmount;
                    
                    // Format the status from snake_case to title case
                    let formattedStatus = "Pending";
                    let originalStatus = "";
                    
                    if (paymentOrder.status) {
                        originalStatus = paymentOrder.status;
                        // Check if it's draft status - convert to lowercase first
                        const statusLower = String(paymentOrder.status).toLowerCase().trim();
                        
                        if (statusLower === "draft") {
                            formattedStatus = "Draft";
                        } else {
                            // Handle other statuses
                            formattedStatus = paymentOrder.status
                                .replace(/_/g, " ") // Replace all underscores with spaces
                                .replace(/\b\w/g, (l) => l.toUpperCase());
                        }
                    }
                    
                    // Get payment terms/method with fallbacks
                    const paymentTerms = paymentOrder.payment_type || 
                                         paymentOrder.payment_terms || 
                                         paymentOrder.payment_method || 
                                         "N/A";
                    
                    // Prepare dates
                    const issueDate = paymentOrder.issue_date || paymentOrder.date || paymentOrder.created_at;
                    const dueDate = paymentOrder.due_date || null;
                    
                    // If we have a user_id but user data is missing, fetch it separately
                    let supplierName = "N/A";
                    let contactNumber = "N/A";
                    
                    if (paymentOrder.user) {
                        // If user is included in the response
                        supplierName = paymentOrder.user.name || "N/A";
                        contactNumber = paymentOrder.user.mobile || "N/A";
                    } else if (paymentOrder.user_id) {
                        // If we need to fetch user separately
                        try {
                            const userResponse = await axios.get(`/api/v1/users/${paymentOrder.user_id}`);
                            if (userResponse.data && userResponse.data.data) {
                                const userData = userResponse.data.data;
                                supplierName = userData.name || "N/A";
                                contactNumber = userData.mobile || "N/A";
                            }
                        } catch (userError) {
                            console.error("Error fetching user details:", userError);
                        }
                    }
                    
                    // Create updated payment order with supplier data
                    let updatedPaymentOrder = {
                        ...paymentOrder,
                        payment_order_no: paymentOrder.payment_order_number || `PO-${paymentOrder.id.toString().padStart(5, "0")}`,
                        supplier: supplierName,
                        contact: contactNumber,
                        status: formattedStatus,
                        originalStatus: originalStatus,
                        amount: totalAmount,
                        paid_amount: paidAmount,
                        balance: balance,
                        payment_method: paymentTerms,
                        issue_date: issueDate,
                        due_date: dueDate
                    };
                    
                    console.log("Updated payment order after edit:", updatedPaymentOrder);
                    setPaymentOrderData(updatedPaymentOrder);
                    setError("");
                } else {
                    // If we can't get the updated data, reload the page
                    window.location.reload();
                }
            } catch (error) {
                console.error("Error updating after edit:", error);
                // If we encounter an error, reload the page to get fresh data
                window.location.reload();
            } finally {
                setLoading(false);
            }
        }, 1000); // Wait 1 second before fetching updated data
    };
    
    if (loading) {
        return (
            <div className="w-full flex items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (error) {
    return (
        <div className="w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-[#2C323C] mb-6">
                Account Payables Details
            </h2>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
                <Link href="/account-payables" className="text-[#009FDC] hover:underline flex items-center">
                    <FontAwesomeIcon icon={faArrowLeftLong} className="mr-2" />
                    Back to Account Payables
                </Link>
            </div>
        );
    }
    
    if (!paymentOrderData) {
        return (
            <div className="w-full">
                <h2 className="text-2xl md:text-3xl font-bold text-[#2C323C] mb-6">
                    Account Payables Details
                </h2>
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
                    {!paymentOrderId ? "Payment Order ID is missing. Please access this page through the proper route." : "No data found for this payable."}
                </div>
                <Link href="/account-payables" className="text-[#009FDC] hover:underline flex items-center">
                    <FontAwesomeIcon icon={faArrowLeftLong} className="mr-2" />
                    Back to Account Payables
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[#2C323C]">
                    Account Payables Details
                </h2>
            </div>

            <div className="flex items-center gap-4 w-full">
                <p className="text-[#6E66AC] text-lg md:text-2xl">
                    {paymentOrderData.payment_order_no}
                </p>
                <div
                    className="h-[3px] flex-grow"
                    style={{
                        background:
                            "linear-gradient(to right, #9B9DA200, #9B9DA2)",
                    }}
                ></div>
            </div>

            <div className="mt-6 mb-12 overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-base md:text-lg font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                Supplier
                            </th>
                            <th className="py-3 px-4">Contact</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Issue Date</th>
                            <th className="py-3 px-4">Due Date</th>
                            <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                                View & Download Document
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-sm md:text-base font-medium divide-y divide-[#D7D8D9]">
                        <tr>
                            <td className="py-3 px-4">{paymentOrderData.supplier}</td>
                            <td className="py-3 px-4">{paymentOrderData.contact}</td>
                                <td className="py-3 px-4">
                                <div className="font-medium">{paymentOrderData.status}</div>
                                </td>
                                <td className="py-3 px-4">
                                {formatDate(paymentOrderData.issue_date || paymentOrderData.created_at)}
                                </td>
                                <td className="py-3 px-4">
                                {formatDate(paymentOrderData.due_date)}
                                </td>
                                <td className="py-3 px-4 text-center flex justify-center gap-4">
                                    <FontAwesomeIcon
                                        icon={faEye}
                                        className={`text-lg md:text-xl ${paymentOrderData.attachment ? 'text-[#009FDC] cursor-pointer hover:text-blue-700' : 'text-gray-400'}`}
                                        onClick={() => paymentOrderData.attachment ? handleViewDocument(paymentOrderData.attachment) : null}
                                        title={paymentOrderData.attachment ? "View Document" : "No document available"}
                                    />
                                    <FontAwesomeIcon
                                        icon={faDownload}
                                        className={`text-lg md:text-xl ${paymentOrderData.attachment ? 'text-[#009FDC] cursor-pointer hover:text-blue-700' : 'text-gray-400'}`}
                                        onClick={() => paymentOrderData.attachment ? handleDownloadDocument(paymentOrderData.attachment, paymentOrderData.payment_order_no) : null}
                                        title={paymentOrderData.attachment ? "Download Document" : "No document available"}
                                    />
                                </td>
                            </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-12 mb-16 overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-base md:text-lg font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                Payment Terms
                            </th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Paid</th>
                            <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                                Balance
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-sm md:text-base font-medium divide-y divide-[#D7D8D9]">
                        <tr>
                            <td className="py-3 px-4">{paymentOrderData.payment_method || ""}</td>
                            <td className="py-3 px-4">{formatCurrency(paymentOrderData.amount)} SAR</td>
                            <td className="py-3 px-4">
                                {formatCurrency(paymentOrderData.paid_amount)} SAR
                            </td>
                            <td className="py-3 px-4">{formatCurrency(paymentOrderData.balance)} SAR</td>
                            </tr>
                    </tbody>
                </table>
            </div>

            <div className="my-8 flex flex-col md:flex-row items-center md:justify-end gap-4">
                <button 
                    onClick={() => {
                        console.log("Opening edit modal with data:", paymentOrderData);
                        setIsEditModalOpen(true);
                    }} 
                    className="px-8 py-3 text-lg md:text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full md:w-auto text-center"
                >
                    Update
                </button>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && paymentOrderData && (
                <CreatePayable
                    isOpen={isEditModalOpen}
                    onClose={handleEditModalClose}
                    onSave={(data) => {
                        console.log("CreatePayable returned data after save:", data);
                        // Force a complete page reload to get fresh data from server
                        window.location.reload();
                    }}
                    paymentOrder={paymentOrderData}
                    isEdit={true}
                />
            )}
        </div>
    );
};

export default ViewPayable;
