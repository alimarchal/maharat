import React from "react";
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
} from "@fortawesome/free-solid-svg-icons";

const ViewTaskModal = ({ isOpen, onClose, task }) => {
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
                                                                <th className="p-3 rounded-tl-xl rounded-bl-xl text-left">Item</th>
                                                                <th className="p-3 text-left">Category</th>
                                                                <th className="p-3 text-left">Quantity</th>
                                                                <th className="p-3 text-left">Unit</th>
                                                                <th className="p-3 rounded-tr-xl rounded-br-xl text-left">Priority</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {task.material_request.items.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td className="px-3 py-2">{item.product?.name || "N/A"}</td>
                                                                    <td className="px-3 py-2">{item.category?.name || "N/A"}</td>
                                                                    <td className="px-3 py-2">{Math.floor(item.quantity) || "N/A"}</td>
                                                                    <td className="px-3 py-2">{item.unit?.name || "N/A"}</td>
                                                                    <td className="px-3 py-2">
                                                                        <UrgencyBadge urgency={item.urgency_status?.name} />
                                                                    </td>
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
                                                                <th className="px-3 py-2 text-left rounded-tl-xl rounded-bl-xl">Item</th>
                                                                <th className="px-3 py-2 text-left">Category</th>
                                                                <th className="px-3 py-2 text-left">Quantity</th>
                                                                <th className="px-3 py-2 text-left">Unit</th>
                                                                <th className="px-3 py-2 text-left rounded-tr-xl rounded-br-xl">Description</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {task.rfq.items.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td className="px-3 py-2">{item.item_name || item.product?.name || "N/A"}</td>
                                                                    <td className="px-3 py-2">{item.category?.name || "N/A"}</td>
                                                                    <td className="px-3 py-2">{item.quantity ? parseFloat(item.quantity).toFixed(1) : "N/A"}</td>
                                                                    <td className="px-3 py-2">{item.unit?.name || "N/A"}</td>
                                                                    <td className="px-3 py-2">{item.description || "N/A"}</td>
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
                                                <span className="font-medium ml-2">{task.budget.fiscal_period?.period_name || "N/A"}</span>
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

                        {/* Approval Workflow Information */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm md:col-span-2">
                            <div className="flex items-center text-indigo-600 mb-4">
                                <FontAwesomeIcon icon={faListCheck} className="mr-3" />
                                <h3 className="text-lg font-semibold">
                                    Approval Workflow
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {/* Current Step */}
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

                                {/* Previous Approvals */}
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewTaskModal; 