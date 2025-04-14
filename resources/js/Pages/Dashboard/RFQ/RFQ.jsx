import React, { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faTrash, faFilePdf, faChevronRight, faFileExcel, faPen, faEdit } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import RFQPDF from "./RFQPDF";

const RFQ = ({ auth }) => {
    const [rfqLogs, setRfqLogs] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0); // For loading bar
    
    // Add new state for PDF generation
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [selectedRfqId, setSelectedRfqId] = useState(null);

    const fetchRFQLogs = async () => {
        setLoading(true);
        setProgress(0); // Reset progress
        try {
            const response = await axios.get(`/api/v1/rfqs?page=${currentPage}&include=requester`);
            console.log("API Response:", response.data);
    
            if (response.data && response.data.data) {
                // Simulate progress for loading bar
                const interval = setInterval(() => {
                    setProgress((prev) => {
                        if (prev >= 100) {
                            clearInterval(interval);
                            return 100;
                        }
                        return prev + 10;
                    });
                }, 200);
    
                // Process the logs with requester data
                const logsWithRequesterNames = response.data.data.map(log => ({
                    ...log,
                    requester_name: log.requester?.name || "N/A"
                }));
    
                // Sort by created_at in ascending order
                logsWithRequesterNames.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
                setRfqLogs(logsWithRequesterNames);
                setLastPage(response.data.meta.last_page);
                setError("");
            } else {
                console.error("Invalid response format:", response.data);
                setError("Received invalid data format from API");
            }
    
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } catch (error) {
            console.error("API Error:", error);
            setError("Failed to load RFQ logs");
            setRfqLogs([]);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        }
    };    

    useEffect(() => {
        fetchRFQLogs();
    }, [currentPage]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
    
        try {
            const response = await axios.delete(`/api/v1/rfqs/${id}`);
    
            if (response.status === 200) {
                fetchRFQLogs(); 
            } else {
                console.error("Delete request failed:", response);
                setError("Failed to delete RFQ. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting record:", error.response?.data || error);
            setError("Failed to delete RFQ. Please try again.");
        }
    };        

    const handleEdit = (rfqId) => {
        if (rfqId) {
            console.log("Editing RFQ with ID:", rfqId);
            // Navigate to the quotation form with the RFQ ID
            router.visit(`/quotations/create?rfqId=${rfqId}`);
        } else {
            console.error("No ID found for RFQ log");
        }
    };

    // Add new function to handle PDF generation
    const handleGeneratePDF = (rfqId) => {
        setIsGeneratingPDF(true);
        setSelectedRfqId(rfqId);
    };
    
    // Add callback for when PDF generation is complete
    const handlePDFGenerated = (documentUrl) => {
        setIsGeneratingPDF(false);
        setSelectedRfqId(null);
        
        // Refresh the RFQ list to show updated document URLs
        fetchRFQLogs();
    };

    const formatDateTime = (dateString) => {
        const optionsDate = { year: "numeric", month: "long", day: "numeric" };
        const optionsTime = {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        };

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
                        <FontAwesomeIcon
                            icon={faArrowLeftLong}
                            className="mr-2 text-2xl"
                        />
                        Back
                    </button>
                </div>
                <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2 mb-6">
                    <Link
                        href="/dashboard"
                        className="hover:text-[#009FDC] text-xl"
                    >
                        Dashboard
                    </Link>
                    <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-xl text-[#9B9DA2]"
                    />
                    {/* <Link
                        href="/purchase"
                        className="hover:text-[#009FDC] text-xl"
                    >
                        Procurement Center
                    </Link>
                    <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-xl text-[#9B9DA2]"
                    /> */}
                    <span className="text-[#009FDC] text-xl">RFQs</span>
                </div>

                {/* RFQs Logs Heading and Make New RFQ Button */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-[32px] font-bold text-[#2C323C] whitespace-nowrap">
                        Request for Quotation Log
                    </h2>
                    <div className="flex justify-start gap-2">
                        <Link
                            href="/quotations/create"
                            className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                        >
                            Make New RFQ
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

                {/* PDF Generation Component (conditionally rendered) */}
                {isGeneratingPDF && selectedRfqId && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-lg">
                            <h3 className="text-xl font-semibold mb-4">Generating PDF</h3>
                            <div className="flex items-center">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                                <p>Please wait, generating PDF document...</p>
                            </div>
                            <RFQPDF rfqId={selectedRfqId} onGenerated={handlePDFGenerated} />
                        </div>
                    </div>
                )}

                {/* RFQs Table */}
                <div className="w-full overflow-hidden">
                    {!loading && error && (
                        <div
                            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                            role="alert"
                        >
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {!loading ? (
                        rfqLogs.length === 0 ? (
                            <div className="text-center py-4">No RFQ logs found</div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                                    <tr>
                                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center">
                                            RFQ#
                                        </th>
                                        <th className="py-3 px-4 text-center">Requested By</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                        <th className="py-3 px-4 text-center">Date & Time</th>
                                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-transparent divide-y divide-gray-200">
                                    {rfqLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">{log.rfq_number || "N/A"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">{log.requester_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {typeof log.status?.name === "object" ? (
                                                    <span className="text-red-500">Invalid Status</span> // Debugging UI
                                                ) : (
                                                    <span
                                                        className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${
                                                            log.status?.name === "Active"
                                                                ? "bg-green-100 text-green-800"
                                                                : log.status?.name === "Rejected"
                                                                ? "bg-red-100 text-red-800"
                                                                : log.status?.name === "Expired"
                                                                ? "bg-gray-100 text-gray-800"
                                                                : "bg-yellow-100 text-yellow-800"
                                                        }`}
                                                    >
                                                        {log.status?.name || "Pending"}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {formatDateTime(log.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex justify-center space-x-3 w-full">
                                                {/* Edit Icon */}
                                                <button
                                                    className="text-gray-600"
                                                    onClick={() => handleEdit(log.id)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} className="h-5 w-5" />
                                                </button>

                                                {/* PDF Icon - Updated to use our generate function */}
                                                <button
                                                    onClick={() => handleGeneratePDF(log.id)}
                                                    className={`text-blue-600 hover:text-blue-800`}
                                                    title="Generate or download PDF"
                                                >
                                                    <FontAwesomeIcon 
                                                        icon={faFilePdf} 
                                                        className={`h-5 w-5 ${log.quotation_document ? 'text-blue-800' : 'text-blue-600'}`} 
                                                    />
                                                </button>

                                                {/* Excel Icon */}
                                                <a
                                                    href={log.excel_attachment || "#"}
                                                    target={log.excel_attachment ? "_blank" : ""}
                                                    rel={log.excel_attachment ? "noopener noreferrer" : ""}
                                                    className={`text-green-600 ${!log.excel_attachment ? "opacity-50 cursor-not-allowed" : ""}`}
                                                    onClick={(e) => !log.excel_attachment && e.preventDefault()} // Prevent click if no file
                                                >
                                                    <FontAwesomeIcon icon={faFileExcel} className="h-5 w-5" />
                                                </a>

                                                {/* Delete Icon */}
                                                <button
                                                    onClick={() => handleDelete(log.id)}
                                                    className="text-red-600"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    ) : null}


                    {/* Pagination */}
                    {!loading && !error && rfqLogs.length > 0 && (
                        <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                className={`px-3 py-1 bg-[#009FDC] text-white rounded-full ${
                                    currentPage <= 1
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }`}
                                disabled={currentPage <= 1}
                            >
                                Previous
                            </button>
                            {Array.from(
                                { length: lastPage },
                                (_, index) => index + 1
                            ).map((page) => (
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
                                    currentPage >= lastPage
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
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