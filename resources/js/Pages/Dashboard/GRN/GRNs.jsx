import React, { useState, useEffect } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { Link, router, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faEdit, faTrash, faCheck, faChevronRight, faEye, faPlus } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const FileDisplay = ({ file }) => {
    if (!file) return null;

    const fileUrl = file.file_path; 

    return (
        <div className="flex flex-col items-center justify-center space-y-2">
            <DocumentArrowDownIcon 
                className="h-10 w-10 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => fileUrl && window.open(fileUrl, '_blank')}
            />
            
            {file.original_name && (
                <span 
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-center break-words whitespace-normal w-full"
                    onClick={() => fileUrl && window.open(fileUrl, '_blank')}
                >
                    {file.original_name}
                </span>
            )}
        </div>
    );
};

export default function GRN({ auth }) {
    const [grns, setGrns] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [categories, setCategories] = useState([]);

    const fetchGrns = async () => {
        setLoading(true);
        setProgress(0);

        try {
            const response = await axios.get(`/api/v1/grns?page=${currentPage}`);
            setGrns(response.data.data);
            setLastPage(response.data.meta.last_page);
            setError("");
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } catch (error) {
            console.error('API Error:', error);
            setError("Failed to load GRNs");
            setGrns([]);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/v1/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    useEffect(() => {
        fetchGrns();
        fetchCategories();
    }, [currentPage]);

    const handleSave = async (id) => {
        try {
            const updatedData = {
                ...editData,
                delivery_date: formatDateForInput(editData.delivery_date)
            };

            const response = await axios.put(`/api/v1/grns/${id}`, updatedData);

            if (response.data.success) {
                setGrns(prevGrns =>
                    prevGrns.map(g => (g.id === id ? { ...g, ...updatedData } : g))
                );
                setEditingId(null);
            } else {
                console.error('Update failed:', response.data);
                setError('Failed to save changes');
            }
        } catch (error) {
            console.error('Save error:', error.response ? error.response.data : error.message);
            setError('Failed to save changes');
        }
    };

    const handleEdit = (grn) => {
        setEditingId(grn.id);
        setEditData(grn);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            if (id.toString().length > 10) {
                setGrns(prevGrns => prevGrns.filter(g => g.id !== id));
            } else {
                await axios.delete(`/api/v1/grns/${id}`);
                fetchGrns();
            }
        } catch (error) {
            console.error('Delete error:', error);
            setError('Failed to delete record');
        }
    };

    const addItem = () => {
        const newGrn = {
            id: Date.now(),
            grn_number: '',
            quotation_id: '',
            purchase_order_id: '',
            category_id: '',
            quantity: '',
            delivery_date: '',
        };
        setGrns([...grns, newGrn]);
        setEditingId(newGrn.id);
        setEditData(newGrn);
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleSaveAll = async () => {
        try {
            await axios.post('/api/v1/grns/save-all', grns);
            fetchGrns();
        } catch (error) {
            console.error('Save all error:', error);
            setError('Failed to save all changes');
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <div className="min-h-screen p-6">
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
                    <Link href="/warehouse" className="hover:text-[#009FDC] text-xl">Warehouse</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <span className="text-[#009FDC] text-xl">GRNs</span>
                </div>
                <Head title="GRNs" />

                <div className="w-full overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[32px] font-bold text-[#2C323C]">Good Receiving Notes</h2>
                        <Link
                            href="/receive-goods"
                            className="bg-[#009FDC] text-white px-7 py-3 rounded-full text-xl font-medium"
                        >
                            Receive Goods
                        </Link>
                    </div>

                    <div className="w-full overflow-hidden">
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        
                        <table className="w-full">
                            <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center">GRN#</th>
                                    <th className="py-3 px-4 text-center">Quotation#</th>
                                    <th className="py-3 px-4 text-center">PO#</th>
                                    <th className="py-3 px-4 text-center">Category</th>
                                    <th className="py-3 px-4 text-center">Quantity</th>
                                    <th className="py-3 px-4 text-center">Delivery Date</th>
                                    <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">Actions</th>
                                </tr>
                            </thead>

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

                            {!loading && (
                            <tbody className="bg-transparent divide-y divide-gray-200">
                                {grns.length > 0 ? (
                                    grns.map((grn, index) => (
                                        <tr key={grn.id}>
                                            <td className="px-6 py-4 text-center">
                                                {editingId === grn.id ? (
                                                    <input
                                                        type="text"
                                                        value={editData.grn_number || ''}
                                                        onChange={(e) => setEditData({ ...editData, grn_number: e.target.value })}
                                                        className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center"
                                                    />
                                                ) : (
                                                    grn.grn_number
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {editingId === grn.id ? (
                                                    <input
                                                        type="text"
                                                        value={editData.quotation_id || ''}
                                                        onChange={(e) => setEditData({ ...editData, quotation_id: e.target.value })}
                                                        className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center"
                                                    />
                                                ) : (
                                                    grn.quotation_id
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {editingId === grn.id ? (
                                                    <input
                                                        type="text"
                                                        value={editData.purchase_order_id || ''}
                                                        onChange={(e) => setEditData({ ...editData, purchase_order_id: e.target.value })}
                                                        className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center"
                                                    />
                                                ) : (
                                                    grn.purchase_order_id
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {editingId === grn.id ? (
                                                    <select
                                                        value={editData.category_id || ''}
                                                        onChange={(e) => setEditData({ ...editData, category_id: e.target.value })}
                                                        className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center"
                                                    >
                                                        <option value="">Select Category</option>
                                                        {categories.map(category => (
                                                            <option key={category.id} value={category.id}>{category.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    categories.find(cat => cat.id === grn.category_id)?.name || 'N/A'
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {editingId === grn.id ? (
                                                    <input
                                                        type="number"
                                                        value={editData.quantity || ''}
                                                        onChange={(e) => setEditData({ ...editData, quantity: e.target.value })}
                                                        className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center [&::-webkit-inner-spin-button]:hidden"
                                                        style={{ textAlign: '-webkit-center' }}
                                                    />
                                                ) : (
                                                    grn.quantity
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {editingId === grn.id ? (
                                                    <input
                                                        type="date"
                                                        value={editData.delivery_date ? formatDateForInput(editData.delivery_date) : ""}
                                                        onChange={(e) => setEditData({ ...editData, delivery_date: e.target.value })}
                                                        className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center"
                                                    />
                                                ) : (
                                                    formatDateForDisplay(grn.delivery_date)
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center space-x-3">
                                                    {editingId === grn.id ? (
                                                        <button
                                                            onClick={() => handleSave(grn.id)}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            <FontAwesomeIcon icon={faCheck} className="h-5 w-5" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEdit(grn)}
                                                            className="text-gray-600 hover:text-gray-600"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(grn.id)}
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
                                        <td colSpan="7" className="text-center">No GRNs available.</td>
                                    </tr>
                                )}
                            </tbody>
                            )}
                        </table>

                        {!loading && !error && (
                        <div className="flex justify-center items-center relative w-full my-8">
                            <div
                            className="absolute top-1/2 left-0 w-[45%] h-[3px] max-sm:w-[35%] flex-grow"
                            style={{
                                background: "linear-gradient(to right, #9B9DA2, #9B9DA200)",
                            }}
                            ></div>
                            <button
                            type="button"
                            className="p-2 text-base sm:text-lg flex items-center bg-white rounded-full border border-[#B9BBBD] text-[#9B9DA2] transition-all duration-300 hover:border-[#009FDC] hover:bg-[#009FDC] hover:text-white hover:scale-105"
                            onClick={addItem}
                            >
                            <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add a GRN
                            </button>
                            <div
                            className="absolute top-1/2 right-0 w-[45%] h-[3px] max-sm:w-[35%] flex-grow"
                            style={{
                                background: "linear-gradient(to left, #9B9DA2, #9B9DA200)",
                            }}
                            ></div>
                        </div>
                        )}


                        {!loading && !error && grns.length > 0 && (
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

                        {!loading && !error && (
                        <div className="flex justify-end mt-4">
                            <button
                            onClick={handleSaveAll}
                            className="bg-[#009FDC] text-white px-6 py-2 rounded-full text-xl font-medium"
                            >
                            Save
                            </button>
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}