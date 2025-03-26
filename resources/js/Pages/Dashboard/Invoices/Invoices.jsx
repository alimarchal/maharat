import React, { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faEdit, faTrash, faCheck, faChevronRight, faEye, faPlus } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const Invoices = ({ auth }) => {
    const [invoices, setInvoices] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [suppliers, setSuppliers] = useState([]);
    const [users, setUsers] = useState([]);

    const defaultItem = {
        name: 'Default Item',
        description: null,
        quantity: 1,
        unit_price: 0,
        tax_rate: 0,
        identification: null
    };

    const fetchInvoices = async () => {
        setLoading(true);
        setProgress(0);
        let progressInterval;
        
        try {
            progressInterval = setInterval(() => {
                setProgress((prev) => prev >= 90 ? 90 : prev + 10);
            }, 200);

            const response = await axios.get(`/api/v1/external-invoices?page=${currentPage}&include=supplier,user`);
            
            if (response.data && response.data.data) {
                setInvoices(response.data.data);
                setLastPage(response.data.meta.last_page);
                setError("");
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
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

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/v1/users');
            setUsers(response.data.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchInvoices();
        fetchSuppliers();
        fetchUsers();
    }, [currentPage]);

    const handleEdit = (invoice) => {
        setEditingId(invoice.id);
        setEditData(invoice);
    };

    const handleSave = async (id) => {
        try {
            const isNewInvoice = id.toString().includes('new-');
            const amount = Number(editData.amount || 0);
            
            let payload = {
                supplier_id: Number(editData.supplier_id),
                user_id: Number(editData.user_id),
                amount: amount,
                vat_amount: amount * 0.15,
                type: 'Cash',
                payable_date: editData.payable_date || new Date().toISOString().split('T')[0],
                status: isNewInvoice ? 'Draft' : editData.status,
                invoice_id: isNewInvoice ? 'EXT-INV-' : editData.invoice_id
            };

            if (!payload.supplier_id || !payload.user_id) {
                setError('Supplier and Customer are required');
                return;
            }

            let response;
            if (isNewInvoice) {
                response = await axios.post('/api/v1/external-invoices', payload);
            } else {
                response = await axios.put(`/api/v1/external-invoices/${id}`, payload);
            }

            if (response.data) {
                setEditingId(null);
                setError('');
                await fetchInvoices();
            }
        } catch (error) {
            console.error('Save error:', error);
            setError('Failed to save changes: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            // Check if it's a new record (not yet saved to the server)
            if (id.toString().includes('new-')) {
                setInvoices(prevInvoices => prevInvoices.filter(invoice => invoice.id !== id));
                return;
            }
            
            await axios.delete(`/api/v1/external-invoices/${id}`);
            fetchInvoices(); // Refresh data
        } catch (error) {
            console.error('Error deleting record:', error);
            setError('Failed to delete record: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleChange = (field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const formatDateTime = (dateString) => {
        if (!dateString) {
            return 'N/A';
        }

        try {
            const optionsDate = { year: "numeric", month: "long", day: "numeric" };
            const optionsTime = { hour: "2-digit", minute: "2-digit", hour12: true };
        
            const dateObj = new Date(dateString);
            
            // Check if date is valid
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

    const addInvoice = () => {
        const now = new Date();
        const newInvoice = {
            id: `new-${Date.now()}`,
            invoice_id: "Auto-generated",
            supplier_id: "",
            user_id: "",
            amount: 0,
            vat_amount: 0,
            type: 'Cash',
            payable_date: now.toISOString().split('T')[0],
            status: 'Draft',
            updated_at: now.toISOString()
        };
        
        setInvoices([...invoices, newInvoice]);
        setEditingId(newInvoice.id);
        setEditData(newInvoice);
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Invalid Date';
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
                    <Link href="/dashboard" className="hover:text-[#009FDC] text-xl">Home</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <Link href="/purchase" className="hover:text-[#009FDC] text-xl">Procurement Center</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <span className="text-[#009FDC] text-xl">Invoices</span>
                </div>

                {/* Invoices Heading */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-[32px] font-bold text-[#2C323C] whitespace-nowrap">Invoices</h2>
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
                                    <th className="py-3 px-4 text-center">Supplier</th>
                                    <th className="py-3 px-4 text-center">Customer</th>
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
                                                {editingId === invoice.id ? (
                                                    <select
                                                        value={editData.supplier_id || ''}
                                                        onChange={(e) => handleChange('supplier_id', e.target.value)}
                                                        className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-center"
                                                    >
                                                        <option value="">Select Supplier</option>
                                                        {suppliers.map((supplier) => (
                                                            <option key={supplier.id} value={supplier.id}>
                                                                {supplier.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    invoice.supplier?.name || 'N/A'
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {editingId === invoice.id ? (
                                                    <select
                                                        value={editData.user_id || ''}
                                                        onChange={(e) => handleChange('user_id', e.target.value)}
                                                        className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-center"
                                                    >
                                                        <option value="">Select Customer</option>
                                                        {users.map((user) => (
                                                            <option key={user.id} value={user.id}>
                                                                {user.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    invoice.user?.name || 'N/A'
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {editingId === invoice.id ? (
                                                    <input
                                                        type="number"
                                                        value={editData.amount || ''}
                                                        onChange={(e) => handleChange('amount', Math.max(0, Number(e.target.value)))}
                                                        className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-center"
                                                        min="0"
                                                    />
                                                ) : (
                                                    `${invoice.amount || 0} SAR`
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${getStatusClass(invoice.status)}`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {editingId === invoice.id ? (
                                                    <input
                                                        type="date"
                                                        value={editData.payable_date || ''}
                                                        onChange={(e) => handleChange('payable_date', e.target.value)}
                                                        className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-center"
                                                    />
                                                ) : (
                                                    formatDate(invoice.payable_date)
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {formatDateTime(invoice.updated_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex justify-center space-x-3">
                                                    {editingId === invoice.id ? (
                                                        <button
                                                            onClick={() => handleSave(invoice.id)}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            <FontAwesomeIcon icon={faCheck} className="h-5 w-5" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEdit(invoice)}
                                                            className="text-gray-600 hover:text-gray-600"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} className="h-5 w-5" />
                                                        </button>
                                                    )}
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
                                        <td colSpan="7" className="px-6 py-4 text-center">
                                            No invoices found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* Add Invoice Button - At the end of the table before pagination */}
                    {!loading && (
                        <div className="mt-4 flex justify-center mb-4">
                            <button
                                onClick={addInvoice}
                                className="text-blue-600 flex items-center"
                            >
                                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                Add Invoice
                            </button>
                        </div>
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
            </div>
        </AuthenticatedLayout>
    );
};

export default Invoices;