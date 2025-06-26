import React, { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTrash,
    faFileExcel,
    faEdit,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import RFQPDF from "./RFQPDF";
import RFQExcel from "./RFQExcel";
//TODO: Uncomment when second phase has started for new feature
// import { useRfqRequests } from '@/Components/RfqRequestsContext';

const RFQsTable = () => {
    //TODO: Uncomment when second phase has started for new feature
    // const { pendingCount } = useRfqRequests();
    const [rfqLogs, setRfqLogs] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
    const [selectedRfqId, setSelectedRfqId] = useState(null);
    const [selectedExcelRfqId, setSelectedExcelRfqId] = useState(null);

    const fetchRFQLogs = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `/api/v1/rfqs?page=${currentPage}&include=requester`
            );
            if (response.data && response.data.data) {
                const logsWithRequesterNames = response.data.data.map(
                    (log) => ({
                        ...log,
                        requester_name: log.requester?.name || "N/A",
                    })
                );
                logsWithRequesterNames.sort(
                    (a, b) => new Date(a.created_at) - new Date(b.created_at)
                );

                setRfqLogs(logsWithRequesterNames);
                setLastPage(response.data.meta.last_page);
                setError("");
            } else {
                setError("Received invalid data format from API");
            }
        } catch (error) {
            setError("Failed to load RFQ logs");
            setRfqLogs([]);
        } finally {
            setLoading(false);
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
                setError("Failed to delete RFQ. Please try again.");
            }
        } catch (error) {
            setError("Failed to delete RFQ. Please try again.");
        }
    };

    const handleEdit = (rfqId) => {
        if (rfqId) {
            router.visit(`/rfqs/${rfqId}/edit`);
        } else {
            console.error("No ID found for RFQ log");
        }
    };

    // Add new function to handle PDF generation
    const handleGeneratePDF = (rfqId) => {
        setIsGeneratingPDF(true);
        setSelectedRfqId(rfqId);
    };

    // Add new function to handle Excel generation
    const handleGenerateExcel = (rfqId, existingExcelUrl = null) => {
        // If there's already an Excel file, just download it
        if (existingExcelUrl) {
            window.open(`/storage/${existingExcelUrl}`, "_blank");
            return;
        }

        // Otherwise generate a new Excel file
        setIsGeneratingExcel(true);
        setSelectedExcelRfqId(rfqId);
    };

    const handlePDFGenerated = (documentUrl) => {
        setIsGeneratingPDF(false);
        setSelectedRfqId(null);
        fetchRFQLogs();
    };

    const handleExcelGenerated = (excelUrl) => {
        setIsGeneratingExcel(false);
        setSelectedExcelRfqId(null);
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
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-[32px] font-bold text-[#2C323C]">
                    Request for Quotation Log
                </h2>
                <div className="flex justify-start gap-2">
                    <Link
                        href="/rfqs/create-rfq"
                        className="relative bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                    >
                        Make New RFQ
                        {/*TODO: Uncomment when second phase has started for new feature
                        {pendingCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm h-6 w-6 rounded-full flex items-center justify-center">
                                {pendingCount}
                            </span>
                        )}
                        */}
                    </Link>
                </div>
            </div>

            {/* PDF Generation Component (conditionally rendered) */}
            {isGeneratingPDF && selectedRfqId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">
                            Generating PDF
                        </h3>
                        <div className="flex items-center">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                            <p>Please wait, generating PDF document...</p>
                        </div>
                        <RFQPDF
                            rfqId={selectedRfqId}
                            onGenerated={handlePDFGenerated}
                        />
                    </div>
                </div>
            )}

            {/* Excel Generation Component (conditionally rendered) */}
            {isGeneratingExcel && selectedExcelRfqId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">
                            Generating Excel
                        </h3>
                        <div className="flex items-center">
                            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                            <p>Please wait, generating Excel file...</p>
                        </div>
                        <RFQExcel
                            rfqId={selectedExcelRfqId}
                            onGenerated={handleExcelGenerated}
                        />
                    </div>
                </div>
            )}

            {/* RFQs Table */}
            <div className="w-full overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                RFQ #
                            </th>
                            <th className="py-3 px-4">Requested By</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Date & Time</th>
                            <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="text-center py-12">
                                    <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="text-center text-red-500 font-medium py-4"
                                >
                                    {error}
                                </td>
                            </tr>
                        ) : rfqLogs.length > 0 ? (
                            rfqLogs.map((log) => (
                                <tr key={log.id}>
                                    <td className="px-3 py-4">
                                        {log.rfq_number || "N/A"}
                                    </td>
                                    <td className="px-3 py-4">
                                        {log.requester_name}
                                    </td>
                                    <td className="px-3 py-4">
                                        {typeof log.status?.name ===
                                        "object" ? (
                                            <span className="text-red-500">
                                                Invalid Status
                                            </span>
                                        ) : (
                                            <span
                                                className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${
                                                    log.status?.name ===
                                                    "Active"
                                                        ? "bg-green-100 text-green-800"
                                                        : log.status?.name ===
                                                          "Rejected"
                                                        ? "bg-red-100 text-red-800"
                                                        : log.status?.name ===
                                                          "Expired"
                                                        ? "bg-gray-100 text-gray-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                }`}
                                            >
                                                {log.status?.name || "Pending"}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-4">
                                        {formatDateTime(log.created_at)}
                                    </td>
                                    <td className="px-3 py-4 flex justify-center items-center text-center space-x-3">
                                        {log.status?.name === "Pending" ? (
                                        <button
                                            className="text-blue-400 hover:text-blue-500"
                                            title="Edit RFQ"
                                            onClick={() => handleEdit(log.id)}
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        ) : (
                                            <div className="w-4 h-4"></div>
                                        )}
                                        <button
                                            onClick={() =>
                                                handleGeneratePDF(log.id)
                                            }
                                            className="w-4 h-4"
                                            title="Download PDF"
                                        >
                                            <img
                                                src="/images/pdf-file.png"
                                                alt="PDF"
                                                className="w-full h-full"
                                            />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleGenerateExcel(
                                                    log.id,
                                                    log.excel_attachment
                                                )
                                            }
                                            className="text-green-600 hover:text-green-800"
                                            title="Export to Excel"
                                        >
                                            <FontAwesomeIcon
                                                icon={faFileExcel}
                                            />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(log.id)}
                                            className="text-red-500 hover:text-red-800"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="text-center text-[#2C323C] font-medium py-4"
                                >
                                    No RFQs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {!loading && !error && rfqLogs.length > 0 && (
                    <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
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
                                        : "border border-[#B9BBBD] bg-white"
                                } rounded-full hover:bg-[#0077B6] hover:text-white transition`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            className={`px-3 py-1 bg-[#009FDC] text-white rounded-full hover:bg-[#0077B6] transition ${
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
    );
};

export default RFQsTable;
