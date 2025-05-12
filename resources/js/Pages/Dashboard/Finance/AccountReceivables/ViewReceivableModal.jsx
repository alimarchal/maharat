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
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const ViewReceivableModal = ({ id, isOpen, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [invoiceData, setInvoiceData] = useState(null);
    const [downloadLoading, setDownloadLoading] = useState(false);

    useEffect(() => {
        if (isOpen && id) {
            fetchInvoiceDetails();
        }
    }, [isOpen, id]);

    const fetchInvoiceDetails = async () => {
        if (!id) {
            setError("Invoice ID is missing");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(
                `/api/v1/invoices/${id}?include=client`
            );
            if (!response.data || !response.data.data) {
                setError("Invalid invoice data");
                setLoading(false);
                return;
            }
            const invoice = response.data.data;

            // Calculate balance
            const balance =
                (invoice.total_amount || 0) - (invoice.paid_amount || 0);

            // Set customer data variables
            let customerName = "N/A";
            let contactNumber = "N/A";
            let customerEmail = "N/A";

            // If client is included in the response
            if (invoice.client) {
                customerName = invoice.client.name || "N/A";
                contactNumber = invoice.client.contact_number || "N/A";
                customerEmail = invoice.client.email || "N/A";
            }
            // If we need to fetch client separately
            else if (invoice.client_id) {
                try {
                    const customerResponse = await axios.get(
                        `/api/v1/customers/${invoice.client_id}`
                    );
                    if (customerResponse.data && customerResponse.data.data) {
                        const customerData = customerResponse.data.data;
                        customerName = customerData.name || "N/A";
                        contactNumber = customerData.contact_number || "N/A";
                        customerEmail = customerData.email || "N/A";
                    }
                } catch (customerError) {
                    console.error("Error fetching customer:", customerError);
                }
            }

            // Create formatted invoice with customer data
            let formattedInvoice = {
                ...invoice,
                invoice_no:
                    invoice.invoice_number ||
                    `INV-${invoice.id.toString().padStart(5, "0")}`,
                customer: customerName,
                contact: contactNumber,
                email: customerEmail,
                status: invoice.status || "Pending",
                amount: invoice.total_amount || 0,
                balance: balance,
            };
            setInvoiceData(formattedInvoice);
            setError("");
        } catch (error) {
            setError(
                "Failed to load receivable details: " +
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
    const generatePdfInvoice = async (documentUrl, invoiceNumber) => {
        if (!documentUrl) {
            alert("No invoice document available");
            return;
        }
        setDownloadLoading(true);

        try {
            const fullUrl = documentUrl.startsWith("http")
                ? documentUrl
                : `/${documentUrl.replace(/^\//g, "")}`;

            // Create a temporary link element to trigger download
            const link = document.createElement("a");
            link.href = fullUrl;
            link.setAttribute(
                "download",
                `Invoice_${invoiceNumber || "document"}.pdf`
            );
            link.setAttribute("target", "_blank");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("PDF generation error:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setDownloadLoading(false);
        }
    };

    // Status badge component
    const StatusBadge = ({ status }) => {
        let badgeClass = "px-3 py-1 rounded-full text-xs font-medium";
        let icon = null;

        // Format the status first
        const formattedStatus = status?.replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

        switch (status?.toLowerCase()) {
            case "approved":
                badgeClass += " bg-green-100 text-green-800";
                icon = faCircleCheck;
                break;
            case "pending":
                badgeClass += " bg-yellow-100 text-yellow-800";
                icon = faCircleExclamation;
                break;
            case "partially_paid":
            case "partially paid":
                badgeClass += " bg-green-100 text-green-800";
                icon = faCircleCheck;
                break;
            case "overdue":
                badgeClass += " bg-purple-100 text-purple-800";
                icon = faCircleXmark;
                break;
            case "cancelled":
                badgeClass += " bg-red-100 text-red-800";
                icon = faCircleXmark;
                break;
            default:
                badgeClass += " bg-gray-300 text-gray-800";
                break;
        }

        return (
            <span className={badgeClass}>
                {icon && <FontAwesomeIcon icon={icon} className="mr-1" />}
                {formattedStatus}
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
                                Account Receivable Details
                            </h2>
                            {!loading && !error && invoiceData && (
                                <p className="mt-1">
                                    Invoice #{invoiceData.invoice_no}
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
                                Loading invoice details...
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
                    ) : !invoiceData ? (
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded mb-6">
                            <div className="flex items-center">
                                <FontAwesomeIcon
                                    icon={faCircleExclamation}
                                    className="text-yellow-500 mr-3"
                                />
                                <p>No data found for this receivable.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Generate PDF Button */}
                            <div className="flex flex-wrap justify-end gap-3 mb-4">
                                {invoiceData.invoice_document ? (
                                    <button
                                        disabled={downloadLoading}
                                        onClick={() =>
                                            generatePdfInvoice(
                                                invoiceData.invoice_document,
                                                invoiceData.invoice_no
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

                            {/* Invoice Summary Card */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
                                <div className="flex flex-wrap justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">
                                            Invoice Summary
                                        </h3>
                                        <p className="text-gray-500">
                                            {formatDate(invoiceData.issue_date)}{" "}
                                            - {formatDate(invoiceData.due_date)}
                                        </p>
                                    </div>
                                    <StatusBadge status={invoiceData.status} />
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
                                            Invoice Details
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-600">
                                                Invoice Number:
                                            </span>
                                            <span className="font-medium">
                                                {invoiceData.invoice_no}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-600">
                                                Issue Date:
                                            </span>
                                            <span className="font-medium">
                                                {formatDate(
                                                    invoiceData.issue_date
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-600">
                                                Due Date:
                                            </span>
                                            <span className="font-medium">
                                                {formatDate(
                                                    invoiceData.due_date
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
                                            Customer Information
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-600">
                                                Customer Name:
                                            </span>
                                            <span className="font-medium">
                                                {invoiceData.customer}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-600">
                                                Contact Number:
                                            </span>
                                            <span className="font-medium">
                                                {invoiceData.contact}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="text-gray-600">
                                                Email:
                                            </span>
                                            <span className="font-medium">
                                                {invoiceData.email}
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
                                                    invoiceData.amount
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
                                                    invoiceData.paid_amount
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
                                                        invoiceData.balance
                                                    ) > 0
                                                        ? "text-red-600"
                                                        : "text-green-600"
                                                }`}
                                            >
                                                $
                                                {formatCurrency(
                                                    invoiceData.balance
                                                )}
                                            </span>
                                        </div>
                                        {invoiceData.payment_method && (
                                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-gray-600">
                                                    Payment Method:
                                                </span>
                                                <span className="font-medium">
                                                    {invoiceData.payment_method}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {invoiceData.notes && (
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
                                            {invoiceData.notes}
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

export default ViewReceivableModal;
