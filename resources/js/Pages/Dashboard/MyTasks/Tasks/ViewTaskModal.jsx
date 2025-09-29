import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTimes,
    faUser,
    faBuilding,
    faListCheck,
    faCircleCheck,
    faCircleExclamation,
    faCircleXmark,
    faClock,
    faFileAlt,
    faImage,
} from "@fortawesome/free-solid-svg-icons";

const ViewTaskModal = ({ isOpen, onClose, task }) => {
    const [fiscalPeriodName, setFiscalPeriodName] = useState("");
    const [rfqCategoryName, setRfqCategoryName] = useState("");
    const [rfqDescription, setRfqDescription] = useState("");
    const [allDescriptions, setAllDescriptions] = useState([]);

    useEffect(() => {
        if (isOpen && task && task.budget && task.budget.fiscal_period_id) {
            // Fetch fiscal period name from API
            axios.get(`/api/v1/fiscal-periods/${task.budget.fiscal_period_id}`)
                .then(response => {
                    setFiscalPeriodName(response.data.data.period_name);
                })
                .catch(error => {
                    console.error("Error fetching fiscal period:", error);
                    setFiscalPeriodName(`Fiscal Period ID: ${task.budget.fiscal_period_id}`);
                });
        }
        
        if (isOpen && task && task.rfq && task.rfq.items && task.rfq.items.length > 0) {
            // Get the product_id from the first RFQ item
            const firstItem = task.rfq.items[0];
            if (firstItem.product_id) {
                // Fetch the product details from products table using product_id
                axios.get(`/api/v1/products/${firstItem.product_id}`)
                    .then(response => {
                        if (response.data.data) {
                            const product = response.data.data;
                            // Set the description from the products table
                            setRfqDescription(product.description);
                            
                            // Also fetch the category name using the product's category_id
                            if (product.category_id) {
                                return axios.get(`/api/v1/product-categories/${product.category_id}`);
                            }
                        }
                    })
                    .then(categoryResponse => {
                        if (categoryResponse && categoryResponse.data.data) {
                            setRfqCategoryName(categoryResponse.data.data.name);
                        }
                    })
                    .catch(error => {
                        console.error("Error fetching product or category:", error);
                    });
            }
        }

        // Fetch all descriptions for this request type
        if (isOpen && task) {
            const fetchAllDescriptions = async () => {
                try {
                    let requestId = null;
                    let requestType = null;

                    // Determine the request type and ID
                    if (task.material_request_id) {
                        requestId = task.material_request_id;
                        requestType = 'material_request';
                    } else if (task.rfq_id) {
                        requestId = task.rfq_id;
                        requestType = 'rfq';
                    } else if (task.purchase_order_id) {
                        requestId = task.purchase_order_id;
                        requestType = 'purchase_order';
                    } else if (task.payment_order_id) {
                        requestId = task.payment_order_id;
                        requestType = 'payment_order';
                    } else if (task.invoice_id) {
                        requestId = task.invoice_id;
                        requestType = 'invoice';
                    } else if (task.budget_id) {
                        requestId = task.budget_id;
                        requestType = 'budget';
                    } else if (task.request_budgets_id) {
                        requestId = task.request_budgets_id;
                        requestType = 'request_budgets';
                    }

                    if (requestId && requestType) {
                        // Fetch all tasks for this request
                        const response = await axios.get(`/api/v1/tasks?filter[${requestType}_id]=${requestId}&include=descriptions`);
                        if (response.data && response.data.data) {
                            // Collect all descriptions from all tasks
                            const descriptions = [];
                            response.data.data.forEach(taskItem => {
                                if (taskItem.descriptions && taskItem.descriptions.length > 0) {
                                    taskItem.descriptions.forEach(desc => {
                                        descriptions.push({
                                            ...desc,
                                            task_id: taskItem.id,
                                            task_order: taskItem.order_no
                                        });
                                    });
                                }
                            });
                            // Sort by task order and creation date
                            descriptions.sort((a, b) => {
                                if (a.task_order !== b.task_order) {
                                    return (a.task_order || 0) - (b.task_order || 0);
                                }
                                return new Date(a.created_at) - new Date(b.created_at);
                            });
                            setAllDescriptions(descriptions);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching all descriptions:", error);
                }
            };

            fetchAllDescriptions();
        }
    }, [isOpen, task]);

    if (!isOpen || !task) return null;

    // Status badge component
    const StatusBadge = ({ status }) => {
        let badgeClass = "px-3 py-1 rounded-full text-xs font-medium";
        let icon = null;

        switch (status?.toLowerCase()) {
            case "pending":
                badgeClass += " bg-yellow-100 text-yellow-800";
                icon = faCircleExclamation;
                break;
            case "approved":
                badgeClass += " bg-green-100 text-green-800";
                icon = faCircleCheck;
                break;
            case "rejected":
                badgeClass += " bg-red-100 text-red-800";
                icon = faCircleXmark;
                break;
            case "referred":
                badgeClass += " bg-blue-100 text-blue-800";
                icon = faCircleExclamation;
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

    // Urgency badge component
    const UrgencyBadge = ({ urgency }) => {
        let badgeClass = "px-3 py-1 rounded-full text-xs font-medium";

        switch (urgency?.toLowerCase()) {
            case "high":
                badgeClass += " bg-red-100 text-red-800";
                break;
            case "medium":
                badgeClass += " bg-yellow-100 text-yellow-800";
                break;
            case "low":
                badgeClass += " bg-green-100 text-green-800";
                break;
            default:
                badgeClass += " bg-gray-100 text-gray-800";
                break;
        }

        return <span className={badgeClass}>{urgency}</span>;
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[99999]">
            <div className="bg-white rounded-2xl w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-[#C7E7DE] text-[#2C323C] px-8 py-4 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold">
                                Task Details
                            </h2>
                            <p className="mt-1">Task #{task.id}</p>
                        </div>
                        <button onClick={onClose}>
                            <FontAwesomeIcon icon={faTimes} size="lg" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Task Summary Card */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
                        <div className="flex flex-wrap justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    {task.process?.title || "Task"}
                                </h3>
                                <p className="text-gray-500">
                                    Assigned on {task.assigned_at ? new Date(task.assigned_at).toLocaleDateString() : "N/A"}
                                </p>
                            </div>
                            <StatusBadge status={task.status} />
                        </div>
                    </div>

                    {/* Detailed Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Task Information */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center text-blue-600 mb-4">
                                <FontAwesomeIcon icon={faFileAlt} className="mr-3" />
                                <h3 className="text-lg font-semibold">
                                    Task Information
                                </h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Task Name:</span>
                                    <span className="font-medium">
                                        {task.process?.title || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Status:</span>
                                    <span className="font-medium">
                                        <StatusBadge status={task.status} />
                                    </span>
                                </div>
                                {/* Show description for all statuses - contains info from previous approver */}
                                {task.descriptions && task.descriptions.length > 0 ? (
                                    <div className="flex justify-between border-b border-gray-100 pb-2">
                                        <span className="text-gray-600">Description:</span>
                                        <span className="font-medium text-gray-800 text-right max-w-xs">
                                            {task.descriptions.map((desc, index) => desc.description).join(', ')}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between border-b border-gray-100 pb-2">
                                        <span className="text-gray-600">Description:</span>
                                        <span className="font-medium text-gray-500 text-right max-w-xs">
                                            No description provided
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Urgency:</span>
                                    <span className="font-medium">
                                        <UrgencyBadge urgency={task.urgency} />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Assignment Information */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center text-green-600 mb-4">
                                <FontAwesomeIcon icon={faUser} className="mr-3" />
                                <h3 className="text-lg font-semibold">
                                    Assignment Information
                                </h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Assigned To:</span>
                                    <span className="font-medium">
                                        {task.assigned_to_user?.name || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Assigned From:</span>
                                    <span className="font-medium">
                                        {task.assigned_from_user?.name || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Assigned Date:</span>
                                    <span className="font-medium">
                                        {task.assigned_at ? new Date(task.assigned_at).toLocaleDateString() : "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Request Details Based on Process Type */}
                        {task.process?.title && (
                            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm md:col-span-2">
                                <div className="flex items-center text-purple-600 mb-4">
                                    <FontAwesomeIcon icon={faFileAlt} className="mr-3" />
                                    <h3 className="text-lg font-semibold">
                                        {task.process.title} Details
                                    </h3>
                                </div>
                                
                                {/* Check if any detailed information is available */}
                                {!task.material_request && !task.rfq && !task.purchase_order && !task.payment_order && !task.invoice && !task.budget && !task.request_budget && !task.request_budget && (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 text-lg">
                                            No detailed information available for this {task.process.title.toLowerCase()}.
                                        </p>
                                        <p className="text-gray-400 text-sm mt-2">
                                            The request details may not be loaded or the request may not exist.
                                        </p>
                                    </div>
                                )}

                                {/* Material Request Details */}
                                {task.process.title === "Material Request" && task.material_request && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-gray-600">Request ID:</span>
                                                <span className="font-medium ml-2">MR-{task.material_request.id}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Requester:</span>
                                                <span className="font-medium ml-2">{task.material_request.requester?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Warehouse:</span>
                                                <span className="font-medium ml-2">{task.material_request.warehouse?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Department:</span>
                                                <span className="font-medium ml-2">{task.material_request.department?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Cost Center:</span>
                                                <span className="font-medium ml-2">{task.material_request.costCenter?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Expected Delivery:</span>
                                                <span className="font-medium ml-2">
                                                    {task.material_request.expected_delivery_date ? new Date(task.material_request.expected_delivery_date).toLocaleDateString() : "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Requested Items */}
                                        {task.material_request.items && task.material_request.items.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="font-semibold text-gray-700 mb-2">Requested Items:</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-[#C7E7DE] text-[#2C323C]">
                                                            <tr>
                                                                <th className="p-3 rounded-tl-xl rounded-bl-xl text-center">Item</th>
                                                                <th className="p-3 text-center">Category</th>
                                                                <th className="p-3 text-center">Quantity</th>
                                                                <th className="p-3 text-center">Unit</th>
                                                                <th className={`p-3 text-center ${task.material_request.items?.some(item => item.photo_url && item.photo_url.trim() !== '') ? '' : 'rounded-tr-xl rounded-br-xl'}`}>Priority</th>
                                                                {task.material_request.items?.some(item => item.photo_url && item.photo_url.trim() !== '') && (
                                                                    <th className="p-3 rounded-tr-xl rounded-br-xl text-center">Image</th>
                                                                )}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {task.material_request.items.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td className="px-3 py-2 text-center">{item.product?.name || "N/A"}</td>
                                                                    <td className="px-3 py-2 text-center">{item.category?.name || "N/A"}</td>
                                                                    <td className="px-3 py-2 text-center">{Math.floor(item.quantity) || "N/A"}</td>
                                                                    <td className="px-3 py-2 text-center">{item.unit?.name || "N/A"}</td>
                                                                    <td className="px-3 py-2 text-center">
                                                                        <UrgencyBadge urgency={item.urgency_status?.name} />
                                                                    </td>
                                                                    {task.material_request.items?.some(item => item.photo_url && item.photo_url.trim() !== '') && (
                                                                        <td className="px-3 py-2 text-center">
                                                                            {item.photo_url && item.photo_url.trim() !== '' && (
                                                                                <div className="flex justify-center">
                                                                                    <img
                                                                                        src={item.photo_url}
                                                                                        alt="Item Image"
                                                                                        className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                                                                        onClick={() => window.open(item.photo_url, '_blank')}
                                                                                        title="Click to view full size"
                                                                                        onError={(e) => {
                                                                                            e.target.style.display = 'none';
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                    )}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* RFQ Details */}
                                {task.process.title === "RFQ Approval" && task.rfq && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-gray-600">RFQ Number:</span>
                                                <span className="font-medium ml-2">{task.rfq.rfq_number || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Organization Name:</span>
                                                <span className="font-medium ml-2">{task.rfq.organization_name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Warehouse:</span>
                                                <span className="font-medium ml-2">{task.rfq.warehouse?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Department:</span>
                                                <span className="font-medium ml-2">{task.rfq.department?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Cost Center:</span>
                                                <span className="font-medium ml-2">{task.rfq.costCenter?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Created By:</span>
                                                <span className="font-medium ml-2">{task.rfq.requester?.name || "N/A"}</span>
                                            </div>
                                        </div>
                                        
                                        {/* RFQ Items */}
                                        {task.rfq.items && task.rfq.items.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="font-semibold text-gray-700 mb-2">RFQ Items:</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-[#C7E7DE] text-[#2C323C]">
                                                            <tr>
                                                                <th className="px-3 py-2 text-center rounded-tl-xl rounded-bl-xl">Item</th>
                                                                <th className="px-3 py-2 text-center">Category</th>
                                                                <th className="px-3 py-2 text-center">Quantity</th>
                                                                <th className={`px-3 py-2 text-center ${task.rfq.items?.some(item => item.attachment) ? '' : 'rounded-tr-xl rounded-br-xl'}`}>Unit</th>
                                                                {task.rfq.items?.some(item => item.attachment) && (
                                                                    <th className="px-3 py-2 text-center rounded-tr-xl rounded-br-xl">Attachment</th>
                                                                )}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {task.rfq.items.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td className="px-3 py-2 text-center">{item.item_name || item.product?.name || "N/A"}</td>
                                                                    <td className="px-3 py-2 text-center">
                                                                        {rfqCategoryName || "Loading..."}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center">{item.quantity ? parseFloat(item.quantity).toFixed(1) : "N/A"}</td>
                                                                    <td className="px-3 py-2 text-center">{item.unit?.name || item.product?.unit?.name || "N/A"}</td>
                                                                    {task.rfq.items?.some(item => item.attachment) && (
                                                                        <td className="px-3 py-2 text-center">
                                                                            {item.attachment ? (
                                                                                <div className="flex justify-center">
                                                                                    <img
                                                                                        src="/images/pdf-file.png"
                                                                                        alt="PDF"
                                                                                        className="w-4 h-4 cursor-pointer hover:opacity-80 transition-opacity"
                                                                                        onClick={() => {
                                                                                            let fileUrl = null;
                                                                                            if (typeof item.attachment === "string") {
                                                                                                fileUrl = `/storage/${item.attachment}`.replace("/storage/storage/", "/storage/");
                                                                                            } else if (typeof item.attachment === "object") {
                                                                                                if (item.attachment.url && item.attachment.url.startsWith("http")) {
                                                                                                    fileUrl = item.attachment.url;
                                                                                                } else {
                                                                                                    fileUrl = `/storage/${item.attachment.url || item.attachment.path || item.attachment}`.replace("/storage/storage/", "/storage/");
                                                                                                }
                                                                                            }
                                                                                            if (fileUrl) {
                                                                                                window.open(fileUrl, '_blank');
                                                                                            }
                                                                                        }}
                                                                                        title="View Attachment"
                                                                                    />
                                                                                </div>
                                                                            ) : null}
                                                                        </td>
                                                                    )}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Purchase Order Details */}
                                {task.process.title === "Purchase Order Approval" && task.purchase_order && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-gray-600">PO ID:</span>
                                                <span className="font-medium ml-2">PO-{task.purchase_order.id}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">PO Number:</span>
                                                <span className="font-medium ml-2">{task.purchase_order.purchase_order_no || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Supplier:</span>
                                                <span className="font-medium ml-2">{task.purchase_order.supplier?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Total Amount:</span>
                                                <span className="font-medium ml-2">{task.purchase_order.amount ? parseFloat(task.purchase_order.amount).toFixed(2) : "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Purchase Order Date:</span>
                                                <span className="font-medium ml-2">
                                                    {task.purchase_order.purchase_order_date ? new Date(task.purchase_order.purchase_order_date).toLocaleDateString() : "N/A"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Created By:</span>
                                                <span className="font-medium ml-2">
                                                    {task.purchase_order.created_by?.name || 
                                                     (task.purchase_order.user_id ? `User #${task.purchase_order.user_id}` : "N/A")}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Purchase Order Attachments */}
                                        {task.purchase_order.attachment && (
                                            <div className="mt-4">
                                                <h4 className="font-semibold text-gray-700 mb-2">Attachments:</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => {
                                                            let fileUrl = null;
                                                            if (typeof task.purchase_order.attachment === "string") {
                                                                fileUrl = `/storage/${task.purchase_order.attachment}`.replace("/storage/storage/", "/storage/");
                                                            } else if (typeof task.purchase_order.attachment === "object") {
                                                                if (task.purchase_order.attachment.url && task.purchase_order.attachment.url.startsWith("http")) {
                                                                    fileUrl = task.purchase_order.attachment.url;
                                                                } else {
                                                                    fileUrl = `/storage/${task.purchase_order.attachment.url || task.purchase_order.attachment.path || task.purchase_order.attachment}`.replace("/storage/storage/", "/storage/");
                                                                }
                                                            }
                                                            if (fileUrl) {
                                                                window.open(fileUrl, '_blank');
                                                            }
                                                        }}
                                                        className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                                                    >
                                                        <img
                                                            src="/images/pdf-file.png"
                                                            alt="PDF"
                                                            className="w-4 h-4"
                                                        />
                                                        <span>Purchase Order Document</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Purchase Order Items section removed - PurchaseOrder model doesn't have items */}
                                    </div>
                                )}

                                {/* Budget Request Details */}
                                {task.process.title === "Budget Request Approval" && task.request_budget && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-gray-600">Department:</span>
                                                <span className="font-medium ml-2">{task.request_budget.department?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Cost Center:</span>
                                                <span className="font-medium ml-2">{task.request_budget.cost_center?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Requested Amount:</span>
                                                <span className="font-medium ml-2">{task.request_budget.requested_amount || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Approved Amount:</span>
                                                <span className="font-medium ml-2">{task.request_budget.approved_amount || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Previous Year Budget:</span>
                                                <span className="font-medium ml-2">{task.request_budget.previous_year_budget_amount || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Revenue Planned:</span>
                                                <span className="font-medium ml-2">{task.request_budget.revenue_planned || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Urgency:</span>
                                                <span className="font-medium ml-2">{task.request_budget.urgency || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Status:</span>
                                                <span className="font-medium ml-2">{task.request_budget.status || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Fiscal Period:</span>
                                                <span className="font-medium ml-2">{task.request_budget.fiscal_period?.period_name || "N/A"}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Request Budget Attachments */}
                                        {task.request_budget.attachment_path && (
                                            <div className="mt-4">
                                                <h4 className="font-semibold text-gray-700 mb-2">Attachments:</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => {
                                                            let fileUrl = null;
                                                            if (typeof task.request_budget.attachment_path === "string") {
                                                                fileUrl = `/storage/${task.request_budget.attachment_path}`.replace("/storage/storage/", "/storage/");
                                                            } else if (typeof task.request_budget.attachment_path === "object") {
                                                                if (task.request_budget.attachment_path.url && task.request_budget.attachment_path.url.startsWith("http")) {
                                                                    fileUrl = task.request_budget.attachment_path.url;
                                                                } else {
                                                                    fileUrl = `/storage/${task.request_budget.attachment_path.url || task.request_budget.attachment_path.path || task.request_budget.attachment_path}`.replace("/storage/storage/", "/storage/");
                                                                }
                                                            }
                                                            if (fileUrl) {
                                                                window.open(fileUrl, '_blank');
                                                            }
                                                        }}
                                                        className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                                                    >
                                                        <img
                                                            src="/images/pdf-file.png"
                                                            alt="PDF"
                                                            className="w-4 h-4"
                                                        />
                                                        <span>Budget Request Document</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Total Budget Approval Details */}
                                {task.process.title === "Total Budget Approval" && task.budget && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-gray-600">Department:</span>
                                                <span className="font-medium ml-2">{task.budget.department?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Cost Center:</span>
                                                <span className="font-medium ml-2">{task.budget.cost_center?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Total Revenue Planned:</span>
                                                <span className="font-medium ml-2">{task.budget.total_revenue_planned || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Total Revenue Actual:</span>
                                                <span className="font-medium ml-2">{task.budget.total_revenue_actual || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Total Expense Planned:</span>
                                                <span className="font-medium ml-2">{task.budget.total_expense_planned || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Total Expense Actual:</span>
                                                <span className="font-medium ml-2">{task.budget.total_expense_actual || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Status:</span>
                                                <span className="font-medium ml-2">{task.budget.status || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Fiscal Period:</span>
                                                <span className="font-medium ml-2">
                                                    {fiscalPeriodName || "Loading..."}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Budget Items - Note: Budget model doesn't have items, it's a different structure */}
                                        {task.budget.budget_approval_transactions && task.budget.budget_approval_transactions.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="font-semibold text-gray-700 mb-2">Budget Approval Transactions:</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-[#C7E7DE] text-[#2C323C]">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left rounded-tl-xl rounded-bl-xl">Order</th>
                                                                <th className="px-3 py-2 text-left">Status</th>
                                                                <th className="px-3 py-2 text-left">Description</th>
                                                                <th className="px-3 py-2 text-left rounded-tr-xl rounded-br-xl">Assigned To</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {task.budget.budget_approval_transactions.map((transaction, index) => (
                                                                <tr key={index}>
                                                                    <td className="px-3 py-2">{transaction.order || "N/A"}</td>
                                                                    <td className="px-3 py-2">{transaction.status || "N/A"}</td>
                                                                    <td className="px-3 py-2">{transaction.description || "N/A"}</td>
                                                                    <td className="px-3 py-2">{transaction.assigned_user?.name || "N/A"}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Payment Order Details */}
                                {task.process.title === "Payment Order Approval" && task.payment_order && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-gray-600">Payment Order Number:</span>
                                                <span className="font-medium ml-2">{task.payment_order.payment_order_number || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Purchase Order:</span>
                                                <span className="font-medium ml-2">{task.payment_order.purchase_order?.purchase_order_no || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Total Amount:</span>
                                                <span className="font-medium ml-2">{task.payment_order.total_amount ? parseFloat(task.payment_order.total_amount).toFixed(2) : "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Paid Amount:</span>
                                                <span className="font-medium ml-2">{task.payment_order.paid_amount ? parseFloat(task.payment_order.paid_amount).toFixed(2) : "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Payment Type:</span>
                                                <span className="font-medium ml-2">{task.payment_order.payment_type || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Issue Date:</span>
                                                <span className="font-medium ml-2">
                                                    {task.payment_order.issue_date ? new Date(task.payment_order.issue_date).toLocaleDateString() : "N/A"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Due Date:</span>
                                                <span className="font-medium ml-2">
                                                    {task.payment_order.due_date ? new Date(task.payment_order.due_date).toLocaleDateString() : "N/A"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Created By:</span>
                                                <span className="font-medium ml-2">
                                                    {task.payment_order.user?.name || 
                                                     (task.payment_order.user_id ? `User #${task.payment_order.user_id}` : "N/A")}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Payment Order Description */}
                                        {task.payment_order.description && (
                                            <div className="mt-4">
                                                <h4 className="font-semibold text-gray-700 mb-2">Description:</h4>
                                                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                    {task.payment_order.description}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Invoice Details */}
                                {task.process.title === "Maharat Invoice Approval" && task.invoice && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-gray-600">Invoice Number:</span>
                                                <span className="font-medium ml-2">{task.invoice.invoice_number || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Client:</span>
                                                <span className="font-medium ml-2">{task.invoice.client?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Representative:</span>
                                                <span className="font-medium ml-2">{task.invoice.representative_name || task.invoice.representative?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Status:</span>
                                                <span className="font-medium ml-2">{task.invoice.status || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Issue Date:</span>
                                                <span className="font-medium ml-2">{task.invoice.issue_date ? new Date(task.invoice.issue_date).toLocaleDateString() : "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Subtotal:</span>
                                                <span className="font-medium ml-2">{task.invoice.subtotal ? parseFloat(task.invoice.subtotal).toFixed(2) : "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Discount:</span>
                                                <span className="font-medium ml-2">{task.invoice.discount_amount ? parseFloat(task.invoice.discount_amount).toFixed(2) : "0.00"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Tax Amount:</span>
                                                <span className="font-medium ml-2">{task.invoice.tax_amount ? parseFloat(task.invoice.tax_amount).toFixed(2) : "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Total Amount:</span>
                                                <span className="font-medium ml-2">{task.invoice.total_amount ? parseFloat(task.invoice.total_amount).toFixed(2) : "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Currency:</span>
                                                <span className="font-medium ml-2">{task.invoice.currency || "N/A"}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Invoice Items */}
                                        {task.invoice.items && task.invoice.items.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="font-semibold text-gray-700 mb-2">Invoice Items:</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-[#C7E7DE] text-[#2C323C]">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left rounded-tl-xl rounded-bl-xl">Item</th>
                                                                <th className="px-3 py-2 text-left">Quantity</th>
                                                                <th className="px-3 py-2 text-left">Unit Price</th>
                                                                <th className="px-3 py-2 text-left">Subtotal</th>
                                                                <th className="px-3 py-2 text-left">Tax Amount</th>
                                                                <th className="px-3 py-2 text-left rounded-tr-xl rounded-br-xl">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {task.invoice.items.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td className="px-3 py-2">{item.name || "N/A"}</td>
                                                                    <td className="px-3 py-2">{item.quantity ? parseFloat(item.quantity).toFixed(2) : "N/A"}</td>
                                                                    <td className="px-3 py-2">{item.unit_price ? parseFloat(item.unit_price).toFixed(2) : "N/A"}</td>
                                                                    <td className="px-3 py-2">{item.subtotal ? parseFloat(item.subtotal).toFixed(2) : "N/A"}</td>
                                                                    <td className="px-3 py-2">{item.tax_amount ? parseFloat(item.tax_amount).toFixed(2) : "N/A"}</td>
                                                                    <td className="px-3 py-2">{item.total ? parseFloat(item.total).toFixed(2) : "N/A"}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot className="bg-gray-50 font-semibold">
                                                            <tr>
                                                                <td colSpan="3" className="px-3 py-2 text-right">Total:</td>
                                                                <td className="px-3 py-2">{task.invoice.subtotal ? parseFloat(task.invoice.subtotal).toFixed(2) : "N/A"}</td>
                                                                <td className="px-3 py-2">{task.invoice.tax_amount ? parseFloat(task.invoice.tax_amount).toFixed(2) : "N/A"}</td>
                                                                <td className="px-3 py-2">{task.invoice.total_amount ? parseFloat(task.invoice.total_amount).toFixed(2) : "N/A"}</td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Approval Workflow Information - Commented out as not needed */}
                        {/* <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm md:col-span-2">
                            <div className="flex items-center text-indigo-600 mb-4">
                                <FontAwesomeIcon icon={faListCheck} className="mr-3" />
                                <h3 className="text-lg font-semibold">
                                    Approval Workflow
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center mb-2">
                                        <FontAwesomeIcon icon={faCircleExclamation} className="text-blue-600 mr-2" />
                                        <span className="font-semibold text-blue-800">Current Step</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Step Number:</span>
                                            <span className="font-medium">{task.order_no || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Assigned To:</span>
                                            <span className="font-medium">{task.assigned_to_user?.name || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Status:</span>
                                            <span className="font-medium">
                                                <StatusBadge status={task.status} />
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center mb-3">
                                        <FontAwesomeIcon icon={faCircleCheck} className="text-green-600 mr-2" />
                                        <span className="font-semibold text-green-800">Previous Approvals</span>
                                    </div>
                                    <div className="space-y-2">
                                        {task.material_request && (
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-700 mb-1">Material Request Approvals:</div>
                                                <div className="pl-4 space-y-1">
                                                    {task.material_request.approval_transactions?.map((approval, index) => (
                                                        <div key={index} className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-600">
                                                                {approval.assigned_to_user?.name || "Unknown User"}
                                                            </span>
                                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                                approval.status === 'Approve' 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : approval.status === 'Reject'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {approval.status}
                                                            </span>
                                                        </div>
                                                    )) || (
                                                        <span className="text-gray-500 italic">No previous approvals</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {task.rfq && (
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-700 mb-1">RFQ Approvals:</div>
                                                <div className="pl-4 space-y-1">
                                                    {task.rfq.approval_transactions?.map((approval, index) => (
                                                        <div key={index} className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-600">
                                                                {approval.assigned_to_user?.name || "Unknown User"}
                                                            </span>
                                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                                approval.status === 'Approve' 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : approval.status === 'Reject'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {approval.status}
                                                            </span>
                                                        </div>
                                                    )) || (
                                                        <span className="text-gray-500 italic">No previous approvals</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {!task.material_request && !task.rfq && (
                                            <span className="text-gray-500 italic">No approval history available</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewTaskModal; 