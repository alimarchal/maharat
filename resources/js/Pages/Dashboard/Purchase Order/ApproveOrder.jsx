import React, { useState, useEffect } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { Link, router, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faEdit, faTrash, faCheck, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const FileDisplay = ({ file, onFileClick }) => {
    const fileName = file ? (
        typeof file === 'object' && file.name 
            ? file.name 
            : typeof file === 'string' 
                ? decodeURIComponent(file.split('/').pop()) 
                : file.name
    ) : null;

    const fileUrl = file ? (
        typeof file === 'object' && file.url 
            ? `/api/download/${fileName}` 
            : typeof file === 'string' 
                ? `/api/download/${fileName}` 
                : null
    ) : null;

    return (
        <div className="flex flex-col items-center justify-center space-y-2">
            <DocumentArrowDownIcon 
                className="h-6 w-6 text-gray-400 cursor-pointer" 
                onClick={() => fileUrl && window.open(fileUrl, '_blank')}
            />
            {fileName && (
                <span 
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-center break-words whitespace-normal w-full"
                    onClick={() => fileUrl && window.open(fileUrl, '_blank')}
                >
                    {fileName}
                </span>
            )}
        </div>
    );
};

export default function QuotationRFQ({ auth }) {
    const [quotations, setQuotations] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [attachments, setAttachments] = useState({});
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    // Get rfqId from URL
    const rfqId = window.location.pathname.split('/').pop();

    const fetchQuotations = async () => {
        setLoading(true);
        setProgress(0);
    
        // Smoothly increase progress
        const interval = setInterval(() => {
            setProgress((oldProgress) => (oldProgress >= 90 ? 90 : oldProgress + 10));
        }, 300);
    
        try {
            const response = await axios.get(`/api/v1/quotations?page=${currentPage}&rfq_id=${rfqId}`);
            console.log('API Response:', response.data); // Debug log
            setQuotations(response.data.data);
            setLastPage(response.data.meta.last_page);
            setError("");
    
            // Ensure full progress bar before hiding
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } catch (error) {
            console.error('API Error:', error);
            setError("Failed to load quotations");
            setQuotations([]);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } finally {
            clearInterval(interval);
        }
    };

    useEffect(() => {
        fetchQuotations();
    }, [currentPage]);

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

    const handleSave = async () => {
        try {
            await axios.post('/api/v1/quotations/update-batch', {
                quotations: quotations
            });
            alert('Changes saved successfully!');
        } catch (error) {
            console.error('Save error:', error);
            alert(error.response?.data?.message || 'Failed to save changes');
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
                             <Link href="/purchase" className="hover:text-[#009FDC] text-xl">Purchases</Link>
                             <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                             <Link href="/view-order" className="hover:text-[#009FDC] text-xl">Purchase Order</Link>
                             <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                             <span className="text-[#009FDC] text-xl"> Approve Purchase Order </span>
                         </div>
            <Head title="Approve Purchase Order" />

            <div className="w-full overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-[32px] font-bold text-[#2C323C]">Approve Purchase Order</h2>
                </div>

                <p className="text-purple-600 mb-6">RFQ #{rfqId}</p>

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
                                            <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">Attachment</th>
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
                                    <tbody className="bg-transparent divide-y divide-gray-200">
                                        {quotations.map((quotation, index) => (
                                            <tr key={quotation.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {quotation.quotation_number}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {quotation.company_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {quotation.issue_date ? new Date(quotation.issue_date).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    }) : ''}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    }) : ''}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {quotation.total_amount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex flex-col items-center justify-center w-full">
                                                        {quotation.terms_and_conditions && (
                                                            <a 
                                                                href={`/storage/${quotation.terms_and_conditions}`}
                                                                target="_blank"
                                                                className="text-blue-600 hover:text-blue-800"
                                                            >
                                                                View File
                                                            </a>
                                                        )}
                                                        <input
                                                            type="file"
                                                            onChange={(e) => handleFileChange(index, e)}
                                                            className="hidden"
                                                            id={`file-input-${index}`}
                                                            accept=".pdf,.doc,.docx"
                                                        />
                                                        <label 
                                                            htmlFor={`file-input-${index}`}
                                                            className="mt-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
                                                        >
                                                            {quotation.terms_and_conditions ? 'Replace file' : 'Attach file'}
                                                        </label>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    )}
                                </table>

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
                                        {Array.from({ length: Math.ceil(quotations.length / 10) }, (_, index) => index + 1).map((page) => (
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
                                                currentPage >= Math.ceil(quotations.length / 10) ? "opacity-50 cursor-not-allowed" : ""
                                            }`}
                                            disabled={currentPage >= Math.ceil(quotations.length / 10)}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}

                                {!loading && (
                                <div className="mt-6 flex justify-end border-t pt-6">
                                    <button
                                        onClick={handleSave}
                                        className="bg-[#009FDC] text-white px-6 py-2 rounded-full text-xl font-medium"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
        </AuthenticatedLayout>
    );
}