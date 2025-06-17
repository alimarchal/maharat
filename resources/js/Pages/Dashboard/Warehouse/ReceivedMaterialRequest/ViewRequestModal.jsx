import React, { useState, useEffect } from "react";
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
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const ViewRequestModal = ({ isOpen, onClose, request }) => {
    const [issueMaterial, setIssueMaterial] = useState(null);

    useEffect(() => {
        const fetchIssueMaterial = async () => {
            if (request?.id) {
                try {
                    const response = await axios.get(`/api/v1/issue-materials`, {
                        params: {
                            'filter[material_request_id]': request.id
                        }
                    });
                    if (response.data?.data?.length > 0) {
                        setIssueMaterial(response.data.data[0]);
                    }
                } catch (error) {
                    console.error('Error fetching issue material:', error);
                }
            }
        };

        fetchIssueMaterial();
    }, [request?.id]);

    if (!isOpen || !request) return null;

    console.log("ViewRequestModal - Full request object:", request);
    console.log("ViewRequestModal - Issue Material:", issueMaterial);
    console.log("ViewRequestModal - Status:", request.status?.name);
    console.log("ViewRequestModal - Description from issue material:", issueMaterial?.description);

    // Status badge component
    const StatusBadge = ({ status }) => {
        let badgeClass = "px-3 py-1 rounded-full text-xs font-medium";
        let icon = null;

        switch (status?.toLowerCase()) {
            case "pending":
                badgeClass += " bg-yellow-100 text-yellow-800";
                icon = faCircleExclamation;
                break;
            case "issued":
                badgeClass += " bg-green-100 text-green-800";
                icon = faCircleCheck;
                break;
            case "rejected":
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
                {status}
            </span>
        );
    };

    // Priority badge component
    const PriorityBadge = ({ priority }) => {
        let badgeClass = "px-3 py-1 rounded-full text-xs font-medium";

        switch (priority?.toLowerCase()) {
            case "high":
                badgeClass += " bg-red-100 text-red-800";
                break;
            case "medium":
                badgeClass += " bg-yellow-100 text-yellow-800";
                break;
            case "low":
            case "normal":
                badgeClass += " bg-green-100 text-green-800";
                break;
            default:
                badgeClass += " bg-gray-300 text-gray-800";
                break;
        }

        return <span className={badgeClass}>{priority}</span>;
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[99999]">
            <div className="bg-white rounded-2xl w-[95%] max-w-5xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-[#C7E7DE] text-[#2C323C] px-8 py-4 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold">
                                Material Request Details
                            </h2>
                            <p className="mt-1">Request #{request.id}</p>
                        </div>
                        <button onClick={onClose}>
                            <FontAwesomeIcon icon={faTimes} size="lg" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Request Summary Card */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
                        <div className="flex flex-wrap justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    Request Summary
                                </h3>
                                <p className="text-gray-500">
                                    Created on {new Date(request.created_at).toLocaleDateString()}
                                </p>
                                <p className="text-gray-500 mt-1">
                                    Warehouse: {request.warehouse?.name || "N/A"}
                                </p>
                            </div>
                            <StatusBadge status={request.status?.name} />
                        </div>
                    </div>

                    {/* Rejection Reason - Only show for Rejected status */}
                    {request.status?.name === "Rejected" && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 shadow-sm">
                            <div className="flex items-center text-red-600 mb-4">
                                <FontAwesomeIcon icon={faCircleXmark} className="mr-3" />
                                <h3 className="text-lg font-semibold">
                                    Rejection Reason
                                </h3>
                            </div>
                            <p className="text-gray-700 whitespace-pre-line">
                                {issueMaterial?.description || "No rejection reason provided"}
                            </p>
                        </div>
                    )}

                    {/* Detailed Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Requester Information */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center text-blue-600 mb-4">
                                <FontAwesomeIcon icon={faUser} className="mr-3" />
                                <h3 className="text-lg font-semibold">
                                    Requester Information
                                </h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Requester:</span>
                                    <span className="font-medium">
                                        {request.requester?.name || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Department:</span>
                                    <span className="font-medium">
                                        {request.department?.name || "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Cost Center Information */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center text-green-600 mb-4">
                                <FontAwesomeIcon icon={faBuilding} className="mr-3" />
                                <h3 className="text-lg font-semibold">
                                    Cost Center Information
                                </h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Cost Center:</span>
                                    <span className="font-medium">
                                        {request.costCenter?.name || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Sub Cost Center:</span>
                                    <span className="font-medium">
                                        {request.subCostCenter?.name || "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Requested Items */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm md:col-span-2">
                            <div className="flex items-center text-purple-600 mb-4">
                                <FontAwesomeIcon icon={faListCheck} className="mr-3" />
                                <h3 className="text-lg font-semibold">
                                    Requested Items
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Item</th>
                                            <th className="px-4 py-2 text-left">Category</th>
                                            <th className="px-4 py-2 text-left">Quantity</th>
                                            <th className="px-4 py-2 text-left">Unit</th>
                                            <th className="px-4 py-2 text-left">Priority</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {request.items?.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2">
                                                    {item.product?.name || "N/A"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {item.category?.name || "N/A"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {item.quantity ? Math.round(item.quantity) : "N/A"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {item.unit?.name || "N/A"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <PriorityBadge priority={item.urgency_status?.name} />
                                                </td>
                                            </tr>
                                        ))}
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

export default ViewRequestModal; 