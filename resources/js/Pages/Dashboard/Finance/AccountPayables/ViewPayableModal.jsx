import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTimes,
    faFileInvoiceDollar,
    faUser,
    faMoneyBillWave,
    faNoteSticky,
    faCircleCheck,
    faCircleExclamation,
    faCircleXmark,
    faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const ViewPayableModal = ({ id, isOpen, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [payableData, setPayableData] = useState(null);
    const [downloadLoading, setDownloadLoading] = useState(false);

    useEffect(() => {
        if (isOpen && id) {
            fetchPayableDetails();
        }
    }, [isOpen, id]);

    const fetchPayableDetails = async () => {
        if (!id) {
            setError("Payment Order ID is missing");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            let paymentOrder;
            let response;
            try {
                response = await axios.get(
                    `/api/v1/payment-orders/${id}/raw-data`
                );
                paymentOrder = response.data.data;
            } catch (rawDataError) {
                response = await axios.get(
                    `/api/v1/payment-orders/${id}?include=user,purchaseOrder`
                );
                paymentOrder = response.data.data;
            }

            if (!paymentOrder) {
                setError("Invalid payment order data");
                setLoading(false);
                return;
            }

            // Calculate balance
            const totalAmount = paymentOrder.total_amount || 0;
            const paidAmount = paymentOrder.paid_amount || 0;
            const balance = totalAmount - paidAmount;

            // Set supplier data variables
            let supplierName = "N/A";
            let contactNumber = "N/A";
            let supplierEmail = "N/A";

            // If user is included in the response
            if (paymentOrder.user) {
                supplierName = paymentOrder.user.name || "N/A";
                contactNumber = paymentOrder.user.mobile || "N/A";
                supplierEmail = paymentOrder.user.email || "N/A";
            }
            // If we need to fetch user separately
            else if (paymentOrder.user_id) {
                try {
                    const supplierResponse = await axios.get(
                        `/api/v1/users/${paymentOrder.user_id}`
                    );
                    if (supplierResponse.data && supplierResponse.data.data) {
                        const supplierData = supplierResponse.data.data;
                        supplierName = supplierData.name || "N/A";
                        contactNumber = supplierData.mobile || "N/A";
                        supplierEmail = supplierData.email || "N/A";
                    }
                } catch (supplierError) {
                    console.error("Error fetching supplier:", supplierError);
                }
            }

            // Format the status from snake_case to title case
            let formattedStatus = "Pending";

            if (paymentOrder.status) {
                // Check if it's draft status - convert to lowercase first
                const statusLower = String(paymentOrder.status)
                    .toLowerCase()
                    .trim();

                if (statusLower === "draft") {
                    formattedStatus = "Draft";
                } else {
                    // Handle other statuses
                    formattedStatus = paymentOrder.status
                        .replace(/_/g, " ") // Replace all underscores with spaces
                        .replace(/\b\w/g, (l) => l.toUpperCase());
                }
            }

            // Get payment terms/method with fallbacks
            const paymentTerms =
                paymentOrder.payment_type ||
                paymentOrder.payment_terms ||
                paymentOrder.payment_method ||
                "N/A";

            // Prepare dates
            const issueDate =
                paymentOrder.issue_date ||
                paymentOrder.date ||
                paymentOrder.created_at;
            const dueDate = paymentOrder.due_date || null;

            // Extract purchase order details if available
            let purchaseOrderInfo = null;
            if (paymentOrder.purchase_order) {
                purchaseOrderInfo = {
                    purchase_order_no:
                        paymentOrder.purchase_order.purchase_order_no,
                    purchase_order_date:
                        paymentOrder.purchase_order.purchase_order_date,
                    supplier_name:
                        paymentOrder.purchase_order.supplier?.name || "N/A",
                };
            }

            // Create formatted payment order with supplier data
            let formattedPaymentOrder = {
                ...paymentOrder,
                payment_order_no:
                    paymentOrder.payment_order_number ||
                    `PO-${paymentOrder.id.toString().padStart(5, "0")}`,
                supplier: supplierName,
                contact: contactNumber,
                email: supplierEmail,
                status: formattedStatus,
                amount: totalAmount,
                paid_amount: paidAmount,
                balance: balance,
                payment_method: paymentTerms,
                issue_date: issueDate,
                due_date: dueDate,
                purchase_order: purchaseOrderInfo,
                notes:
                    paymentOrder.notes ||
                    paymentOrder.purchase_order?.notes ||
                    "",
            };

            setPayableData(formattedPaymentOrder);
            setError("");
        } catch (error) {
            setError(
                "Failed to load payable details: " +
                    (error.response?.data?.message || error.message)
            );
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;

            return date.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        } catch (error) {
            console.error("Date formatting error:", error);
            return dateString;
        }
    };

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return "N/A";

        return parseFloat(amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // Generate PDF version of invoice for download
    const generatePdfPayable = async (documentUrl, payableNumber) => {
        if (!documentUrl) {
            alert("No payment order document available");
            return;
        }
        setDownloadLoading(true);

        try {
            const fullUrl = documentUrl.startsWith("http")
                ? documentUrl
                : `/storage/${documentUrl.replace(/^\//g, "")}`;

            // Create a temporary link element to trigger download
            const link = document.createElement("a");
            link.href = fullUrl;
            link.setAttribute(
                "download",
                `PaymentOrder_${payableNumber || "document"}.pdf`
            );
            link.setAttribute("target", "_blank");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setDownloadLoading(false);
        }
    };

    // Status badge component
    const StatusBadge = ({ status }) => {
        let badgeClass = "px-3 py-1 rounded-full text-xs font-medium";
        let icon = null;

        switch (status?.toLowerCase()) {
            case "paid":
                badgeClass += " bg-green-100 text-green-800";
                icon = faCircleCheck;
                break;
            case "pending":
                badgeClass += " bg-yellow-100 text-yellow-800";
                icon = faCircleExclamation;
                break;
            case "draft":
                badgeClass += " bg-blue-100 text-blue-800";
                icon = faNoteSticky;
                break;
            case "partially paid":
                badgeClass += " bg-purple-100 text-purple-800";
                icon = faCircleExclamation;
                break;
            case "overdue":
                badgeClass += " bg-red-100 text-red-800";
                icon = faCircleXmark;
                break;
            case "approved":
                badgeClass += " bg-green-100 text-green-800";
                icon = faCircleCheck;
                break;
            default:
                badgeClass += " bg-gray-300 text-gray-800";
                break;
        }

        return (
            <span className={badgeClass}>
                {icon && <FontAwesomeIcon icon={icon} className="mr-1" />}
                {status}
            </span>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
            <div className="bg-white rounded-2xl w-[95%] max-w-5xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-[#C7E7DE] text-[#2C323C] px-8 py-4 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold">
                                Account Payable Details
                            </h2>
                            {!loading && !error && payableData && (
                                <p className="mt-1">
                                    Payment Order #{" "}
                                    {payableData.payment_order_no}
                                </p>
                            )}
                        </div>
                        <button onClick={onClose}>
                            <FontAwesomeIcon icon={faTimes} size="lg" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-600">
                                Loading payment order details...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
                            <div className="flex items-center">
                                <FontAwesomeIcon
                                    icon={faCircleXmark}
                                    className="text-red-500 mr-3"
                                />
                                <div>
                                    <p className="font-bold">Error</p>
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    ) : !payableData ? (
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded mb-6">
                            <div className="flex items-center">
                                <FontAwesomeIcon
                                    icon={faCircleExclamation}
                                    className="text-yellow-500 mr-3"
                                />
                                <p>No data found for this payable.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Generate PDF Button */}
                            <div className="flex flex-wrap justify-end gap-3 mb-4">
                                {payableData.attachment ? (
                                    <button
                                        disabled={downloadLoading}
                                        onClick={() =>
                                            generatePdfPayable(
                                                payableData.attachment,
                                                payableData.payment_order_number
                                            )
                                        }
                                        className={`flex items-center ${
                                            downloadLoading
                                                ? "bg-gray-400"
                                                : "bg-purple-600 hover:bg-purple-700"
                                        } text-white font-medium py-2 px-4 rounded-lg transition-colors`}
                                    >
                                        {downloadLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Generating PDF...
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon
                                                    icon={faFileInvoiceDollar}
                                                    className="mr-2"
                                                />
                                                Generate PDF
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <div className="flex items-center text-gray-500 border border-gray-300 bg-gray-100 py-2 px-4 rounded-lg">
                                        <FontAwesomeIcon
                                            icon={faFileInvoiceDollar}
                                            className="mr-2"
                                        />
                                        No PDF available
                                    </div>
                                )}
                            </div>

                            {/* Payable Summary Card */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
                                <div className="flex flex-wrap justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">
                                            Payment Order Summary
                                        </h3>
                                        <p className="text-gray-500">
                                            {formatDate(payableData.issue_date)}{" "}
                                            - {formatDate(payableData.due_date)}
                                        </p>
                                    </div>
                                    <StatusBadge status={payableData.status} />
                                </div>
                            </div>

                            {/* Detailed Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center text-blue-600 mb-4">
                                        <FontAwesomeIcon
                                            icon={faFileInvoiceDollar}
                                            className="mr-3"
                                        />
                                        <h3 className="text-lg font-semibold">
                                            Payment Order Details
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-600">
                                                Payment Order Number:
                                            </span>
                                            <span className="font-medium">
                                                {payableData.payment_order_no}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-600">
                                                Issue Date:
                                            </span>
                                            <span className="font-medium">
                                                {formatDate(
                                                    payableData.issue_date
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-600">
                                                Due Date:
                                            </span>
                                            <span className="font-medium">
                                                {formatDate(
                                                    payableData.due_date
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center text-green-600 mb-4">
                                        <FontAwesomeIcon
                                            icon={faUser}
                                            className="mr-3"
                                        />
                                        <h3 className="text-lg font-semibold">
                                            Supplier Information
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-600">
                                                Supplier Name:
                                            </span>
                                            <span className="font-medium">
                                                {payableData.supplier}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-600">
                                                Contact Number:
                                            </span>
                                            <span className="font-medium">
                                                {payableData.contact}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-600">
                                                Email:
                                            </span>
                                            <span className="font-medium">
                                                {payableData.email}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center text-purple-600 mb-4">
                                        <FontAwesomeIcon
                                            icon={faMoneyBillWave}
                                            className="mr-3"
                                        />
                                        <h3 className="text-lg font-semibold">
                                            Payment Information
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-600">
                                                Total Amount:
                                            </span>
                                            <span className="font-medium">
                                                $
                                                {formatCurrency(
                                                    payableData.amount
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-600">
                                                Paid Amount:
                                            </span>
                                            <span className="font-medium">
                                                $
                                                {formatCurrency(
                                                    payableData.paid_amount
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-600">
                                                Balance:
                                            </span>
                                            <span
                                                className={`font-bold ${
                                                    parseFloat(
                                                        payableData.balance
                                                    ) > 0
                                                        ? "text-red-600"
                                                        : "text-green-600"
                                                }`}
                                            >
                                                $
                                                {formatCurrency(
                                                    payableData.balance
                                                )}
                                            </span>
                                        </div>
                                        {payableData.payment_method && (
                                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-gray-600">
                                                    Payment Method:
                                                </span>
                                                <span className="font-medium">
                                                    {payableData.payment_method}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {payableData.purchase_order && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                        <div className="flex items-center text-teal-600 mb-4">
                                            <FontAwesomeIcon
                                                icon={faFileLines}
                                                className="mr-3"
                                            />
                                            <h3 className="text-lg font-semibold">
                                                Purchase Order Details
                                            </h3>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-gray-600">
                                                    PO Number:
                                                </span>
                                                <span className="font-medium">
                                                    {
                                                        payableData
                                                            .purchase_order
                                                            .purchase_order_no
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-gray-600">
                                                    PO Date:
                                                </span>
                                                <span className="font-medium">
                                                    {formatDate(
                                                        payableData
                                                            .purchase_order
                                                            .purchase_order_date
                                                    )}
                                                </span>
                                            </div>
                                            {payableData.purchase_order
                                                .supplier_name && (
                                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                                    <span className="text-gray-600">
                                                        PO Supplier:
                                                    </span>
                                                    <span className="font-medium">
                                                        {
                                                            payableData
                                                                .purchase_order
                                                                .supplier_name
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {payableData.notes && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                        <div className="flex items-center text-orange-600 mb-4">
                                            <FontAwesomeIcon
                                                icon={faNoteSticky}
                                                className="mr-3"
                                            />
                                            <h3 className="text-lg font-semibold">
                                                Notes
                                            </h3>
                                        </div>
                                        <p className="text-gray-700 whitespace-pre-line">
                                            {payableData.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewPayableModal;
