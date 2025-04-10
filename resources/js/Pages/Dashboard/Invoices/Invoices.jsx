import React, { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faEdit, faTrash, faCheck, faChevronRight, faEye, faPlus } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InvoiceModal from "./InvoiceModal";

const Invoices = ({ auth }) => {
    const [invoices, setInvoices] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [suppliers, setSuppliers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isEdit, setIsEdit] = useState(false);

    const fetchInvoices = async () => {
        setLoading(true);
        setProgress(0);
        let progressInterval;
        
        try {
            progressInterval = setInterval(() => {
                setProgress((prev) => prev >= 90 ? 90 : prev + 10);
            }, 200);
            
            console.log('Fetching external invoices...');
            const response = await axios.get(`/api/v1/external-invoices?page=${currentPage}&include=supplier,purchaseOrder`);
            console.log('External invoices API response:', response.data);
            
            if (response.data && response.data.data) {
                console.log('Setting invoices data:', response.data.data);
                setInvoices(response.data.data);
                setLastPage(response.data.meta.last_page);
                setError("");
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
            console.error('Error response:', error.response?.data);
            setError("Failed to load invoices");
        } finally {
            if (progressInterval) clearInterval(progressInterval);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get('/api/v1/suppliers');
            setSuppliers(response.data.data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    useEffect(() => {
        fetchInvoices();
        fetchSuppliers();
    }, [currentPage]);

    const handleAddInvoice = () => {
        setIsEdit(false);
        setSelectedInvoice(null);
        setIsModalOpen(true);
    };

    const handleEditInvoice = (invoice) => {
        setIsEdit(true);
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
    };

    const handleSaveInvoice = async (formData) => {
        try {
            const amount = Number(formData.amount || 0);
            // Use the user-provided VAT amount or calculate it as 15% of the amount
            const vatAmount = formData.vat_amount ? Number(formData.vat_amount) : (amount * 0.15);
            const now = new Date();
            
            const payload = {
                user_id: auth.user.id,
                supplier_id: Number(formData.supplier_id),
                purchase_order_id: Number(formData.purchase_order_id) || null,
                amount: amount,
                vat_amount: vatAmount,
                type: formData.type || 'Cash', // Use the selected payment type
                payable_date: formData.payable_date || now.toISOString().split('T')[0],
                status: formData.status || 'Draft', // Use the selected status or default to Draft
                invoice_id: isEdit ? selectedInvoice.invoice_id : `EXT-INV-${now.getTime()}`,
                created_at: isEdit ? selectedInvoice.created_at : now.toISOString(),
                updated_at: now.toISOString()
            };

            console.log('Saving invoice with payload:', payload);

            if (!payload.supplier_id) {
                throw new Error('Supplier is required');
            }

            if (!isEdit && !payload.purchase_order_id) {
                throw new Error('Purchase Order is required');
            }

            if (!payload.type) {
                throw new Error('Payment Type is required');
            }

            let response;
            if (isEdit && selectedInvoice) {
                response = await axios.put(`/api/v1/external-invoices/${selectedInvoice.id}`, payload);
            } else {
                response = await axios.post('/api/v1/external-invoices', payload);
            }
            
            if (response.data) {
                console.log('Invoice saved successfully:', response.data);
                setError('');
                await fetchInvoices();
            }
        } catch (error) {
            console.error('Error saving invoice:', error);
            setError('Failed to save invoice: ' + (error.response?.data?.message || error.message));
            throw error;
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            await axios.delete(`/api/v1/external-invoices/${id}`);
            fetchInvoices();
        } catch (error) {
            console.error('Error deleting record:', error);
            setError('Failed to delete record: ' + (error.response?.data?.message || error.message));
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const optionsDate = { year: "numeric", month: "long", day: "numeric" };
            const optionsTime = { hour: "2-digit", minute: "2-digit", hour12: true };
            const dateObj = new Date(dateString);
            
            if (isNaN(dateObj.getTime())) {
                console.error('Invalid date:', dateString);
                return 'Invalid Date';
            }

            const formattedDate = dateObj.toLocaleDateString("en-US", optionsDate);
            const formattedTime = dateObj.toLocaleTimeString("en-US", optionsTime);
            
            return (
                <div>
                    {formattedDate}
                    <br />
                    <span className="text-gray-500">at {formattedTime}</span>
                </div>
            );
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Date Error';
        }
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'unpaid': 
                return 'bg-red-100 text-red-800';
            case 'partially paid':
                return 'bg-purple-100 text-purple-800';
            case 'verified':
                return 'bg-yellow-100 text-yellow-800';
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
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
                    <span className="text-[#009FDC] text-xl">Invoices</span>
                </div>

                {/* Invoices Heading and Add Button */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-[32px] font-bold text-[#2C323C] whitespace-nowrap">Invoices</h2>
                    <button
                        onClick={handleAddInvoice}
                        className="flex items-center px-4 py-2 bg-[#009FDC] text-white rounded-full hover:bg-[#007BB5] transition duration-300"
                    >
                        Add Invoice
                    </button>
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

                {/* Invoices Table */}
                <div className="w-full overflow-hidden">
                    {!loading && error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    
                    {!loading && (
                        <table className="w-full">
                            <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center">Invoice ID</th>
                                    <th className="py-3 px-4 text-center">Purchase Order ID</th>
                                    <th className="py-3 px-4 text-center">Supplier</th>
                                    <th className="py-3 px-4 text-center">Amount</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-center">Payable Date</th>
                                    <th className="py-3 px-4 text-center">Date & Time</th>
                                    <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="bg-transparent divide-y divide-gray-200">
                                {invoices.length > 0 ? (
                                    invoices.map((invoice) => (
                                        <tr key={invoice.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {invoice.invoice_id || 'Auto-generated'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {invoice.purchase_order?.purchase_order_no || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {invoice.supplier?.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {`${invoice.amount || 0} SAR`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${getStatusClass(invoice.status)}`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {new Date(invoice.payable_date).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {formatDateTime(invoice.updated_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex justify-center space-x-3">
                                                    <button
                                                        onClick={() => handleEditInvoice(invoice)}
                                                        className="text-gray-600 hover:text-gray-800"
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(invoice.id)}
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
                                        <td colSpan="8" className="px-6 py-4 text-center">
                                            No invoices found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination */}
                    {!loading && !error && invoices.length > 0 && (
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

                {/* Invoice Modal */}
                <InvoiceModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveInvoice}
                    invoice={selectedInvoice}
                    isEdit={isEdit}
                />
            </div>
        </AuthenticatedLayout>
    );
};

export default Invoices;