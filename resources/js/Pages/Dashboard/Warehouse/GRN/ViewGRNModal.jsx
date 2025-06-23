import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTimes,
    faFileInvoiceDollar,
    faUser,
    faBuilding,
    faListCheck,
    faCircleCheck,
    faCircleExclamation,
    faCircleXmark,
    faNoteSticky,
    faTruck,
    faBoxes,
    faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";

const ViewGRNModal = ({ isOpen, onClose, grn }) => {
    if (!isOpen || !grn) return null;

    // Status badge component
    const StatusBadge = ({ status }) => {
        let badgeClass = "px-3 py-1 rounded-full text-xs font-medium";
        let icon = null;

        switch (status?.toLowerCase()) {
            case "pending":
                badgeClass += " bg-yellow-100 text-yellow-800";
                icon = faCircleExclamation;
                break;
            case "delivered":
                badgeClass += " bg-green-100 text-green-800";
                icon = faCircleCheck;
                break;
            case "cancelled":
                badgeClass += " bg-red-100 text-red-800";
                icon = faCircleXmark;
                break;
            case "active":
            default:
                badgeClass += " bg-green-100 text-green-800";
                icon = faCircleCheck;
                break;
        }

        return (
            <span className={badgeClass}>
                {icon && <FontAwesomeIcon icon={icon} className="mr-1" />}
                {status || "Active"}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[99999]">
            <div className="bg-white rounded-2xl w-[95%] max-w-5xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-[#C7E7DE] text-[#2C323C] px-8 py-4 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold">
                                Good Receiving Note Details
                            </h2>
                            <p className="mt-1">GRN #{grn.grn_number}</p>
                        </div>
                        <button onClick={onClose}>
                            <FontAwesomeIcon icon={faTimes} size="lg" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* GRN Summary Card */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
                        <div className="flex flex-wrap justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    GRN Summary
                                </h3>
                                <p className="text-gray-500">
                                    Created on {formatDate(grn.created_at)}
                                </p>
                                <p className="text-gray-500 mt-1">
                                    Total Quantity: {grn.quantity}
                                </p>
                            </div>
                            <StatusBadge status={grn.status} />
                        </div>
                    </div>

                    {/* Detailed Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* GRN Information */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center text-blue-600 mb-4">
                                <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-3" />
                                <h3 className="text-lg font-semibold">
                                    GRN Information
                                </h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">GRN Number:</span>
                                    <span className="font-medium">
                                        {grn.grn_number}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Created By:</span>
                                    <span className="font-medium">
                                        {grn.user?.name || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Delivery Date:</span>
                                    <span className="font-medium">
                                        {formatDate(grn.delivery_date)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Related Documents */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center text-green-600 mb-4">
                                <FontAwesomeIcon icon={faBuilding} className="mr-3" />
                                <h3 className="text-lg font-semibold">
                                    Related Documents
                                </h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Quotation #:</span>
                                    <span className="font-medium">
                                        {grn.quotation?.quotation_number || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Purchase Order #:</span>
                                    <span className="font-medium">
                                        {grn.purchase_order?.purchase_order_no || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Supplier:</span>
                                    <span className="font-medium">
                                        {grn.quotation?.supplier?.name || grn.quotation?.company_name || "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Received Goods */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm md:col-span-2">
                            <div className="flex items-center text-purple-600 mb-4">
                                <FontAwesomeIcon icon={faBoxes} className="mr-3" />
                                <h3 className="text-lg font-semibold">
                                    Received Goods
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Supplier</th>
                                            <th className="px-4 py-2 text-left">Quantity Quoted</th>
                                            <th className="px-4 py-2 text-left">Quantity Delivered</th>
                                            <th className="px-4 py-2 text-left">Receiver</th>
                                            <th className="px-4 py-2 text-left">Delivery Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {grn.receive_goods?.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2">
                                                    {item.supplier?.name || "N/A"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {item.quantity_quoted || "N/A"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {item.quantity_delivered || "N/A"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {item.receiver_name || "N/A"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {formatDate(item.delivery_date)}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!grn.receive_goods || grn.receive_goods.length === 0) && (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                                                    No received goods found for this GRN.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewGRNModal; 