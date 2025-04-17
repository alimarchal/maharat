import React, { useState, useEffect } from "react";
import { Link, router, Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeftLong,
    faChevronRight,
    faRemove,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import PurchaseOrderPDF from "./PurchaseOrderPDF";

const FileDisplay = ({ file, fileName }) => {
    if (!file) return null;

    const fileUrl = file;
    const displayName = fileName || "View Attachment";

    return (
        <div className="flex flex-col items-center justify-center space-y-2">
            <DocumentArrowDownIcon
                className="h-10 w-10 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => fileUrl && window.open(fileUrl, "_blank")}
            />

            {fileUrl && (
                <span
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-center break-words whitespace-normal w-full"
                    onClick={() => fileUrl && window.open(fileUrl, "_blank")}
                >
                    {displayName}
                </span>
            )}
        </div>
    );
};

export default function ViewOrder({ auth }) {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [savedPdfUrl, setSavedPdfUrl] = useState(null);

    const fetchPurchaseOrders = async () => {
        setLoading(true);

        try {
            const response = await axios.get("/api/v1/purchase-orders", {
                params: {
                    page: currentPage,
                    include: "quotation",
                    per_page: 10,
                },
            });
            const purchaseOrdersData = response.data.data || [];

            const purchaseOrdersWithDetails = await Promise.all(
                purchaseOrdersData.map(async (order) => {
                    let quotationDetails = {
                        quotation_number: "N/A",
                        company_name: "N/A",
                    };
                    if (order.quotation) {
                        quotationDetails = {
                            quotation_number:
                                order.quotation.quotation_number || "N/A",
                            company_name: order.quotation.company_name || "N/A",
                        };
                    } else if (order.quotation_id) {
                        try {
                            const quotationResponse = await axios.get(
                                `/api/v1/quotations/${order.quotation_id}`
                            );
                            if (quotationResponse.data.data) {
                                quotationDetails = {
                                    quotation_number:
                                        quotationResponse.data.data
                                            .quotation_number || "N/A",
                                    company_name:
                                        quotationResponse.data.data
                                            .company_name || "N/A",
                                };
                            }
                        } catch (error) {
                            console.error(
                                `Error fetching quotation ${order.quotation_id}:`,
                                error
                            );
                        }
                    }

                    let attachmentUrl = null;
                    if (order.attachment) {
                        attachmentUrl = order.attachment.startsWith("http")
                            ? order.attachment
                            : `/storage/${order.attachment}`;
                    }
                    
                    return {
                        ...order,
                        quotation_number: quotationDetails.quotation_number,
                        company_name: quotationDetails.company_name,
                        purchase_order_date: order.purchase_order_date,
                        expiry_date: order.expiry_date,
                        formatted_attachment: attachmentUrl,
                        original_name: order.original_name || "Document",
                    };
                })
            );

            setPurchaseOrders(purchaseOrdersWithDetails);
            setLastPage(response.data.meta?.last_page || 1);
            setError("");
        } catch (error) {
            setError(
                "Failed to load purchase orders. " +
                    (error.response?.data?.message || "")
            );
            setPurchaseOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchaseOrders();
    }, [currentPage]);

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    // Handle PDF generation
    const handleGeneratePDF = (orderId) => {
        const purchaseOrder = purchaseOrders.find(
            (order) => order.id === orderId
        );

        if (purchaseOrder && purchaseOrder.pdf_url) {
            window.open(purchaseOrder.pdf_url, "_blank");
            return;
        }

        // If no pre-generated PDF, show PDF generation modal
        setIsGeneratingPDF(true);
        setSelectedOrderId(orderId);
        setSavedPdfUrl(null);
    };

    const handlePDFGenerated = (documentUrl) => {
        setSavedPdfUrl(documentUrl);
        setIsGeneratingPDF(false);

        if (documentUrl) {
            // Update purchase orders list with the new PDF URL
            setPurchaseOrders((prevOrders) =>
                prevOrders.map((order) =>
                    order.id === selectedOrderId
                        ? { 
                            ...order, 
                            pdf_url: documentUrl,
                            formatted_attachment: documentUrl,
                            attachment: documentUrl,
                            original_name: `purchase_order_${order.purchase_order_no || order.id}.pdf`
                          }
                        : order
                )
            );
        }

        setSelectedOrderId(null);
        // Refresh the data to get updated attachment information
        setTimeout(() => {
            fetchPurchaseOrders();
        }, 1000);
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
                    <span className="text-[#009FDC] text-xl">
                        Purchase Orders
                    </span>
                </div>
                <Head title="Purchase Orders" />

                <div className="w-full overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[32px] font-bold text-[#2C323C]">
                            Purchase Orders
                        </h2>
                        <Link
                            href="/create-order"
                            className="bg-[#009FDC] text-white px-7 py-3 rounded-full text-xl font-medium"
                        >
                            Create New Purchase Order
                        </Link>
                    </div>

                    {/* PDF Generation Component */}
                    {isGeneratingPDF && selectedOrderId && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold">
                                        Generating PDF
                                    </h3>
                                    <button
                                        onClick={() =>
                                            setIsGeneratingPDF(false)
                                        }
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <FontAwesomeIcon icon={faRemove} />
                                    </button>
                                </div>

                                {savedPdfUrl ? (
                                    <div className="text-center">
                                        <div className="mb-4 text-green-600">
                                            <svg
                                                className="w-16 h-16 mx-auto"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                        <p className="mb-4">
                                            PDF has been generated successfully!
                                        </p>
                                        <div className="flex justify-center space-x-4">
                                            <a
                                                href={savedPdfUrl}
                                                target="_blank"
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                            >
                                                Download PDF
                                            </a>
                                            <button
                                                onClick={() =>
                                                    setIsGeneratingPDF(false)
                                                }
                                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center mb-4">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                                            <p>
                                                Please wait, generating PDF
                                                document...
                                            </p>
                                        </div>
                                        <PurchaseOrderPDF
                                            purchaseOrderId={selectedOrderId}
                                            onGenerated={handlePDFGenerated}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="w-full overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                        PO #
                                    </th>
                                    <th className="py-3 px-4">Quotation #</th>
                                    <th className="py-3 px-4">Company</th>
                                    <th className="py-3 px-4">Issue Date</th>
                                    <th className="py-3 px-4">Expiry Date</th>
                                    <th className="py-3 px-4">Amount</th>
                                    <th className="py-3 px-4 text-center">
                                        Attachment
                                    </th>
                                    <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="text-center py-12"
                                        >
                                            <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="text-center text-red-500 font-medium py-4"
                                        >
                                            {error}
                                        </td>
                                    </tr>
                                ) : purchaseOrders.length > 0 ? (
                                    purchaseOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td className="px-3 py-4">
                                                {order.purchase_order_no ||
                                                    "N/A"}
                                            </td>
                                            <td className="px-3 py-4">
                                                {order.quotation_number ||
                                                    "N/A"}
                                            </td>
                                            <td className="px-3 py-4">
                                                {order.company_name || "N/A"}
                                            </td>
                                            <td className="px-3 py-4">
                                                {formatDateForDisplay(
                                                    order.purchase_order_date
                                                )}
                                            </td>
                                            <td className="px-3 py-4">
                                                {formatDateForDisplay(
                                                    order.expiry_date
                                                )}
                                            </td>
                                            <td className="px-3 py-4">
                                                {Number(
                                                    order.amount || 0
                                                ).toLocaleString()}
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <div className="flex flex-col items-center justify-center w-full">
                                                    {order.formatted_attachment ? (
                                                        <FileDisplay
                                                            file={
                                                                order.formatted_attachment
                                                            }
                                                            fileName={
                                                                order.original_name
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="text-gray-500">
                                                            No attachment
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 flex justify-center items-center text-center space-x-3">
                                                <button
                                                    className="w-4 h-4"
                                                    onClick={() =>
                                                        handleGeneratePDF(
                                                            order.id
                                                        )
                                                    }
                                                    title="Download PDF"
                                                >
                                                    <img
                                                        src="/images/pdf-file.png"
                                                        alt="PDF"
                                                        className="w-full h-full"
                                                    />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="text-center py-4"
                                        >
                                            No purchase orders available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {!loading && !error && purchaseOrders.length > 0 && (
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
                                        } rounded-full hover:bg-[#0077B6] hover:text-center transition`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() =>
                                        setCurrentPage(currentPage + 1)
                                    }
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
            </div>
        </AuthenticatedLayout>
    );
}
