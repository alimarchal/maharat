import React, { useState, useEffect } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { Link, router, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faEdit, faTrash, faCheck, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';

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

export default function QuotationRFQ({ auth }) {
    const { props } = usePage();
    const urlParams = new URLSearchParams(window.location.search);
    const rfqId = urlParams.get('rfq_id');

    const [quotations, setQuotations] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [attachments, setAttachments] = useState({});
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [companies, setCompanies] = useState([]);

    const fetchQuotations = async () => {
        setLoading(true);
        setProgress(0);
    
        try {
            const response = await axios.get(`/api/v1/quotations?page=${currentPage}&rfq_id=${rfqId}`);
    
            console.log("Fetched Quotations:", response.data.data); // Debugging line
            console.log("RFQ ID being filtered:", rfqId); // Debugging line
    
            const updatedQuotations = response.data.data
                .filter(q => q.rfq_id == rfqId) // Ensure strict filtering
                .map(quotation => ({
                    ...quotation,
                    documents: quotation.documents || []
                }));
    
            setQuotations(updatedQuotations);
            setLastPage(response.data.meta.last_page);
            setError("");
    
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } catch (error) {
            console.error('API Error:', error);
            setError("Failed to load quotations");
            setQuotations([]);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        }
    }

    const fetchCompanies = async () => {
        try {
            const response = await axios.get('/api/v1/companies');
            setCompanies(response.data.data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    useEffect(() => {
        fetchQuotations();
        fetchCompanies();
    }, [currentPage, rfqId]);

    const handleFileChange = async (index, e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('quotation_id', quotations[index].id);

        try {
            const response = await axios.post('/api/v1/quotations/upload-terms', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            const updatedQuotations = [...quotations];
            updatedQuotations[index].terms_and_conditions = response.data.file_path;
            setQuotations(updatedQuotations);
        } catch (error) {
            console.error('Upload error:', error);
            setError("Failed to upload file");
        }
    };

    const handleSave = async (id) => {
        try {
            let companyId = null;
            if (editData.company_name) {
                // Find the company ID by name from the companies list
                const company = companies.find(c => c.name === editData.company_name);
                companyId = company ? company.id : null;
            }
    
            const updatedData = {
                ...editData,
                company_id: companyId, // Include the company_id
                issue_date: formatDateForInput(editData.issue_date),
                valid_until: formatDateForInput(editData.valid_until),
                rfq_id: rfqId // Include the RFQ ID in the form data
            };
    
            const response = await axios.put(`/api/v1/quotations/${id}`, updatedData);
    
            if (response.data.success) {
                setQuotations(prevQuotations =>
                    prevQuotations.map(q => (q.id === id ? { ...q, ...updatedData } : q))
                );
                setEditingId(null);
                fetchQuotations(); // Reload data
            } else {
                console.error('Update failed:', response.data);
                setError('Failed to save changes');
            }
        } catch (error) {
            console.error('Save error:', error.response ? error.response.data : error.message);
            setError('Failed to save changes');
        }
    };

    const handleEdit = (quotation) => {
        setEditingId(quotation.id);
        setEditData(quotation);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            if (id.toString().length > 10) {
                setQuotations(prevQuotations => prevQuotations.filter(q => q.id !== id));
            } else {
                await axios.delete(`/api/v1/quotations/${id}`);
                fetchQuotations();
            }
        } catch (error) {
            console.error('Delete error:', error);
            setError('Failed to delete record');
        }
    };

    const addItem = () => {
        const newQuotation = {
            id: Date.now(),
            quotation_number: 'QUO-2025-', 
            company_name: '',
            original_name: '',
            file_path: '',
            issue_date: '',
            valid_until: '',
            total_amount: '',
            terms_and_conditions: '',
        };
        setQuotations([...quotations, newQuotation]);
        setEditingId(newQuotation.id);
        setEditData(newQuotation);
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

    const handleFileUpload = async (quotationId, file) => {
        if (!file) {
            setError("No file selected.");
            return;
        }
    
        const formData = new FormData();
        formData.append('document', file);
        formData.append('quotation_id', quotationId);
        formData.append('type', 'quotation');
    
        try {
            const quotation = quotations.find(q => q.id === quotationId);
            const existingDocument = quotation?.documents?.length > 0 ? quotation.documents[0] : null;
    
            let response;
            if (existingDocument) {
                response = await axios.post(`/api/v1/quotation-documents/${existingDocument.id}?_method=PUT`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                response = await axios.post('/api/v1/quotation-documents', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }
    
            console.log("File upload response:", response.data);
            fetchQuotations();
        } catch (error) {
            console.error("Upload Error:", error.response?.data || error.message);
            setError("Failed to upload document: " + (error.response?.data?.message || error.message));
        }
    };

    const toggleEditMode = (quotationId) => {
        setEditingId(editingId === quotationId ? null : quotationId);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <div className="min-h-screen p-6">
                {/* Back Button and Breadcrumbs */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => router.visit("/new-quotation")}
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
                    <Link href="/quotation" className="hover:text-[#009FDC] text-xl">Quotations</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <Link href="/new-quotation" className="hover:text-[#009FDC] text-xl"> Add Quotations</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <span className="text-[#009FDC] text-xl"> Add Quotation to RFQ </span>
                </div>
                <Head title="Add Quotation to RFQ" />

                <div className="w-full overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[32px] font-bold text-[#2C323C]">Add Quotation to RFQ</h2>
                    </div>

                    <p className="text-purple-600 text-2xl mb-6">RFQ# {rfqId}</p>

                    <div className="w-full overflow-hidden">
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        
                        <table className="w-full">
                            <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center">Quotation#</th>
                                    <th className="py-3 px-4 text-center">Company</th>
                                    <th className="py-3 px-4 text-center">Issue Date</th>
                                    <th className="py-3 px-4 text-center">Expiry Date</th>
                                    <th className="py-3 px-4 text-center">Amount</th>
                                    <th className="py-3 px-4 text-center">Attachment</th>
                                    <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">Actions</th>
                                </tr>
                            </thead>

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

                            {!loading && (
                            <tbody className="bg-transparent divide-y divide-gray-200 px-6 py-4 text-center">
                            {quotations.length > 0 ? (
                                quotations.map((quotation) => (
                                    <tr key={quotation.id}>
                                        {/* Quotation Number */}
                                        <td className="px-4 py-4 text-center break-words whitespace-normal min-w-[120px] max-w-[150px]">
                                            {editingId === quotation.id ? (
                                                <input
                                                    type="text"
                                                    value={editData.quotation_number || ''}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, quotation_number: e.target.value })
                                                    }
                                                    className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center break-words"
                                                    style={{ wordWrap: "break-word", overflowWrap: "break-word" }}
                                                />
                                            ) : (
                                                <span className="inline-block break-words w-full">
                                                    {quotation.quotation_number}
                                                </span>
                                            )}
                                        </td>
                        
                                        {/* Company Name Dropdown */}
                                        <td className="px-4 py-4 text-center break-words whitespace-normal min-w-[150px] max-w-[170px]">
                                            {editingId === quotation.id ? (
                                                <select
                                                    value={editData.company_name || ''}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, company_name: e.target.value })
                                                    }
                                                    className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center"
                                                    style={{ width: "100%" }}
                                                >
                                                    {companies.map((company) => (
                                                        <option key={company.id} value={company.name}>
                                                            {company.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="inline-block break-words w-full">
                                                    {quotation.company_name}
                                                </span>
                                            )}
                                        </td>
                        
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {editingId === quotation.id ? (
                                                    <input
                                                        type="date"
                                                        value={editData.issue_date ? formatDateForInput(editData.issue_date) : ""}
                                                        onChange={(e) => setEditData({ ...editData, issue_date: e.target.value })}
                                                        className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center"
                                                    />
                                                ) : (
                                                    formatDateForDisplay(quotation.issue_date)
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {editingId === quotation.id ? (
                                                    <input
                                                        type="date"
                                                        value={editData.valid_until ? formatDateForInput(editData.valid_until) : ""}
                                                        onChange={(e) => setEditData({ ...editData, valid_until: e.target.value })}
                                                        className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center"
                                                    />
                                                ) : (
                                                    formatDateForDisplay(quotation.valid_until)
                                                )}
                                            </td>

                                            <td className="px-6 py-4 whitespace-normal break-words text-center min-w-[120px]">
                                            {editingId === quotation.id ? (
                                                <div className="flex items-center justify-center space-x-2">
                                                    {/* Decrement Button */}
                                                    <button
                                                        onClick={() =>
                                                            setEditData((prev) => ({
                                                                ...prev,
                                                                total_amount: Math.max(0, parseInt(prev.total_amount || 0) - 1),
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
                                                        value={parseInt(editData.total_amount || 0)}
                                                        onChange={(e) => {
                                                            const value = Math.max(0, Math.floor(e.target.value)); // Ensure whole number & no negatives
                                                            setEditData({ ...editData, total_amount: value });
                                                        }}
                                                        className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-[70px] text-center [&::-webkit-inner-spin-button]:hidden"
                                                    />

                                                    {/* Increment Button */}
                                                    <button
                                                        onClick={() =>
                                                            setEditData((prev) => ({
                                                                ...prev,
                                                                total_amount: parseInt(prev.total_amount || 0) + 1,
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
                                                <span className="break-words min-w-[100px] inline-block">{parseInt(quotation.total_amount || 0).toLocaleString()}</span>
                                            )}
                                        </td>

                                            <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center justify-center w-full">
                                                {quotation.documents && quotation.documents.length > 0 ? (
                                                    quotation.documents.map((doc) => (
                                                        <FileDisplay key={doc.id} file={doc} />
                                                    ))
                                                ) : (
                                                    <span className="text-gray-500">No document attached</span>
                                                )}

                                                {editingId === quotation.id && (
                                                    <>
                                                        <input
                                                            type="file"
                                                            onChange={(e) => handleFileUpload(quotation.id, e.target.files[0])}
                                                            className="hidden"
                                                            id={`file-input-${quotation.id}`}
                                                            accept=".pdf,.doc,.docx"
                                                        />
                                                        <label 
                                                            htmlFor={`file-input-${quotation.id}`}
                                                            className="mt-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer break-words whitespace-normal text-center"
                                                        >
                                                            {(quotation.documents && Array.isArray(quotation.documents) && quotation.documents.length > 0) ? 'Replace file' : 'Attach file'}
                                                        </label>

                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex justify-center space-x-3">
                                                    {editingId === quotation.id ? (
                                                        <button
                                                            onClick={() => handleSave(quotation.id)}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            <FontAwesomeIcon icon={faCheck} className="h-5 w-5" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEdit(quotation)}
                                                            className="text-gray-600 hover:text-gray-600"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(quotation.id)}
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
                                        <td colSpan="4" className="text-center">No quotations available for this RFQ.</td>
                                    </tr>
                                )}
                            </tbody>
                            )}
                        </table>

                        {/* Add Quotation Button - Only show on last page and if we're at the last record */}
                        {!loading && currentPage === lastPage && quotations.length > 0 && 
                         quotations[quotations.length - 1] === quotations.slice(-1)[0] && (
                            <div className="mt-4 flex justify-center">
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="text-blue-600 flex items-center"
                                >
                                    + Add Quotation
                                </button>
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && !error && quotations.length > 0 && (
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
            </div>
        </AuthenticatedLayout>
    );
}