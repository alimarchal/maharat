import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faFileInvoiceDollar, faUser, faBuildingColumns, faMoneyBillWave } from "@fortawesome/free-solid-svg-icons";

const StatusBadge = ({ status }) => {
    let badgeClass = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status?.toLowerCase()) {
        case "paid":
            badgeClass += " bg-green-100 text-green-800";
            break;
        case "unpaid":
            badgeClass += " bg-red-100 text-red-800";
            break;
        case "partially paid":
            badgeClass += " bg-purple-100 text-purple-800";
            break;
        case "verified":
            badgeClass += " bg-yellow-100 text-yellow-800";
            break;
        case "draft":
            badgeClass += " bg-gray-100 text-gray-800";
            break;
        default:
            badgeClass += " bg-gray-100 text-gray-800";
            break;
    }
    return <span className={badgeClass}>{status}</span>;
};

const ViewExternalInvoiceModal = ({ isOpen, onClose, invoice }) => {
    if (!isOpen || !invoice) return null;
    const paidAmountRaw = invoice.paid_amount !== undefined && invoice.paid_amount !== null ? Number(invoice.paid_amount) : 0;
    const totalAmount = invoice.amount !== undefined && invoice.amount !== null ? Number(invoice.amount) : 0;
    const vatAmount = invoice.vat_amount !== undefined && invoice.vat_amount !== null ? Number(invoice.vat_amount) : 0;
    // Paid VAT = paid_amount * 15 / 115
    const paidVAT = paidAmountRaw * 15 / 115;
    // Paid Amount = paid_amount - paidVAT
    const paidAmount = paidAmountRaw - paidVAT;
    // Remaining Amount = totalAmount - paidAmount
    const remainingAmount = totalAmount - paidAmount;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[99999]">
            <div className="bg-white rounded-2xl w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
                {/* Header */}
                <div className="bg-[#C7E7DE] text-[#2C323C] px-8 py-4 rounded-t-2xl flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-blue-500 text-2xl" />
                        <h2 className="text-2xl md:text-3xl font-bold">Invoice Details</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-600 transition">
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
                        <div className="flex flex-wrap justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    Invoice #{invoice.invoice_id || invoice.id}
                                </h3>
                                <p className="text-gray-500 mt-1">
                                    Supplier: {invoice.supplier?.name || "N/A"}
                                </p>
                            </div>
                            <StatusBadge status={invoice.status} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center text-blue-600 mb-4">
                                <FontAwesomeIcon icon={faUser} className="mr-3" />
                                <h3 className="text-lg font-semibold">Invoice Information</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Invoice ID:</span>
                                    <span className="font-medium">{invoice.invoice_id || invoice.id}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Supplier:</span>
                                    <span className="font-medium">{invoice.supplier?.name || "N/A"}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Status:</span>
                                    <span className="font-medium"><StatusBadge status={invoice.status} /></span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Purchase Order:</span>
                                    <span className="font-medium">{invoice.purchase_order?.purchase_order_no || "N/A"}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Payable Date:</span>
                                    <span className="font-medium">{invoice.payable_date ? new Date(invoice.payable_date).toLocaleDateString() : "N/A"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center text-green-600 mb-4">
                                <FontAwesomeIcon icon={faMoneyBillWave} className="mr-3" />
                                <h3 className="text-lg font-semibold">Payment Details</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Total Amount:</span>
                                    <span className="font-medium">{totalAmount.toLocaleString()} SAR</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">VAT:</span>
                                    <span className="font-medium">{vatAmount.toLocaleString()} SAR</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Paid Amount:</span>
                                    <span className="font-medium">{paidAmount.toLocaleString(undefined, {maximumFractionDigits: 2})} SAR</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Paid VAT:</span>
                                    <span className="font-medium">{paidVAT.toLocaleString(undefined, {maximumFractionDigits: 2})} SAR</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Remaining Amount:</span>
                                    <span className="font-medium">{remainingAmount.toLocaleString(undefined, {maximumFractionDigits: 2})} SAR</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewExternalInvoiceModal; 