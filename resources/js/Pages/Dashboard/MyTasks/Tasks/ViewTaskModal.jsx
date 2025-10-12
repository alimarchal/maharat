import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTimes,
    faUser,
    faCircleCheck,
    faCircleExclamation,
    faCircleXmark,
    faFileAlt,
} from "@fortawesome/free-solid-svg-icons";

const ViewTaskModal = ({ isOpen, onClose, task }) => {
    const [fiscalPeriodName, setFiscalPeriodName] = useState("");
    const [rfqCategoryName, setRfqCategoryName] = useState("");
    const [rfqDescription, setRfqDescription] = useState("");
    const [allDescriptions, setAllDescriptions] = useState([]);
    const [completeTaskData, setCompleteTaskData] = useState(null);
    const [previouslyDelivered, setPreviouslyDelivered] = useState({});
    const [rfqItems, setRfqItems] = useState([]);

    // Fetch complete task data with all includes when modal opens
    useEffect(() => {
        if (isOpen && task && task.id) {
            const fetchCompleteTaskData = async () => {
                try {
                    console.log("=== FETCHING COMPLETE TASK DATA ===", {
                        taskId: task.id,
                        currentTaskData: task,
                        processTitle: task.process?.title
                    });

                    const response = await axios.get(
                        `/api/v1/tasks/${task.id}?include=processStep,process,assignedFromUser,assignedToUser,descriptions,material_request,material_request.items,material_request.items.product,material_request.items.unit,material_request.items.category,material_request.items.urgencyStatus,material_request.requester,material_request.warehouse,material_request.department,material_request.costCenter,rfq,rfq.items,rfq.items.product,rfq.items.unit,rfq.items.category,rfq.items.status,rfq.requester,rfq.warehouse,rfq.department,rfq.costCenter,purchase_order,purchase_order.supplier,purchase_order.user,payment_order,payment_order.supplier,payment_order.user,payment_order.purchase_order,invoice,invoice.items,invoice.client,invoice.representative,budget,budget.department,budget.costCenter,budget_approval_transaction,request_budget,request_budget.department,request_budget.costCenter,request_budget.fiscalPeriod,grn,grn.user,grn.quotation,grn.purchaseOrder,grn.approvalTransactions,grn.approvalTransactions.assignedToUser`
                    );
                    
                    let taskData = response.data.data;
                    
                    // If this is a GRN task, fetch all needed data in parallel
                    if (taskData.process?.title === "Short Delivery Adjustment Approval") {
                        const promises = [];
                        
                        // If no GRN data, fetch it
                        if (!taskData.grn && taskData.grn_id) {
                            promises.push(
                                axios.get(`/api/v1/grns/${taskData.grn_id}?include=user,quotation,purchaseOrder,approvalTransactions,approvalTransactions.assignedToUser`)
                                    .then(response => ({ type: 'grn', data: response.data.data }))
                                    .catch(error => ({ type: 'grn', error }))
                            );
                        }
                        
                        // If no RFQ items, fetch them from purchase order
                        let rfqItems = taskData.rfq?.items || [];
                        if (rfqItems.length === 0 && taskData.grn?.purchase_order_id) {
                            promises.push(
                                axios.get(`/api/v1/purchase-orders/${taskData.grn.purchase_order_id}?include=rfq,rfq.items,rfq.items.product,rfq.items.unit,rfq.items.category`)
                                    .then(response => ({ type: 'rfq', data: response.data.data?.rfq?.items || [] }))
                                    .catch(error => ({ type: 'rfq', error }))
                            );
                        }
                        
                        // Always fetch existing GRNs for previously delivered calculation
                        if (taskData.grn?.purchase_order_id) {
                            promises.push(
                                axios.get(`/api/v1/grns?filter[purchase_order_id]=${taskData.grn.purchase_order_id}&include=receiveGoods`)
                                    .then(response => ({ type: 'existingGrns', data: response.data.data || [] }))
                                    .catch(error => ({ type: 'existingGrns', error }))
                            );
                        }
                        
                        // Execute all promises in parallel
                        if (promises.length > 0) {
                            console.log("=== FETCHING GRN DATA IN PARALLEL ===");
                            const results = await Promise.all(promises);
                            
                            // Process results
                            results.forEach(result => {
                                if (result.type === 'grn' && result.data) {
                                    taskData.grn = result.data;
                                } else if (result.type === 'rfq' && result.data) {
                                    rfqItems = result.data;
                                } else if (result.type === 'existingGrns' && result.data) {
                                    // Process existing GRNs immediately
                                    processExistingGRNs(result.data, rfqItems);
                                }
                            });
                        }
                    }
                    
                    setCompleteTaskData(taskData);
                    
                    console.log("=== COMPLETE TASK DATA LOADED ===", {
                        taskId: taskData.id,
                        grnId: taskData.grn_id,
                        grnData: taskData.grn,
                        grnApprovalTransactions: taskData.grn?.approval_transactions,
                        processTitle: taskData.process?.title,
                        materialRequestData: taskData.material_request,
                        materialRequestId: taskData.material_request_id
                    });
                } catch (error) {
                    console.error("Error fetching complete task data:", error);
                    // Fallback to original task data if fetch fails
                    setCompleteTaskData(task);
                }
            };

            fetchCompleteTaskData();
        }
    }, [isOpen, task]);

    const processExistingGRNs = (existingGRNs, currentRfqItems) => {
        try {
            console.log('Processing existing GRNs for ViewTaskModal:', existingGRNs);
            console.log('Current RFQ Items:', currentRfqItems);
            
            // Check if there are any partially delivered GRNs
            const hasPartiallyDelivered = existingGRNs.some(grn => {
                if (grn.status === 'Partially Delivered') {
                    return true;
                }
                
                if (grn.receive_goods && grn.receive_goods.length > 0) {
                    return grn.receive_goods.some(receiveGood => {
                        const delivered = parseFloat(receiveGood.quantity_delivered) || 0;
                        const quoted = parseFloat(receiveGood.quantity_quoted) || 0;
                        return delivered > 0 && delivered < quoted;
                    });
                }
                
                return false;
            });
            
            if (hasPartiallyDelivered && currentRfqItems.length > 0) {
                // Calculate total delivered quantities for each item
                const deliveredQuantities = {};
                
                // Use the GRN quantity field directly (not receive_goods data)
                existingGRNs.forEach(grn => {
                    if (currentRfqItems.length > 0) {
                        const itemId = currentRfqItems[0].id;
                        const grnQuantity = parseFloat(grn.quantity) || 0;
                        deliveredQuantities[itemId] = grnQuantity;
                        
                        console.log('Processing GRN quantity for ViewTaskModal:', {
                            itemId,
                            grnQuantity,
                            grnId: grn.id,
                            grnStatus: grn.status
                        });
                    }
                });
                
                console.log('Delivered quantities calculated for ViewTaskModal:', deliveredQuantities);
                
                // Update RFQ items to show remaining quantities instead of original ordered quantities
                const updatedRfqItems = currentRfqItems.map(item => {
                    const deliveredQty = deliveredQuantities[item.id] || 0;
                    const originalQty = parseInt(item.quantity) || 0;
                    const remainingQty = originalQty - deliveredQty;
                    
                    return {
                        ...item,
                        original_quantity: originalQty, // Store original quantity
                        quantity: remainingQty > 0 ? remainingQty : 0 // Show remaining quantity
                    };
                });
                
                console.log('Updated RFQ items for ViewTaskModal:', updatedRfqItems);
                
                // Update the RFQ items with remaining quantities
                setRfqItems(updatedRfqItems);
                
                // Store previously delivered quantities
                setPreviouslyDelivered(deliveredQuantities);
                
                console.log('Processed existing GRNs for ViewTaskModal:', {
                    existingGRNs,
                    deliveredQuantities,
                    updatedRfqItems,
                    hasPartiallyDelivered
                });
            } else {
                // No partial delivery, use original RFQ items
                setRfqItems(currentRfqItems);
                setPreviouslyDelivered({});
            }
        } catch (error) {
            console.error('Error processing existing GRNs for ViewTaskModal:', error);
            // Fallback to original RFQ items
            setRfqItems(currentRfqItems);
            setPreviouslyDelivered({});
        }
    };

    const loadExistingGRNs = async (purchaseOrderId, currentRfqItems) => {
        try {
            const response = await axios.get(`/api/v1/grns?filter[purchase_order_id]=${purchaseOrderId}&include=receiveGoods`);
            const existingGRNs = response.data.data || [];
            
            console.log('Existing GRNs for ViewTaskModal:', existingGRNs);
            console.log('Current RFQ Items:', currentRfqItems);
            
            // Check if there are any partially delivered GRNs
            const hasPartiallyDelivered = existingGRNs.some(grn => {
                if (grn.status === 'Partially Delivered') {
                    return true;
                }
                
                if (grn.receive_goods && grn.receive_goods.length > 0) {
                    return grn.receive_goods.some(receiveGood => {
                        const delivered = parseFloat(receiveGood.quantity_delivered) || 0;
                        const quoted = parseFloat(receiveGood.quantity_quoted) || 0;
                        return delivered > 0 && delivered < quoted;
                    });
                }
                
                return false;
            });
            
            if (hasPartiallyDelivered && currentRfqItems.length > 0) {
                // Calculate total delivered quantities for each item
                const deliveredQuantities = {};
                
                // Use the GRN quantity field directly (not receive_goods data)
                existingGRNs.forEach(grn => {
                    if (currentRfqItems.length > 0) {
                        const itemId = currentRfqItems[0].id;
                        const grnQuantity = parseFloat(grn.quantity) || 0;
                        deliveredQuantities[itemId] = grnQuantity;
                        
                        console.log('Processing GRN quantity for ViewTaskModal:', {
                            itemId,
                            grnQuantity,
                            grnId: grn.id,
                            grnStatus: grn.status
                        });
                    }
                });
                
                console.log('Delivered quantities calculated for ViewTaskModal:', deliveredQuantities);
                
                // Update RFQ items to show remaining quantities instead of original ordered quantities
                const updatedRfqItems = currentRfqItems.map(item => {
                    const deliveredQty = deliveredQuantities[item.id] || 0;
                    const originalQty = parseInt(item.quantity) || 0;
                    const remainingQty = originalQty - deliveredQty;
                    
                    return {
                        ...item,
                        original_quantity: originalQty, // Store original quantity
                        quantity: remainingQty > 0 ? remainingQty : 0 // Show remaining quantity
                    };
                });
                
                console.log('Updated RFQ items for ViewTaskModal:', updatedRfqItems);
                
                // Update the RFQ items with remaining quantities
                setRfqItems(updatedRfqItems);
                
                // Store previously delivered quantities
                setPreviouslyDelivered(deliveredQuantities);
                
                console.log('Loaded existing GRNs for ViewTaskModal:', {
                    purchaseOrderId,
                    existingGRNs,
                    deliveredQuantities,
                    updatedRfqItems,
                    hasPartiallyDelivered
                });
            } else {
                // No partial delivery, use original RFQ items
                setRfqItems(currentRfqItems);
                setPreviouslyDelivered({});
            }
        } catch (error) {
            console.error('Error loading existing GRNs for ViewTaskModal:', error);
            // Fallback to original RFQ items
            setRfqItems(currentRfqItems);
            setPreviouslyDelivered({});
        }
    };

    useEffect(() => {
        // Use completeTaskData if available, otherwise fallback to original task
        const currentTask = completeTaskData || task;
        
        if (isOpen && currentTask && currentTask.budget && currentTask.budget.fiscal_period_id) {
            // Fetch fiscal period name from API
            axios.get(`/api/v1/fiscal-periods/${currentTask.budget.fiscal_period_id}`)
                .then(response => {
                    setFiscalPeriodName(response.data.data.period_name);
                })
                .catch(error => {
                    console.error("Error fetching fiscal period:", error);
                    setFiscalPeriodName(`Fiscal Period ID: ${currentTask.budget.fiscal_period_id}`);
                });
        }
        
        if (isOpen && currentTask && currentTask.rfq && currentTask.rfq.items && currentTask.rfq.items.length > 0) {
            // Get the product_id from the first RFQ item
            const firstItem = currentTask.rfq.items[0];
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
        if (isOpen && currentTask) {
            const fetchAllDescriptions = async () => {
                try {
                    let requestId = null;
                    let requestType = null;

                    // Determine the request type and ID
                    if (currentTask.material_request_id) {
                        requestId = currentTask.material_request_id;
                        requestType = 'material_request';
                    } else if (currentTask.rfq_id) {
                        requestId = currentTask.rfq_id;
                        requestType = 'rfq';
                    } else if (currentTask.purchase_order_id) {
                        requestId = currentTask.purchase_order_id;
                        requestType = 'purchase_order';
                    } else if (currentTask.payment_order_id) {
                        requestId = currentTask.payment_order_id;
                        requestType = 'payment_order';
                    } else if (currentTask.invoice_id) {
                        requestId = currentTask.invoice_id;
                        requestType = 'invoice';
                    } else if (currentTask.budget_id) {
                        requestId = currentTask.budget_id;
                        requestType = 'budget';
                    } else if (currentTask.request_budgets_id) {
                        requestId = currentTask.request_budgets_id;
                        requestType = 'request_budgets';
                    } else if (currentTask.grn_id) {
                        requestId = currentTask.grn_id;
                        requestType = 'grn';
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
    }, [isOpen, task, completeTaskData]);

    if (!isOpen || !task) return null;

    // Use completeTaskData if available, otherwise fallback to original task
    const currentTask = completeTaskData || task;

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
                            <p className="mt-1">Task #{currentTask.id}</p>
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
                                    {currentTask.process?.title || "Task"}
                                </h3>
                                <p className="text-gray-500">
                                    Assigned on {currentTask.assigned_at ? new Date(currentTask.assigned_at).toLocaleDateString() : "N/A"}
                                </p>
                            </div>
                            <StatusBadge status={currentTask.status} />
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
                                        {currentTask.process?.title || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Status:</span>
                                    <span className="font-medium">
                                        <StatusBadge status={currentTask.status} />
                                    </span>
                                </div>
                                {/* Show description from previous approvers for Pending/Rejected statuses */}
                                {(() => {
                                    // For Pending/Rejected statuses, show descriptions from previous approvers
                                    if ((currentTask.status === 'Pending' || currentTask.status === 'Rejected') && allDescriptions.length > 0) {
                                        // Filter descriptions from previous tasks (lower order numbers)
                                        const previousDescriptions = allDescriptions.filter(desc => 
                                            desc.task_order < (currentTask.order_no || 0)
                                        );
                                        
                                        if (previousDescriptions.length > 0) {
                                            return (
                                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                                    <span className="text-gray-600">Description:</span>
                                                    <span className="font-medium text-gray-800 text-right max-w-xs">
                                                        {previousDescriptions.map((desc, index) => desc.description).join(', ')}
                                                    </span>
                                                </div>
                                            );
                                        }
                                    }
                                    
                                    // For other statuses or when no previous descriptions, show current task descriptions
                                    if (currentTask.descriptions && currentTask.descriptions.length > 0) {
                                        return (
                                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-gray-600">Description:</span>
                                                <span className="font-medium text-gray-800 text-right max-w-xs">
                                                    {currentTask.descriptions.map((desc, index) => desc.description).join(', ')}
                                                </span>
                                            </div>
                                        );
                                    }
                                    
                                    // No description to show
                                    return null;
                                })()}
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Urgency:</span>
                                    <span className="font-medium">
                                        <UrgencyBadge urgency={currentTask.urgency} />
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
                                        {currentTask.assigned_to_user?.name || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Assigned From:</span>
                                    <span className="font-medium">
                                        {currentTask.assigned_from_user?.name || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Assigned Date:</span>
                                    <span className="font-medium">
                                        {currentTask.assigned_at ? new Date(currentTask.assigned_at).toLocaleDateString() : "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Request Details Based on Process Type */}
                        {currentTask.process?.title && (
                            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm md:col-span-2">
                                <div className="flex items-center text-purple-600 mb-4">
                                    <FontAwesomeIcon icon={faFileAlt} className="mr-3" />
                                    <h3 className="text-lg font-semibold">
                                        {currentTask.process.title} Details
                                    </h3>
                                </div>
                                
                                {/* Check if any detailed information is available */}
                                {!currentTask.material_request && !currentTask.rfq && !currentTask.purchase_order && !currentTask.payment_order && !currentTask.invoice && !currentTask.budget && !currentTask.request_budget && !currentTask.grn && (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 text-lg">
                                            No detailed information available for this {currentTask.process.title.toLowerCase()}.
                                        </p>
                                        <p className="text-gray-400 text-sm mt-2">
                                            The request details may not be loaded or the request may not exist.
                                        </p>
                                    </div>
                                )}

                                {/* Material Request Details */}
                                {currentTask.process.title === "Material Request Approval" && currentTask.material_request && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-gray-600">Request ID:</span>
                                                <span className="font-medium ml-2">MR-{currentTask.material_request.id}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Requester:</span>
                                                <span className="font-medium ml-2">{currentTask.material_request.requester?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Warehouse:</span>
                                                <span className="font-medium ml-2">{currentTask.material_request.warehouse?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Department:</span>
                                                <span className="font-medium ml-2">{currentTask.material_request.department?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Cost Center:</span>
                                                <span className="font-medium ml-2">{currentTask.material_request.costCenter?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Expected Delivery:</span>
                                                <span className="font-medium ml-2">
                                                    {currentTask.material_request.expected_delivery_date ? new Date(currentTask.material_request.expected_delivery_date).toLocaleDateString('en-GB') : "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Requested Items */}
                                        {currentTask.material_request.items && currentTask.material_request.items.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="font-semibold text-gray-700 mb-2">Requested Items:</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-[#C7E7DE] text-[#2C323C]">
                                                            <tr>
                                                                <th className="p-3 rounded-tl-xl rounded-bl-xl text-center">Item</th>
                                                                <th className="p-3 text-center">Category</th>
                                                                <th className="p-3 text-center">Description</th>
                                                                <th className="p-3 text-center">Quantity</th>
                                                                <th className="p-3 text-center">Unit</th>
                                                                <th className={`p-3 text-center ${currentTask.material_request.items?.some(item => item.photo_url && item.photo_url.trim() !== '') ? '' : 'rounded-tr-xl rounded-br-xl'}`}>Priority</th>
                                                                {currentTask.material_request.items?.some(item => item.photo_url && item.photo_url.trim() !== '') && (
                                                                    <th className="p-3 rounded-tr-xl rounded-br-xl text-center">Image</th>
                                                                )}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {currentTask.material_request.items.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td className="px-3 py-2 text-center">{item.product?.name || "N/A"}</td>
                                                                    <td className="px-3 py-2 text-center">{item.category?.name || "N/A"}</td>
                                                                    <td className="px-3 py-2 text-center">{item?.description || "N/A"}</td>
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
                                {currentTask.process.title === "RFQ Approval" && currentTask.rfq && (
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
                                {currentTask.process.title === "Purchase Order Approval" && currentTask.purchase_order && (
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
                                                <span className="text-gray-600">Amount:</span>
                                                <span className="font-medium ml-2">{task.purchase_order.amount ? parseFloat(task.purchase_order.amount).toFixed(2) : "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">VAT Amount:</span>
                                                <span className="font-medium ml-2">{task.purchase_order.vat_amount ? parseFloat(task.purchase_order.vat_amount).toFixed(2) : "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Total Amount:</span>
                                                <span className="font-medium ml-2">
                                                    {task.purchase_order.amount && task.purchase_order.vat_amount 
                                                        ? (parseFloat(task.purchase_order.amount) + parseFloat(task.purchase_order.vat_amount)).toFixed(2)
                                                        : "N/A"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Purchase Order Date:</span>
                                                <span className="font-medium ml-2">
                                                    {task.purchase_order.purchase_order_date ? new Date(task.purchase_order.purchase_order_date).toLocaleDateString() : "N/A"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Supplier:</span>
                                                <span className="font-medium ml-2">{task.purchase_order.supplier?.name || "N/A"}</span>
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
                                {currentTask.process.title === "Budget Request Approval" && currentTask.request_budget && (
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
                                {currentTask.process.title === "Total Budget Approval" && currentTask.budget && (
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
                                {currentTask.process.title === "Payment Order Approval" && currentTask.payment_order && (
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
                                                <span className="text-gray-600">Amount:</span>
                                                <span className="font-medium ml-2">{task?.payment_order?.purchase_order?.amount ? parseFloat(task?.payment_order?.purchase_order?.amount).toFixed(2) : "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">VAT Amount:</span>
                                                <span className="font-medium ml-2">{task?.payment_order?.purchase_order?.vat_amount ? parseFloat(task?.payment_order?.purchase_order?.vat_amount).toFixed(2) : "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Total Amount:</span>
                                                <span className="font-medium ml-2">
                                                    {task?.payment_order?.purchase_order?.amount && task?.payment_order?.purchase_order?.vat_amount 
                                                        ? (parseFloat(task?.payment_order?.purchase_order?.amount) + parseFloat(task?.payment_order?.purchase_order?.vat_amount)).toFixed(2)
                                                        : "N/A"}
                                                </span>
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
                                {currentTask.process.title === "Maharat Invoice Approval" && currentTask.invoice && (
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

                                {/* GRN Short Delivery Adjustment Approval Details */}
                                {currentTask.process.title === "Short Delivery Adjustment Approval" && currentTask.grn && (
                                    <div className="space-y-4">
                                        {/* GRN Info - Matching other task formats */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-gray-600">GRN Number:</span>
                                                <span className="font-medium ml-2">{currentTask.grn.grn_number || "N/A"}</span>
                                            </div>
                                                <div>
                                                    <span className="text-gray-600">Delivery Date:</span>
                                                    <span className="font-medium ml-2">
                                                        {currentTask.grn.delivery_date ? new Date(currentTask.grn.delivery_date).toLocaleDateString('en-GB') : "N/A"}
                                                    </span>
                                                </div>
                                        </div>

                                        {/* GRN Items Table - Matching CreateGRNModal format */}
                                        {(rfqItems.length > 0) && (
                                            <div className="mt-4">
                                                <h4 className="font-semibold text-gray-700 mb-2">GRN Items:</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-[#C7E7DE] text-[#2C323C]">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left rounded-tl-xl rounded-bl-xl">ID #</th>
                                                                <th className="px-3 py-2 text-left">Item Name</th>
                                                                <th className="px-3 py-2 text-left">Description</th>
                                                                <th className="px-3 py-2 text-left">Brand</th>
                                                                <th className="px-3 py-2 text-left">Unit</th>
                                                                <th className="px-3 py-2 text-center">Original Quantity</th>
                                                                <th className="px-3 py-2 text-center rounded-tr-xl rounded-br-xl">Delivered Quantity</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {rfqItems.map((item, index) => {
                                                                const orderedQty = parseInt(item.quantity) || 0;
                                                                const originalQty = parseInt(item.original_quantity || item.quantity) || 0;
                                                                const additionalQty = parseInt(currentTask.grn?.quantity) || 0;
                                                                const previouslyDeliveredQty = previouslyDelivered[item.id] || 0;
                                                                
                                                                // Debug unit data
                                                                console.log("Unit debug for item:", item.id, {
                                                                    unit: item.unit,
                                                                    unit_id: item.unit_id,
                                                                    unitName: item.unit?.name,
                                                                    product: item.product,
                                                                    productUnit: item.product?.unit
                                                                });
                                                                
                                                                return (
                                                                    <tr key={item.id}>
                                                                        <td className="px-3 py-2">{index + 1}</td>
                                                                        <td className="px-3 py-2">
                                                                            {item.item_name || item.product?.name || "N/A"}
                                                                        </td>
                                                                        <td className="px-3 py-2">
                                                                            {item.description || item.product?.description || "N/A"}
                                                                        </td>
                                                                        <td className="px-3 py-2">
                                                                            {item.brand || "N/A"}
                                                                        </td>
                                                                        <td className="px-3 py-2">
                                                                            {item.unit?.name || item.product?.unit?.name || (item.unit_id ? `Unit ${item.unit_id}` : "N/A")}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center">{originalQty}</td>
                                                                        <td className="px-3 py-2 text-center">{previouslyDeliveredQty}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
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