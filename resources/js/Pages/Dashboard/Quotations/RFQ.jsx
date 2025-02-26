import React, { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faEdit, faTrash, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { PencilIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import axios from "axios";

const RFQ = ({ auth }) => {
    const [rfqLogs, setRfqLogs] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    const fetchRFQLogs = async () => {
        try {
            const response = await axios.get(`/api/v1/rfq-status-logs?page=${currentPage}`);
            setRfqLogs(response.data.data);
            setLastPage(response.data.meta.last_page);
            setError("");
        } catch (error) {
            console.error('API Error:', error);
            setError("Failed to load RFQ logs");
            setRfqLogs([]);
        }
    };

    useEffect(() => {
        fetchRFQLogs();
    }, [currentPage]);

    const handleEdit = (log) => {
        setEditingId(log.id);
        setEditData(log);
    };

    const handleSave = async (id) => {
        try {
            const response = await axios.put(`/api/v1/rfq-status-logs/${id}`, editData);
            if (response.data) {
                setEditingId(null);
                fetchRFQLogs(); // Refresh the data
            }
        } catch (error) {
            console.error('Save error:', error);
            setError('Failed to save changes');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            await axios.delete(`/api/v1/rfq-status-logs/${id}`);
            fetchRFQLogs(); // Refresh data
        } catch (error) {
            console.error('Error deleting record:', error);
        }
    };

    const handleChange = (field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const formatDateTime = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'numeric', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        };
        return new Date(dateString).toLocaleString('en-US', options);
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
                    <Link href="/purchase" className="hover:text-[#009FDC] text-xl">Purchases</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <span className="text-[#009FDC] text-xl">RFQs</span>
                </div>

                {/* RFQs Logs Heading and Make New RFQ Button */}
                <div className="flex justify-between items-center mb-12">
                <h2 className="text-[32px] font-bold text-[#2C323C] whitespace-nowrap">RFQ Logs</h2>
                    <Link
                        href="/quotations/create"
                        className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                    >
                        Make New RFQ
                    </Link>
                </div>

                {/* RFQs Table */}
                <div className="w-full overflow-hidden">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    <table className="w-full">
                        <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">RFQ#</th>
                                <th className="py-3 px-4">Supplier</th>
                                <th className="py-3 px-4">Amount</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Date & Time</th>
                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-200">
                            {rfqLogs.map((log) => (
                                <tr key={log.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {log.rfq_id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingId === log.id ? (
                                            <input
                                                type="text"
                                                value={editData.supplier_name || ''}
                                                onChange={(e) => handleChange('supplier_name', e.target.value)}
                                                className="border rounded px-2 py-1 w-full"
                                            />
                                        ) : (
                                            log.supplier_name || 'N/A'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingId === log.id ? (
                                            <input
                                                type="number"
                                                value={editData.amount || ''}
                                                onChange={(e) => handleChange('amount', e.target.value)}
                                                className="border rounded px-2 py-1 w-full"
                                            />
                                        ) : (
                                            log.amount || 'N/A'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            log.status_name === 'Approved' ? 'bg-green-100 text-green-800' :
                                            log.status_name === 'Rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {log.status_name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatDateTime(log.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex space-x-3">
                                            {editingId === log.id ? (
                                                <button
                                                    onClick={() => handleSave(log.id)}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    <CheckIcon className="h-5 w-5" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleEdit(log)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(log.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {lastPage > 1 && (
                        <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                            {currentPage > 1 && (
                                <button
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="px-3 py-1 bg-white rounded-full hover:bg-gray-100 transition"
                                >
                                    Previous
                                </button>
                            )}
                            {currentPage < lastPage && (
                                <button
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="px-3 py-1 bg-white rounded-full hover:bg-gray-100 transition"
                                >
                                    Next
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default RFQ;