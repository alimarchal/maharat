import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTimes,
    faUser,
    faCircleCheck,
    faCircleExclamation,
    faCircleXmark,
    faFileAlt,
    faRemove,
} from "@fortawesome/free-solid-svg-icons";
import PurchaseOrderPDF from "../../ProcurementCenter/PurchaseOrder/PurchaseOrderPDF";
import RFQPDF from "../../ProcurementCenter/RFQ/RFQPDF";

const ViewTaskModal = ({ isOpen, onClose, task }) => {
    const [fiscalPeriodName, setFiscalPeriodName] = useState("");
    const [rfqCategoryName, setRfqCategoryName] = useState("");
    const [rfqDescription, setRfqDescription] = useState("");
    const [allDescriptions, setAllDescriptions] = useState([]);
    const [completeTaskData, setCompleteTaskData] = useState(null);
    const [previouslyDelivered, setPreviouslyDelivered] = useState({});
    const [rfqItems, setRfqItems] = useState([]);
    const [movingToBudgetBalance, setMovingToBudgetBalance] = useState(null); // For destination (Moving To)
    const [movedFromBudgetBalance, setMovedFromBudgetBalance] = useState(null); // For source (Moved From)
    
    // PDF generation states
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState(null);
    const [savedPdfUrl, setSavedPdfUrl] = useState(null);
    
    // RFQ PDF generation states
    const [isGeneratingRFQPDF, setIsGeneratingRFQPDF] = useState(false);
    const [selectedRFQId, setSelectedRFQId] = useState(null);
    const [savedRFQPdfUrl, setSavedRFQPdfUrl] = useState(null);
    
    // Ref for moved from sub cost center name element (removed cleaning code - now displays source directly)
    const destinationSubCostCenterRef = useRef(null);

    // Fetch complete task data with all includes when modal opens
    useEffect(() => {
        if (isOpen && task && task.id) {
            const fetchCompleteTaskData = async () => {
                try {

                    const response = await axios.get(
                        `/api/v1/tasks/${task.id}?include=processStep,process,assignedFromUser,assignedToUser,descriptions,material_request,material_request.items,material_request.items.product,material_request.items.unit,material_request.items.category,material_request.items.urgencyStatus,material_request.requester,material_request.warehouse,material_request.department,material_request.costCenter,rfq,rfq.items,rfq.items.product,rfq.items.unit,rfq.items.category,rfq.items.status,rfq.requester,rfq.warehouse,rfq.department,rfq.costCenter,rfq.subCostCenter,purchase_order,purchase_order.supplier,purchase_order.user,purchase_order.subCostCenter,purchase_order.alternativeSubCostCenter,purchase_order.reallocationRequest,purchase_order.reallocationRequest.updatedDestinationSubCostCenter,purchase_order.reallocationRequest.reallocateToSubCostCenter,payment_order,payment_order.supplier,payment_order.user,payment_order.purchase_order,invoice,invoice.items,invoice.client,invoice.representative,budget,budget.department,budget.costCenter,budget_approval_transaction,request_budget,request_budget.department,request_budget.costCenter,request_budget.fiscalPeriod,request_budget.subCostCenter,request_budget.reallocateToSubCostCenter,request_budget.originalDestinationSubCostCenter,request_budget.updatedDestinationSubCostCenter,request_budget.updatedByUser,request_budget.purchaseOrder,request_budget.sourceBudgetRequest,request_budget.reallocationHistory,grn,grn.user,grn.quotation,grn.purchaseOrder,grn.approvalTransactions,grn.approvalTransactions.assignedToUser`
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
                    
                    // If this is a reallocation request, fetch the source budget balance directly
                    if (taskData.request_budget && 
                        taskData.request_budget.type === 'reallocation' && 
                        taskData.request_budget.fiscal_period_id &&
                        taskData.request_budget.department_id &&
                        taskData.request_budget.cost_center_id) {
                        
                        // Fetch the approved budget for the "Moving To" sub cost center (destination)
                        const movingToSubCostCenter = taskData.request_budget.updated_destination_sub_cost_center 
                            ?? taskData.request_budget.reallocate_to_sub_cost_center;
                        
                        if (movingToSubCostCenter) {
                            try {
                                const destinationBudgetResponse = await axios.get('/api/v1/request-budgets', {
                                    params: {
                                        'filter[fiscal_period_id]': taskData.request_budget.fiscal_period_id,
                                        'filter[department_id]': taskData.request_budget.department_id,
                                        'filter[cost_center_id]': taskData.request_budget.cost_center_id,
                                        'filter[sub_cost_center]': movingToSubCostCenter,
                                        'filter[status]': 'Approved',
                                        'filter[type]': '!=reallocation',
                                        per_page: 1
                                    }
                                });
                                
                                if (destinationBudgetResponse.data.data && destinationBudgetResponse.data.data.length > 0) {
                                    const approvedBudget = destinationBudgetResponse.data.data[0];
                                    setMovingToBudgetBalance(approvedBudget.balance_amount);
                                } else {
                                    setMovingToBudgetBalance(null);
                                }
                            } catch (error) {
                                console.error("Error fetching destination budget balance:", error);
                                setMovingToBudgetBalance(null);
                            }
                        } else {
                            setMovingToBudgetBalance(null);
                        }
                        
                        // Fetch the approved budget for the "Moved From" sub cost center (source)
                        if (taskData.request_budget.sub_cost_center) {
                            try {
                                const sourceBudgetResponse = await axios.get('/api/v1/request-budgets', {
                                    params: {
                                        'filter[fiscal_period_id]': taskData.request_budget.fiscal_period_id,
                                        'filter[department_id]': taskData.request_budget.department_id,
                                        'filter[cost_center_id]': taskData.request_budget.cost_center_id,
                                        'filter[sub_cost_center]': taskData.request_budget.sub_cost_center,
                                        'filter[status]': 'Approved',
                                        'filter[type]': '!=reallocation',
                                        per_page: 1
                                    }
                                });
                                
                                if (sourceBudgetResponse.data.data && sourceBudgetResponse.data.data.length > 0) {
                                    const approvedBudget = sourceBudgetResponse.data.data[0];
                                    setMovedFromBudgetBalance(approvedBudget.balance_amount);
                                } else {
                                    setMovedFromBudgetBalance(null);
                                }
                            } catch (error) {
                                console.error("Error fetching moved from budget balance:", error);
                                setMovedFromBudgetBalance(null);
                            }
                        } else {
                            setMovedFromBudgetBalance(null);
                        }
                    } else {
                        setMovingToBudgetBalance(null);
                        setMovedFromBudgetBalance(null);
                    }
                    
                } catch (error) {
                    console.error("Error fetching complete task data:", error);
                    // Fallback to original task data if fetch fails
                    setCompleteTaskData(task);
                    setMovingToBudgetBalance(null);
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

    // Handle PDF generation for Purchase Orders

    const handleGeneratePurchaseOrderPDF = (purchaseOrderId) => {
        setIsGeneratingPDF(true);
        setSelectedPurchaseOrderId(purchaseOrderId);
        setSavedPdfUrl(null);
    };

    const handlePurchaseOrderPDFGenerated = (documentUrl) => {
        setSavedPdfUrl(documentUrl);
        setIsGeneratingPDF(false);
        setSelectedPurchaseOrderId(null);
    };

    // Handle PDF generation for RFQs
    const handleGenerateRFQPDF = (rfqId) => {
        setIsGeneratingRFQPDF(true);
        setSelectedRFQId(rfqId);
        setSavedRFQPdfUrl(null);
    };

    const handleRFQPDFGenerated = (documentUrl) => {
        setSavedRFQPdfUrl(documentUrl);
        setIsGeneratingRFQPDF(false);
        setSelectedRFQId(null);
    };

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
            {/* PDF Generation Modal */}
            {isGeneratingPDF && selectedPurchaseOrderId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]">
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">
                                Generating Purchase Order PDF
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
                                    Purchase Order PDF has been generated successfully!
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
                                        onClick={() => setIsGeneratingPDF(false)}
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
                                        Please wait, generating Purchase Order PDF document...
                                    </p>
                                </div>
                                <PurchaseOrderPDF
                                    purchaseOrderId={selectedPurchaseOrderId}
                                    onGenerated={handlePurchaseOrderPDFGenerated}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* RFQ PDF Generation Modal */}
            {isGeneratingRFQPDF && selectedRFQId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]">
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">
                                Generating RFQ PDF
                            </h3>
                            <button
                                onClick={() => setIsGeneratingRFQPDF(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <FontAwesomeIcon icon={faRemove} />
                            </button>
                        </div>

                        {savedRFQPdfUrl ? (
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
                                    RFQ PDF has been generated successfully!
                                </p>
                                <div className="flex justify-center space-x-4">
                                    <a
                                        href={savedRFQPdfUrl}
                                        target="_blank"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Download PDF
                                    </a>
                                    <button
                                        onClick={() => setIsGeneratingRFQPDF(false)}
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
                                        Please wait, generating RFQ PDF document...
                                    </p>
                                </div>
                                <RFQPDF
                                    rfqId={selectedRFQId}
                                    onGenerated={handleRFQPDFGenerated}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
            
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
                                {/* Show latest description for current task; fallback to latest from previous tasks in the chain */}
                                {(() => {
                                    // Primary: latest description on this task
                                    if (currentTask.descriptions && currentTask.descriptions.length > 0) {
                                        const latest = [...currentTask.descriptions].sort((a, b) => (b.id || 0) - (a.id || 0))[0];
                                        return (
                                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-gray-600">Description:</span>
                                                <span className="font-medium text-gray-800 text-right max-w-xs">
                                                    {latest?.description}
                                                </span>
                                            </div>
                                        );
                                    }

                                    // Fallback: find most recent description on any previous task in this set
                                    if (Array.isArray(allDescriptions) && allDescriptions.length > 0) {
                                        const previousDescriptions = allDescriptions.filter(d => d.task_id !== currentTask.id);
                                        if (previousDescriptions.length > 0) {
                                            const mostRecent = previousDescriptions.sort((a, b) => (b.id || 0) - (a.id || 0))[0];
                                            if (mostRecent?.description) {
                                                return (
                                                    <div className="flex justify-between border-b border-gray-100 pb-2">
                                                        <span className="text-gray-600">Description:</span>
                                                        <span className="font-medium text-gray-800 text-right max-w-xs">
                                                            {mostRecent.description}
                                                        </span>
                                                    </div>
                                                );
                                            }
                                        }
                                    }
                                    return null;
                                })()}

                                {/* Indicator: Refer Status for referee decision (Approved/Rejected) */}
                                {(() => {
                                    // Only show Refer Status if there was an actual "Refer" action
                                    // Check if any description has "Refer" action, not just "Approve" or "Reject"
                                    const actions = (currentTask.descriptions || []).map(d => (d.action || '').toLowerCase());
                                    const hasReferAction = actions.includes('refer');
                                    const hasRefereeApprove = actions.includes('approve');
                                    const hasRefereeReject = actions.includes('reject');
                                    
                                    // Only show if there was a Refer action AND this is a referral response task
                                    if (hasReferAction && currentTask.assigned_from_user && (hasRefereeApprove || hasRefereeReject)) {
                                        const referStatus = hasRefereeApprove ? 'Approved' : 'Rejected';
                                        return (
                                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-gray-600">Refer Status:</span>
                                                <span className="font-medium">
                                                    <StatusBadge status={referStatus} />
                                                </span>
                                            </div>
                                        );
                                    }
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
                                                <span className="font-medium ml-2">{currentTask.rfq.rfq_number || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Warehouse:</span>
                                                <span className="font-medium ml-2">{currentTask.rfq.warehouse?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Department:</span>
                                                <span className="font-medium ml-2">{currentTask.rfq.department?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Cost Center:</span>
                                                <span className="font-medium ml-2">{currentTask.rfq.costCenter?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Sub Cost Center:</span>
                                                <span className="font-medium ml-2">{currentTask.rfq.subCostCenter?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Created By:</span>
                                                <span className="font-medium ml-2">{currentTask.rfq.requester?.name || "N/A"}</span>
                                            </div>
                                        </div>
                                        
                                        {/* RFQ Items */}
                                        {currentTask.rfq.items && currentTask.rfq.items.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="font-semibold text-gray-700 mb-2">RFQ Items:</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-[#C7E7DE] text-[#2C323C]">
                                                            <tr>
                                                                <th className="px-3 py-2 text-center rounded-tl-xl rounded-bl-xl">Item</th>
                                                                <th className="px-3 py-2 text-center">Category</th>
                                                                <th className="px-3 py-2 text-center">Quantity</th>
                                                                <th className={`px-3 py-2 text-center ${currentTask.rfq.items?.some(item => item.attachment) ? '' : 'rounded-tr-xl rounded-br-xl'}`}>Unit</th>
                                                                {currentTask.rfq.items?.some(item => item.attachment) && (
                                                                    <th className="px-3 py-2 text-center rounded-tr-xl rounded-br-xl">Attachment</th>
                                                                )}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {currentTask.rfq.items.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td className="px-3 py-2 text-center">{item.item_name || item.product?.name || "N/A"}</td>
                                                                    <td className="px-3 py-2 text-center">
                                                                        {rfqCategoryName || "Loading..."}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center">{item.quantity ? parseFloat(item.quantity).toFixed(1) : "N/A"}</td>
                                                                    <td className="px-3 py-2 text-center">{item.unit?.name || item.product?.unit?.name || "N/A"}</td>
                                                                    {currentTask.rfq.items?.some(item => item.attachment) && (
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
                                        
                                        {/* RFQ PDF Generation */}
                                        <div className="mt-4">
                                            <h4 className="font-semibold text-gray-700 mb-2">RFQ Document:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => handleGenerateRFQPDF(currentTask.rfq.id)}
                                                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                                                >
                                                    <img
                                                        src="/images/pdf-file.png"
                                                        alt="PDF"
                                                        className="w-4 h-4"
                                                    />
                                                    <span>Generate RFQ PDF</span>
                                                </button>
                                            </div>
                                        </div>
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
                                        
                                        {/* Alternative SubCost Center Budget Indicator */}
                                        {currentTask.purchase_order?.alternative_sub_cost_center_id && currentTask.purchase_order?.alternative_budget_amount && (
                                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                        <h4 className="text-sm font-medium text-yellow-800">
                                                            Budget Allocation Note
                                                        </h4>
                                                        <div className="mt-2 text-sm text-yellow-700">
                                                            <p>
                                                                <span className="font-semibold">{parseFloat(currentTask.purchase_order.alternative_budget_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> has been allocated from an alternative subcost center: <span className="font-semibold">
                                                                    {(() => {
                                                                        // Check if there's a reallocation request with updated destination
                                                                        const reallocationRequest = currentTask.purchase_order.reallocationRequest;
                                                                        if (reallocationRequest) {
                                                                            // Use updated destination if available (from RequestBudgetResource)
                                                                            const updatedDestination = reallocationRequest.updated_destination_sub_cost_center_details?.name;
                                                                            // Otherwise use reallocate_to
                                                                            const reallocateTo = reallocationRequest.reallocate_to_sub_cost_center_details?.name;
                                                                            return updatedDestination || reallocateTo || currentTask.purchase_order.alternativeSubCostCenter?.name || 'N/A';
                                                                        }
                                                                        // Fallback to original alternative sub cost center
                                                                        return currentTask.purchase_order.alternativeSubCostCenter?.name || currentTask.purchase_order.alternative_sub_cost_center?.name || 'N/A';
                                                                    })()}
                                                                </span>
                                                            </p>
                                                            {currentTask.purchase_order.subCostCenter && (
                                                                <p className="mt-1 text-xs">
                                                                    Original subcost center: {currentTask.purchase_order.subCostCenter.name}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Purchase Order Attachments */}
                                        <div className="mt-4">
                                            <h4 className="font-semibold text-gray-700 mb-2">Purchase Order Document:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => handleGeneratePurchaseOrderPDF(currentTask.purchase_order.id)}
                                                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                                                >
                                                    <img
                                                        src="/images/pdf-file.png"
                                                        alt="PDF"
                                                        className="w-4 h-4"
                                                    />
                                                    <span>Generate Purchase Order PDF</span>
                                                </button>
                                            </div>
                                        </div>
                                        
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

                                {/* Budget Reallocation Approval Details */}
                                {currentTask.process.title === "Budget Reallocate Approval" && currentTask.request_budget && currentTask.request_budget.type === 'reallocation' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-gray-600">Department:</span>
                                                <span className="font-medium ml-2">{currentTask.request_budget.department?.name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Cost Center:</span>
                                                <span className="font-medium ml-2">{currentTask.request_budget.cost_center?.name || "N/A"}</span>
                                            </div>
                                            {(() => {
                                                // Calculate the value first to check if it's N/A
                                                // "Moved From" should show the SOURCE sub cost center (sub_cost_center), not the destination
                                                // In a reallocation: sub_cost_center = source (where budget is taken FROM)
                                                //                  reallocate_to_sub_cost_center = destination (where budget is moved TO)
                                                let takingFromValue = "N/A";
                                                if (currentTask?.request_budget) {
                                                        // Use sub_cost_center_details (the source where budget is taken FROM)
                                                        // This is the "Move From" sub cost center from the reallocation form
                                                        // sub_cost_center = source (where budget is taken FROM)
                                                        // reallocate_to_sub_cost_center = destination (where budget is moved TO)
                                                        const sourceName = currentTask.request_budget.sub_cost_center_details?.name;
                                                        let name = sourceName || null;
                                                        
                                                    if (name) {
                                                        // Use the name directly from sub_cost_center_details (source)
                                                        // No aggressive cleaning needed - the name should be correct
                                                        takingFromValue = String(name).trim();
                                                    }
                                                }
                                                
                                                // Only show if value is not "N/A"
                                                if (takingFromValue === "N/A") {
                                                    return null;
                                                }
                                                
                                                // Get source budget amount (for "Moved From" sub cost center)
                                                const movedFromBudgetAmount = (() => {
                                                    // First priority: Use source_new_balance from reallocation_history (same as form uses)
                                                    if (currentTask.request_budget?.reallocation_history?.source_new_balance !== null && 
                                                        currentTask.request_budget?.reallocation_history?.source_new_balance !== undefined) {
                                                        return parseFloat(currentTask.request_budget.reallocation_history.source_new_balance);
                                                    }
                                                    
                                                    // Second priority: Use the fetched moved from budget balance (most accurate)
                                                    if (movedFromBudgetBalance !== null && movedFromBudgetBalance !== undefined) {
                                                        return parseFloat(movedFromBudgetBalance);
                                                    }
                                                    
                                                    // Fallback to old_balance (this is the source budget's old balance)
                                                    const oldBalance = currentTask.request_budget.old_balance;
                                                    if (oldBalance !== null && oldBalance !== undefined) {
                                                        return parseFloat(oldBalance);
                                                    }
                                                    
                                                    return null;
                                                })();
                                                
                                                return (
                                                    <>
                                                        <div>
                                                            <span className="text-gray-600">Move From Sub Cost Center:</span>
                                                            <span className="font-medium ml-2">
                                                                {takingFromValue}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Current Budget:</span>
                                                            <span className="font-medium ml-2">
                                                                {movedFromBudgetAmount !== null && movedFromBudgetAmount !== undefined
                                                                    ? movedFromBudgetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                                    : "N/A"}
                                                            </span>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                            {(() => {
                                                const moveToSubCostCenter = currentTask.request_budget.updated_destination_sub_cost_center_details?.name || currentTask.request_budget.reallocate_to_sub_cost_center_details?.name;
                                                
                                                const currentBudgetAmount = (() => {
                                                    // First priority: Use destination_new_balance from reallocation_history (same as form uses)
                                                    if (currentTask.request_budget?.reallocation_history?.destination_new_balance !== null && 
                                                        currentTask.request_budget?.reallocation_history?.destination_new_balance !== undefined) {
                                                        return parseFloat(currentTask.request_budget.reallocation_history.destination_new_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                    }
                                                    
                                                    // Second priority: Use the fetched destination budget balance (Moving To sub cost center)
                                                    if (movingToBudgetBalance !== null && movingToBudgetBalance !== undefined) {
                                                        return parseFloat(movingToBudgetBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                    }
                                                    
                                                    // Fallback: try to get from updated_destination_sub_cost_center_details first, then reallocate_to_sub_cost_center_details
                                                    const destinationBudget = currentTask.request_budget.updated_destination_sub_cost_center_details 
                                                        || currentTask.request_budget.reallocate_to_sub_cost_center_details;
                                                    if (destinationBudget && destinationBudget.total_balance) {
                                                        return parseFloat(destinationBudget.total_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                    }
                                                    
                                                    return null;
                                                })();
                                                
                                                // Only show if at least one has a value
                                                if (!moveToSubCostCenter && !currentBudgetAmount) {
                                                    return null;
                                                }
                                                
                                                return (
                                                    <>
                                                        {moveToSubCostCenter && (
                                                            <div>
                                                                <span className="text-gray-600">Move To Sub Cost Center:</span>
                                                                <span className="font-medium ml-2">{moveToSubCostCenter}</span>
                                                            </div>
                                                        )}
                                                        {currentBudgetAmount && (
                                                            <div>
                                                                <span className="text-gray-600">Current Budget Amount:</span>
                                                                <span className="font-medium ml-2">{currentBudgetAmount}</span>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                            {currentTask.request_budget.purchase_order && (
                                                <div>
                                                    <span className="text-gray-600">Related Purchase Order:</span>
                                                    <span className="font-medium ml-2">{currentTask.request_budget.purchase_order.purchase_order_no || "N/A"}</span>
                                                </div>
                                            )}
                                            {currentTask.request_budget.purchase_order && (
                                                <div>
                                                    <span className="text-gray-600">Purchase Order Total:</span>
                                                    <span className="font-medium ml-2">
                                                        {(() => {
                                                            const amount = parseFloat(currentTask.request_budget.purchase_order.amount || 0);
                                                            const vat = parseFloat(currentTask.request_budget.purchase_order.vat_amount || 0);
                                                            const total = amount + vat;
                                                            return total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                        })()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="col-span-2">
                                                <span className="text-gray-600">
                                                    {currentTask.status?.toLowerCase() === 'approved' ? 'Reallocated Amount:' : 'Reallocation Amount:'}
                                                </span>
                                                <span className="font-medium ml-2 text-red-600">
                                                    {(() => {
                                                        // If approved, get amount from reallocation_history
                                                        if (currentTask.status?.toLowerCase() === 'approved' && currentTask.request_budget?.reallocation_history?.reallocate_amount !== null && 
                                                            currentTask.request_budget?.reallocation_history?.reallocate_amount !== undefined) {
                                                            return parseFloat(currentTask.request_budget.reallocation_history.reallocate_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                        }
                                                        
                                                        // Otherwise, use the current reallocate_amount
                                                        const amount = currentTask.request_budget.reallocate_amount;
                                                        if (amount !== null && amount !== undefined && parseFloat(amount) > 0) {
                                                            return parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                        }
                                                        return "N/A";
                                                    })()}
                                                </span>
                                            </div>
                                            {currentTask.request_budget.sub_cost_center_updated && currentTask.request_budget.updated_by_user ? (
                                                <div className="col-span-2 mt-2 text-sm">
                                                    <span className="text-red-600">
                                                        Move From {currentTask.request_budget.sub_cost_center_details?.name || "N/A"} by <span className="font-bold text-red-900">{currentTask.request_budget.updated_by_user?.name || "Previous Approver"}</span>
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
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
                                                                const deliveredQty = parseInt(currentTask.grn?.quantity) || 0;
                                                                
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
                                                                        <td className="px-3 py-2 text-center">{deliveredQty}</td>
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
                                        {currentTask.rfq && (
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-700 mb-1">RFQ Approvals:</div>
                                                <div className="pl-4 space-y-1">
                                                    {currentTask.rfq.approval_transactions?.map((approval, index) => (
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