import React, { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faEdit, faTrash, faCheck, faChevronRight, faEye } from "@fortawesome/free-solid-svg-icons";
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
        const optionsDate = { year: "numeric", month: "long", day: "numeric" };
        const optionsTime = { hour: "2-digit", minute: "2-digit", hour12: true };
    
        const dateObj = new Date(dateString);
        const formattedDate = dateObj.toLocaleDateString("en-US", optionsDate);
        const formattedTime = dateObj.toLocaleTimeString("en-US", optionsTime);
    
        return (
            <div>
                {formattedDate}
                <br />
                <span className="text-gray-500">at {formattedTime}</span>
            </div>
        );
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
                    <Link href="/purchase" className="hover:text-[#009FDC] text-xl">Report & Statuses</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <span className="text-[#009FDC] text-xl">Statuses</span>
                </div>

                <div className="flex justify-between items-center mb-6">
                <h2 className="text-[32px] font-bold text-[#2C323C] whitespace-nowrap">Purchase Docs Statuses</h2>
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
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center">Doc ID</th>
                                <th className="py-3 px-4 text-center">Type</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-center">Date & Time</th>
                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="bg-transparent divide-y divide-gray-200">
                            {rfqLogs.map((log) => (
                                <tr key={log.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {log.rfq_id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {editingId === log.id ? (
                                            <input
                                                type="text"
                                                value={editData.supplier_name || ''}
                                                onChange={(e) => handleChange('supplier_name', e.target.value)}
                                                className="bg-transparent border-none focus:outline-none focus:ring-0 w-20 text-center text-base"
                                            />
                                        ) : (
                                            log.supplier_name || 'N/A'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${
                                            log.status_name === 'Active' ? 'bg-green-100 text-green-800' :
                                            log.status_name === 'Rejected' ? 'bg-red-100 text-red-800' :
                                            log.status_name === 'Expired' ? 'bg-gray-100 text-gray-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {log.status_name}
                                        </span>
                                    </td>

                                    {/* Format Date & Time */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {formatDateTime(log.created_at)}
                                    </td>

                                    {/* Centered Buttons */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex justify-center space-x-3">
                                            <button
                                                onClick={() => router.visit("/dummy-page")} 
                                                className="text-gray-600 hover:text-gray-600"
                                            >
                                                <FontAwesomeIcon icon={faEye} className="h-5 w-5" />
                                            </button>
                                            {editingId === log.id ? (
                                                <button
                                                    onClick={() => handleSave(log.id)}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    <FontAwesomeIcon icon={faCheck} className="h-5 w-5" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleEdit(log)}
                                                    className="text-gray-600 hover:text-gray-600"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} className="h-5 w-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(log.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {!error && rfqLogs.length > 0 && (
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

export default RFQ;