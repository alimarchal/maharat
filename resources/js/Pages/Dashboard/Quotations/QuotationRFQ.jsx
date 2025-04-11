import React, { useState, useEffect } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { Link, router, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faEdit, faTrash, faCheck, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';
import QuotationModal from './QuotationModal';

const FileDisplay = ({ file, pendingFile }) => {
    // Helper function to fix file paths and extensions
    const fixFilePath = (filePath) => {
        if (!filePath) return null;
        
        // Log the original path to debug
        console.log('Original file path:', filePath);
        
        // Fix duplicate extensions
        let fixedPath = filePath;
        if (fixedPath.endsWith('.pdf.pdf')) {
            fixedPath = fixedPath.replace('.pdf.pdf', '.pdf');
        }
        
        // For paths that have /storage/ but don't have /public/
        if (fixedPath.includes('/storage/') && !fixedPath.includes('/storage/public/')) {
            // Insert 'public/' after storage/
            fixedPath = fixedPath.replace('/storage/', '/storage/public/');
        }
        
        // If URL already contains http, just return it with the public path fix
        if (fixedPath.startsWith('http')) {
            console.log('Fixed URL path:', fixedPath);
            return fixedPath;
        }
        
        // Otherwise, construct the full URL
        fixedPath = `/storage/public/${fixedPath}`.replace('/storage/public/public/', '/storage/public/');
        console.log('Constructed URL path:', fixedPath);
        return fixedPath;
    };
    
    // Try direct download via API
    const downloadFile = async (filePath) => {
        try {
            // Extract file ID from path
            const filePathSegments = filePath.split('/');
            const fileName = filePathSegments[filePathSegments.length - 1];
            
            // Log the attempt
            console.log('Attempting direct download for:', fileName);
            
            // First try direct URL
            window.open(filePath, '_blank');
            
            // As a fallback, try to get a download URL from the server
            try {
                const response = await axios.get(`/api/v1/download-file?path=${encodeURIComponent(fileName)}&type=quotation`);
                if (response.data && response.data.download_url) {
                    window.open(response.data.download_url, '_blank');
                }
            } catch (error) {
                console.error('Error getting download URL:', error);
                // Still try the direct URL as last resort
                window.open(filePath, '_blank');
            }
        } catch (error) {
            console.error('Download failed:', error);
            alert('Could not download file. Please contact support.');
        }
    };
    
    // If there's a pending file to be uploaded, show it as a preview with an indicator
    if (pendingFile) {
        // For local file preview, create a temporary URL
        const tempUrl = URL.createObjectURL(pendingFile);
        
        return (
            <div className="flex flex-col items-center justify-center space-y-2">
                <DocumentArrowDownIcon 
                    className="h-10 w-10 text-orange-500 cursor-pointer hover:text-orange-700 transition-colors"
                    onClick={() => window.open(tempUrl, '_blank')}
                />
                <span className="text-sm text-orange-600 text-center break-words whitespace-normal w-full">
                    {pendingFile.name} (Pending save)
                </span>
            </div>
        );
    }

    if (!file) return (
        <span className="text-gray-500">No document attached</span>
    );

    // Get the fixed file URL
    const fileUrl = file.file_path ? fixFilePath(file.file_path) : null;
    
    // Fix display name if needed
    let displayName = file.original_name || 'Document';
    if (displayName.endsWith('.pdf.pdf')) {
        displayName = displayName.replace('.pdf.pdf', '.pdf');
    }
    
    console.log('Prepared document URL:', fileUrl);

    return (
        <div className="flex flex-col items-center justify-center space-y-2">
            <DocumentArrowDownIcon 
                className="h-10 w-10 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => fileUrl && downloadFile(fileUrl)}
            />
            
            {displayName && (
                <span 
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-center break-words whitespace-normal w-full"
                    onClick={() => fileUrl && downloadFile(fileUrl)}
                >
                    {displayName}
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
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [companiesMap, setCompaniesMap] = useState({}); // Map company IDs to names
    const [suppliersMap, setSuppliersMap] = useState({}); // Map supplier IDs to names
    const [rfqNumber, setRfqNumber] = useState("");
    const [attachingFile, setAttachingFile] = useState(false);
    const [tempDocuments, setTempDocuments] = useState({});
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const fetchQuotations = async () => {
        setLoading(true);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress((oldProgress) => (oldProgress >= 90 ? 90 : oldProgress + 10));
        }, 300);
    
        try {
            // Add a cache-busting parameter to ensure fresh data
            const timestamp = new Date().getTime();
            const response = await axios.get(`/api/v1/quotations?page=${currentPage}&rfq_id=${rfqId}&t=${timestamp}`);
            
            console.log("API Response:", response.data); // Debug log
            
            // Safely get the quotations data with fallback to empty array
            const quotationsData = response.data.data || [];
            
            // Filter and map the quotations
            const updatedQuotations = quotationsData
                .filter(q => q.rfq_id == rfqId)
                .map(quotation => {
                    let companyName = '';
                    if (quotation.rfq && quotation.rfq.company_id && companiesMap[quotation.rfq.company_id]) {
                        companyName = companiesMap[quotation.rfq.company_id];
                    } else if (quotation.rfq && quotation.rfq.company) {
                        companyName = quotation.rfq.company.name;
                    } else if (quotation.company_name) {
                        companyName = quotation.company_name;
                    }

                    let supplierName = '';
                    if (quotation.supplier_id && suppliersMap[quotation.supplier_id]) {
                        supplierName = suppliersMap[quotation.supplier_id];
                    } else if (quotation.supplier) {
                        supplierName = quotation.supplier.name;
                    }

                    return {
                        ...quotation,
                        company_name: companyName,
                        supplier_name: supplierName,
                        documents: quotation.documents || []
                    };
                });
    
            setQuotations(updatedQuotations);
            
            // Safely set the last page with fallback
            const meta = response.data.meta || {};
            const calculatedLastPage = Math.max(1, Math.ceil(updatedQuotations.length / 10));
            setLastPage(meta.last_page || calculatedLastPage);
            
            setError("");
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
            
        } catch (error) {
            console.error('API Error:', error);
            setError("Failed to load quotations: " + (error.response?.data?.message || error.message));
            setQuotations([]);
            // Set lastPage to 1 when there's an error
            setLastPage(1);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } finally {
            clearInterval(interval);
        }
    };

    const fetchRfqNumber = async () => {
        if (!rfqId) return;
        try {
            const response = await axios.get(`/api/v1/rfqs/${rfqId}`);
            setRfqNumber(response.data.data.rfq_number); 
        } catch (error) {
            console.error("Error fetching RFQ number:", error);
            setRfqNumber("N/A"); 
        }
    };

    const fetchCompanies = async () => {
        try {
            const response = await axios.get('/api/v1/companies');
            
            // Create a map of company IDs to names for easier lookup
            const compMap = {};
            response.data.data.forEach(company => {
                compMap[company.id] = company.name;
            });
            setCompaniesMap(compMap);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get('/api/v1/suppliers');
            
            // Create a map of supplier IDs to names for easier lookup
            const suppMap = {};
            response.data.data.forEach(supplier => {
                suppMap[supplier.id] = supplier.name;
            });
            setSuppliersMap(suppMap);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    useEffect(() => {
        // If we have an rfqId, fetch the quotations and RFQ number
        if (rfqId) {
            // First fetch companies and suppliers to build our maps
            Promise.all([fetchCompanies(), fetchSuppliers()])
                .then(() => {
                    fetchQuotations();
                    fetchRfqNumber();
                });
        }
    }, [currentPage, rfqId]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            await axios.delete(`/api/v1/quotations/${id}`);
            fetchQuotations();
        } catch (error) {
            console.error('Delete error:', error);
            setError('Failed to delete record');
        }
    };

    const handleAddQuotation = () => {
        setSelectedQuotation(null);
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const handleEditQuotation = (quotation) => {
        setSelectedQuotation(quotation);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleSaveQuotation = () => {
        // Refresh the quotations after save
        fetchQuotations();
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedQuotation(null);
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

    return (
        <AuthenticatedLayout user={auth.user}>
            <div className="min-h-screen w-full bg-[#C4E4F0] bg-opacity-5 p-6">
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
                    <Link href="/dashboard" className="hover:text-[#009FDC] text-xl">Dashboard</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <Link href="/quotation" className="hover:text-[#009FDC] text-xl">Quotations</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <Link href="/new-quotation" className="hover:text-[#009FDC] text-xl"> Add Quotations</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <span className="text-[#009FDC] text-xl"> Add Quotation to RFQ </span>
                </div>
                <Head title="Add Quotation to RFQ" />
    
                <div className="w-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[32px] font-bold text-[#2C323C]">Add Quotation to RFQ</h2>
                        <button
                            onClick={handleAddQuotation}
                            className="bg-[#009FDC] text-white px-7 py-3 rounded-full text-xl font-medium flex items-center"
                        >
                            Add Quotation
                        </button>
                    </div>
    
                    <p className="text-purple-600 text-2xl mb-6">{rfqNumber}</p>

                    {/* Loading Bar */}
                    {(loading || attachingFile) && (
                        <div className="absolute left-[55%] transform -translate-x-1/2 mt-12 w-2/3">
                            <div className="relative w-full h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl font-bold text-white">
                                <div
                                    className="absolute left-0 top-0 h-12 bg-[#009FDC] rounded-full transition-all duration-500"
                                    style={{ width: attachingFile ? '50%' : `${progress}%` }}
                                ></div>
                                <span className="absolute text-white">
                                    {attachingFile ? "Attaching File..." : (progress < 60 ? "Please Wait, Processing..." : `${progress}%`)}
                                </span>
                            </div>
                        </div>
                    )}
    
                    <div className="w-full">
                        {!loading && error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        
                       
                        <table className="w-full">
                        {!loading && (
                            <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center w-[10%]">Quotation#</th>
                                <th className="py-3 px-4 text-center w-[18%]">Company</th>
                                <th className="py-3 px-4 text-center w-[18%]">Supplier</th>
                                <th className="py-3 px-4 text-center w-[8%]">Issue Date</th>
                                <th className="py-3 px-4 text-center w-[12%]">Expiry Date</th>
                                <th className="py-3 px-4 text-center w-[2%]">Amount</th>
                                <th className="py-3 px-4 text-center w-[12%]">Attachment</th>
                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center w-[8%]">Actions</th>
                            </tr>
                            </thead>
                        )}

                            {!loading && !attachingFile && (
                            <tbody className="bg-transparent divide-y divide-gray-200 px-6 py-4 text-center">
                            {quotations.length > 0 ? (
                                quotations.map((quotation) => (
                                    <tr key={quotation.id}>
                                        {/* Quotation Number */}
                                        <td className="px-4 py-4 text-center break-words whitespace-normal min-w-[120px] max-w-[150px]">
                                            <span className="inline-block break-words w-full text-[17px] text-black">
                                                {quotation.quotation_number}
                                            </span>
                                        </td>

                                        {/* Company Name */}
                                        <td className="px-4 py-4 text-center break-words whitespace-normal min-w-[150px] max-w-[170px]">
                                            <span className="inline-block break-words w-full text-[17px] text-black">
                                                {quotation.company_name || 'No company'}
                                            </span>
                                        </td>

                                        {/* Supplier Name */}
                                        <td className="px-4 py-4 text-center break-words whitespace-normal min-w-[150px] max-w-[170px]">
                                            <span className="inline-block break-words w-full text-[17px] text-black">
                                                {quotation.supplier_name || 'No supplier'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {formatDateForDisplay(quotation.issue_date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {formatDateForDisplay(quotation.valid_until)}
                                        </td>

                                        <td className="px-6 py-4 whitespace-normal break-words text-center min-w-[120px]">
                                            <span className="break-words min-w-[100px] inline-block">
                                                {parseInt(quotation.total_amount || 0).toLocaleString()}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center justify-center w-full">
                                                {quotation.documents && quotation.documents[0] ? (
                                                    <FileDisplay file={quotation.documents[0]} />
                                                ) : (
                                                    <span className="text-gray-500">No document attached</span>
                                                )}
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex justify-center space-x-3">
                                                <button
                                                    onClick={() => handleEditQuotation(quotation)}
                                                    className="text-gray-600 hover:text-gray-600"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} className="h-5 w-5" />
                                                </button>
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
                                    <td colSpan="8" className="text-center py-4">No quotations available for this RFQ.</td>
                                </tr>
                            )}
                            </tbody>
                            )}
                        </table>

                        {/* Pagination */}
                        {!loading && !error && quotations.length > 0 && lastPage > 1 && (
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
            
            {/* Quotation Modal */}
            <QuotationModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveQuotation}
                quotation={selectedQuotation}
                isEdit={isEditMode}
                rfqId={rfqId}
            />
            
        </AuthenticatedLayout>
    );
}