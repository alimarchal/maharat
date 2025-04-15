import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faEye, faArrowLeftLong } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { Link, router, usePage } from "@inertiajs/react";
import CreateReceivable from "./CreateReceivable";

const ViewReceivable = ({ id }) => {
    // Get invoice ID from props first, or try to get from route params as fallback
    const params = usePage().props.params || {};
    const invoiceId = id || params.id;
    const showEditModal = params.showEditModal || false;
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [invoiceData, setInvoiceData] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(showEditModal);
    
    useEffect(() => {
        // Update the edit modal state when params change
        setIsEditModalOpen(params.showEditModal || false);
    }, [params.showEditModal]);
    
    useEffect(() => {
        const fetchInvoiceDetails = async () => {
            if (!invoiceId) {
                setError("Invoice ID is missing");
                setLoading(false);
                return;
            }
            
            setLoading(true);
            
            try {
                // First get invoice details with client included
                const response = await axios.get(`/api/v1/invoices/${invoiceId}?include=client`);
                console.log("Invoice Response:", response.data);
                
                if (!response.data || !response.data.data) {
                    setError("Invalid invoice data");
                    setLoading(false);
                    return;
                }
                
                const invoice = response.data.data;
                console.log("Invoice document:", invoice.invoice_document);
                
                // Calculate balance
                const balance = (invoice.total_amount || 0) - (invoice.paid_amount || 0);
                
                // Set customer data variables
                let customerName = "N/A";
                let contactNumber = "N/A";
                
                // If client is included in the response
                if (invoice.client) {
                    customerName = invoice.client.name || "N/A";
                    contactNumber = invoice.client.contact_number || "N/A";
                } 
                // If we need to fetch client separately
                else if (invoice.client_id) {
                    try {
                        const customerResponse = await axios.get(`/api/v1/customers/${invoice.client_id}`);
                        if (customerResponse.data && customerResponse.data.data) {
                            const customerData = customerResponse.data.data;
                            customerName = customerData.name || "N/A";
                            contactNumber = customerData.contact_number || "N/A";
                        }
                    } catch (customerError) {
                        console.error("Error fetching customer:", customerError);
                    }
                }
                
                // Create formatted invoice with customer data
                let formattedInvoice = {
                    ...invoice,
                    invoice_no: invoice.invoice_number || `INV-${invoice.id.toString().padStart(5, "0")}`,
                    customer: customerName,
                    contact: contactNumber,
                    status: invoice.status || "Pending",
                    amount: invoice.total_amount || 0,
                    balance: balance
                };
                
                console.log("Final formatted invoice:", formattedInvoice);
                setInvoiceData(formattedInvoice);
                setError("");
            } catch (error) {
                console.error("Error fetching invoice details:", error);
                setError("Failed to load receivable details: " + (error.response?.data?.message || error.message));
            } finally {
                setLoading(false);
            }
        };
        
        fetchInvoiceDetails();
    }, [invoiceId]);
    
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
        if (amount === null || amount === undefined) return "N/A";
        
        return parseFloat(amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };
    
    // Handle view document - use the same approach as MaharatInvoicesTable.jsx
    const handleViewDocument = (documentUrl) => {
        if (!documentUrl) {
            console.log("No document URL provided");
            alert("No invoice document available");
            return;
        }
        
        console.log("Opening document:", documentUrl);
        
        // Construct full URL with proper base path
        const fullUrl = documentUrl.startsWith('http') 
            ? documentUrl 
            : `/${documentUrl.replace(/^\//g, '')}`; // Ensure we have a single leading slash
        
        console.log("Full document URL:", fullUrl);
        
        // Open the document URL in a new tab
        window.open(fullUrl, '_blank');
    };
    
    // Handle download document - same approach as MaharatInvoicesTable.jsx
    const handleDownloadDocument = (documentUrl, invoiceNumber) => {
        if (!documentUrl) {
            console.log("No document URL provided");
            alert("No invoice document available");
            return;
        }
        
        console.log("Downloading document:", documentUrl);
        
        // Construct full URL with proper base path
        const fullUrl = documentUrl.startsWith('http') 
            ? documentUrl 
            : `/${documentUrl.replace(/^\//g, '')}`; // Ensure we have a single leading slash
            
        console.log("Full document URL for download:", fullUrl);
        
        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = fullUrl;
        link.setAttribute('download', `Invoice_${invoiceNumber || 'document'}.pdf`);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEditModalClose = () => {
        setIsEditModalOpen(false);
    };

    const handleEditModalSave = async (data) => {
        console.log("Invoice updated with data:", data);
        setIsEditModalOpen(false);
        
        // Show loading indicator
        setLoading(true);
        
        // Use a short timeout to allow the server to process the update
        setTimeout(async () => {
            try {
                // Fetch the updated invoice with client included
                const response = await axios.get(`/api/v1/invoices/${invoiceId}?include=client`);
                console.log("Refreshed invoice data:", response.data);
                
                if (response.data && response.data.data) {
                    const invoice = response.data.data;
                    const balance = (invoice.total_amount || 0) - (invoice.paid_amount || 0);
                    
                    // If we have a client_id but client data is missing, fetch it separately
                    let customerName = "N/A";
                    let contactNumber = "N/A";
                    
                    if (invoice.client) {
                        // If client is included in the response
                        customerName = invoice.client.name || "N/A";
                        contactNumber = invoice.client.contact_number || "N/A";
                    } else if (invoice.client_id) {
                        // If we need to fetch client separately
                        try {
                            const clientResponse = await axios.get(`/api/v1/customers/${invoice.client_id}`);
                            if (clientResponse.data && clientResponse.data.data) {
                                const clientData = clientResponse.data.data;
                                customerName = clientData.name || "N/A";
                                contactNumber = clientData.contact_number || "N/A";
                            }
                        } catch (clientError) {
                            console.error("Error fetching client details:", clientError);
                        }
                    }
                    
                    // Create updated invoice with client data
                    let updatedInvoice = {
                        ...invoice,
                        invoice_no: invoice.invoice_number || `INV-${invoice.id.toString().padStart(5, "0")}`,
                        customer: customerName,
                        contact: contactNumber,
                        status: invoice.status || "Pending",
                        amount: invoice.total_amount || 0,
                        balance: balance
                    };
                    
                    console.log("Setting updated invoice data:", updatedInvoice);
                    setInvoiceData(updatedInvoice);
                    setError("");
                } else {
                    console.error("Invalid or empty response data:", response.data);
                    // If we can't get the updated data, reload the page
                    window.location.reload();
                }
            } catch (error) {
                console.error("Error refreshing invoice data:", error);
                console.error("Error details:", error.response?.data);
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
                    Account Receivables Details
                </h2>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
                <Link href="/account-receivables" className="text-[#009FDC] hover:underline flex items-center">
                    <FontAwesomeIcon icon={faArrowLeftLong} className="mr-2" />
                    Back to Account Receivables
                </Link>
            </div>
        );
    }
    
    if (!invoiceData) {
        return (
            <div className="w-full">
                <h2 className="text-2xl md:text-3xl font-bold text-[#2C323C] mb-6">
                    Account Receivables Details
                </h2>
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
                    {!invoiceId ? "Invoice ID is missing. Please access this page through the proper route." : "No data found for this receivable."}
                </div>
                <Link href="/account-receivables" className="text-[#009FDC] hover:underline flex items-center">
                    <FontAwesomeIcon icon={faArrowLeftLong} className="mr-2" />
                    Back to Account Receivables
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[#2C323C]">
                    Account Receivables Details
                </h2>
            </div>

            <div className="flex items-center gap-4 w-full">
                <p className="text-[#6E66AC] text-lg md:text-2xl">
                    {invoiceData.invoice_no}
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
                                Customer
                            </th>
                            <th className="py-3 px-4">Contact</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Issue Date</th>
                            <th className="py-3 px-4">Due Date</th>
                            <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                                View & Download Invoice
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-sm md:text-base font-medium divide-y divide-[#D7D8D9]">
                        <tr>
                            <td className="py-3 px-4">{invoiceData.customer}</td>
                            <td className="py-3 px-4">{invoiceData.contact}</td>
                            <td className="py-3 px-4">{invoiceData.status}</td>
                            <td className="py-3 px-4">
                                {formatDate(invoiceData.issue_date || invoiceData.created_at)}
                            </td>
                            <td className="py-3 px-4">
                                {formatDate(invoiceData.due_date)}
                            </td>
                            <td className="py-3 px-4 text-center flex justify-center gap-4">
                                <FontAwesomeIcon
                                    icon={faEye}
                                    className={`text-lg md:text-xl ${invoiceData.invoice_document ? 'text-[#009FDC] cursor-pointer hover:text-blue-700' : 'text-gray-400'}`}
                                    onClick={() => handleViewDocument(invoiceData.invoice_document)}
                                    title={invoiceData.invoice_document ? "View Invoice" : "No document available"}
                                />
                                <FontAwesomeIcon
                                    icon={faDownload}
                                    className={`text-lg md:text-xl ${invoiceData.invoice_document ? 'text-[#009FDC] cursor-pointer hover:text-blue-700' : 'text-gray-400'}`}
                                    onClick={() => handleDownloadDocument(invoiceData.invoice_document, invoiceData.invoice_no)}
                                    title={invoiceData.invoice_document ? "Download Invoice" : "No document available"}
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
                            <td className="py-3 px-4">{invoiceData.payment_method || ""}</td>
                            <td className="py-3 px-4">{formatCurrency(invoiceData.amount)} SAR</td>
                            <td className="py-3 px-4">{formatCurrency(invoiceData.paid_amount)} SAR</td>
                            <td className="py-3 px-4">{formatCurrency(invoiceData.balance)} SAR</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="my-8 flex flex-col md:flex-row items-center md:justify-end gap-4">
                <button 
                    onClick={() => setIsEditModalOpen(true)} 
                    className="px-8 py-3 text-lg md:text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full md:w-auto text-center"
                >
                    Update
                </button>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && invoiceData && (
                <CreateReceivable
                    isOpen={isEditModalOpen}
                    onClose={handleEditModalClose}
                    onSave={handleEditModalSave}
                    invoice={invoiceData}
                    isEdit={true}
                />
            )}
        </div>
    );
};

export default ViewReceivable;
