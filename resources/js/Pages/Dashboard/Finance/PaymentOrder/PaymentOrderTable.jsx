import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEye,
    faPaperclip,
    faRemove,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import PaymentOrderPDF from "./PaymentOrderPDF";
import PaymentOrderSumAttachment from "./PaymentOrderSumAttachment";

const PaymentOrderTable = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [selectedPaymentId, setSelectedPaymentId] = useState(null);
    const [savedPdfUrl, setSavedPdfUrl] = useState(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/v1/payment-orders?include=user,purchaseOrder,purchaseOrder.supplier,purchaseOrder.quotation,logs&page=${currentPage}&sort=payment_order_number`
            );
            const res = await response.json();
            if (response.ok) {
                setOrders(res?.data);
                setLastPage(res.meta?.last_page || 1);
            }
        } catch (err) {
            setError("Error loading payment orders.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [currentPage]);

    // Handle PDF generation
    const handleGeneratePDF = (paymentId) => {
        // Always show PDF generation modal regardless of existing attachment
        setIsGeneratingPDF(true);
        setSelectedPaymentId(paymentId);
        setSavedPdfUrl(null);
    };

    const handlePDFGenerated = (documentUrl) => {
        console.log("handlePDFGenerated called with:", documentUrl);
        setSavedPdfUrl(documentUrl);
        setIsGeneratingPDF(false);

        if (documentUrl) {
            // Update the attachment field in the local state
            setOrders((prevPayments) =>
                prevPayments.map((payment) => {
                    if (payment.id === selectedPaymentId) {
                        console.log("Updating payment order:", payment.id);
                        // Extract just the filename from the URL path
                        const fileName = documentUrl.split('/').pop();
                        console.log("Extracted filename:", fileName);
                        // Generated PDFs are saved to the attachment column
                        return { ...payment, attachment: documentUrl };
                    }
                    return payment;
                })
            );
        }

        setSelectedPaymentId(null);
        fetchOrders(); // Refresh the data from the server
    };

    // For viewing existing attachments only
    const viewAttachment = (attachment) => {
        if (attachment) {
            window.open(`/storage/${attachment}`, "_blank");
        }
    };

    // Format number to currency
    const formatCurrency = (value) => {
        if (!value && value !== 0) return 'N/A';
        return `$${parseFloat(value).toFixed(2)}`;
    };

    // Status badge component for payment orders
    const StatusBadge = ({ status }) => {
        let badgeClass = "px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ";
        let label = status || "N/A";
        switch ((status || "").toLowerCase()) {
            case "partially paid":
                badgeClass += "bg-purple-100 text-purple-800";
                break;
            case "paid":
                badgeClass += "bg-green-100 text-green-800";
                break;
            case "pending":
                badgeClass += "bg-yellow-100 text-yellow-800";
                break;
            case "overdue":
                badgeClass += "bg-blue-100 text-blue-800";
                break;
            case "cancelled":
                badgeClass += "bg-red-100 text-red-800";
                break;
            case "draft":
                badgeClass += "bg-gray-100 text-gray-800";
                break;
            default:
                badgeClass += "bg-gray-100 text-gray-800";
                break;
        }
        return <span className={badgeClass}>{label}</span>;
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-[#2C323C] mb-4">
                    Payment Orders
                </h2>
                <Link
                    href="/payment-orders/create"
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                >
                    Create new Payment Order
                </Link>
            </div>

            {/* PDF Generation Component */}
            {isGeneratingPDF && selectedPaymentId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">
                                Generating PDF
                            </h3>
                            <button
                                onClick={() => setIsGeneratingPDF(false)}
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
                                        Please wait, generating PDF document...
                                    </p>
                                </div>
                                <PaymentOrderPDF
                                    paymentOrderId={selectedPaymentId}
                                    onGenerated={handlePDFGenerated}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Payment Order #
                        </th>
                        <th className="py-3 px-4">Purchase Order #</th>
                        <th className="py-3 px-4">Quotation #</th>
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Attachment</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="7" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="7"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : orders.length > 0 ? (
                        orders.map((order) => (
                            <tr key={order.id}>
                                <td className="py-3 px-4">
                                    {order.payment_order_number}
                                </td>
                                <td className="py-3 px-4">
                                    {order.purchase_order?.purchase_order_no ||
                                        "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {order.purchase_order?.quotation?.quotation_number || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {order.purchase_order?.supplier?.name ||
                                        "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {(() => {
                                        const amount = Number(order.total_amount) || 0;
                                        const vat = Number(order.vat_amount) || 0;
                                        const sum = amount + vat;
                                        return sum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                    })()}
                                </td>
                                <td className="py-3 px-4">
                                    <StatusBadge status={order.status} />
                                </td>
                                <td className="py-3 px-4 text-center text-[#009FDC] hover:text-blue-800 cursor-pointer">
                                    <PaymentOrderSumAttachment paymentOrderNumber={order.payment_order_number} />
                                </td>
                                <td className="py-3 px-4 flex justify-center items-center text-center space-x-3">
                                    {/* <Link className="text-[#9B9DA2] hover:text-gray-500">
                                        <FontAwesomeIcon icon={faEye} />
                                    </Link> */}
                                    <button
                                        className="w-4 h-4"
                                        onClick={() =>
                                            handleGeneratePDF(order.id)
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
                                colSpan="7"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Payment Orders found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && orders.length > 0 && (
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
                            } rounded-full hover:bg-[#0077B6] transition`}
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
    );
};

export default PaymentOrderTable;
