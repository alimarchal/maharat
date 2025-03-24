import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEdit,
    faTrash,
    faFilePdf,
} from "@fortawesome/free-solid-svg-icons";
import { Link, router } from "@inertiajs/react";
import axios from "axios";

const MaharatInvoicesTable = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [progress, setProgress] = useState(0);

    const [selectedFilter, setSelectedFilter] = useState("All");
    const filters = ["All", "Draft", "Pending", "Paid", "Overdue", "Cancelled"];

    const fetchInvoices = async () => {
        setLoading(true);
        setProgress(0);
        let progressInterval;
        
        try {
            progressInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            let url = `/api/v1/mahrat-invoice-approval-trans?page=${currentPage}`;
            url += "&include=invoice,requester,createdByUser";
            
            if (selectedFilter !== "All") {
                url += `&filter[invoice.status]=${selectedFilter}`;
            }

            const response = await axios.get(url);
            
            if (response.data && response.data.data) {
                const mappedData = response.data.data.map(transaction => ({
                    ...transaction,
                    invoice_number: transaction.invoice?.invoice_number,
                    total_amount: Math.floor(transaction.invoice?.total_amount || 0),
                    customer_name: transaction.requester?.name,
                    created_by_name: transaction.created_by_user?.name,
                    invoice_status: transaction.invoice?.status,
                    approval_status: transaction.status
                }));

                setInvoices(mappedData);
                setLastPage(response.data.meta.last_page);
                setError("");
            }
            
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setError("Failed to load invoices");
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } finally {
            if (progressInterval) clearInterval(progressInterval);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [currentPage, selectedFilter]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            await axios.delete(`/api/v1/mahrat-invoice-approval-trans/${id}`);
            fetchInvoices(); // Refresh the data
        } catch (error) {
            console.error('Error deleting record:', error);
            setError('Failed to delete record: ' + (error.response?.data?.message || error.message));
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Approve':
                return 'bg-green-100 text-green-800';
            case 'Reject':
                return 'bg-red-100 text-red-800';
            case 'Refer':
                return 'bg-purple-100 text-purple-800';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) {
            return 'N/A';
        }

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

    return (
        <div className="w-full">
            <div className="flex justify-between items-center text-center mb-6">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    Maharat Invoices
                </h2>

                <div className="flex justify-between items-center gap-4">
                    <div className="p-1 space-x-1 border border-[#B9BBBD] bg-white rounded-full">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                className={`px-4 py-1 rounded-full text-base transition ${
                                    selectedFilter === filter
                                        ? "bg-[#009FDC] text-white"
                                        : "text-[#9B9DA2]"
                                }`}
                                onClick={() => setSelectedFilter(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                    <Link
                        href={`/customers`}
                        className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                    >
                        Add Customers
                    </Link>
                    <Link
                        href={`/maharat-invoices/create`}
                        className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                    >
                        Create new Invoice
                    </Link>
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

            {/* Table section */}
            <div className="w-full overflow-hidden">
                {!loading && error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {!loading && (
                    <table className="w-full">
                        <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center">Invoice ID</th>
                                <th className="py-3 px-4 text-center">Customer</th>
                                <th className="py-3 px-4 text-center">Created By</th>
                                <th className="py-3 px-4 text-center">Total Amount</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-center">Date & Time</th>
                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-gray-200">
                            {invoices.length > 0 ? (
                                invoices.map((invoice) => (
                                    <tr key={invoice.id}>
                                        <td className="py-3 px-4 text-center">{invoice.invoice_number || 'N/A'}</td>
                                        <td className="py-3 px-4 text-center">{invoice.customer_name || 'N/A'}</td>
                                        <td className="py-3 px-4 text-center">{invoice.created_by_name || 'N/A'}</td>
                                        <td className="py-3 px-4 text-center">
                                            {invoice.total_amount ? `${Math.floor(invoice.total_amount).toLocaleString()} SAR` : 'N/A'}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${getStatusClass(invoice.approval_status)}`}>
                                                {invoice.approval_status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">{formatDateTime(invoice.updated_at)}</td>
                                        <td className="py-3 px-4 flex justify-center space-x-3">
                                            <Link
                                                href={`/maharat-invoices/${invoice.id}/edit`}
                                                className="text-gray-600 hover:text-gray-800"
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </Link>
                                            <button className="text-blue-600 hover:text-blue-900">
                                                <FontAwesomeIcon icon={faFilePdf} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(invoice.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center text-[#2C323C] font-medium py-4">
                                        No Maharat Invoices found.
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
        </div>
    );
};

export default MaharatInvoicesTable;