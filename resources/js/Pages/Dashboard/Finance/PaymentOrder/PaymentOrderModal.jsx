import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { router, usePage } from "@inertiajs/react";
import SelectFloating from "../../../../Components/SelectFloating";
import InputFloating from "../../../../Components/InputFloating";

const PaymentOrderModal = ({ isOpen, onClose, selectedOrder }) => {
    const userId = usePage().props.auth.user.id;
    console.log("Selected order in modal:", selectedOrder);

    const [formData, setFormData] = useState({
        issue_date: "",
        due_date: "",
        payment_type: "",
        total_amount: 0,
        paid_amount: 0,
        status: "Draft",
        attachment: null
    });
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [tempDocument, setTempDocument] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // When total_amount changes, reset paid_amount validation errors
        if (name === 'total_amount' || name === 'paid_amount') {
            setErrors(prev => ({
                ...prev,
                paid_amount: undefined
            }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setTempDocument(file);
            console.log("File selected:", file.name, file.type, file.size);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let newErrors = {};
        if (!formData.issue_date) newErrors.issue_date = "Issue date is required";
        if (!formData.due_date) newErrors.due_date = "Due date is required";
        if (!formData.payment_type) newErrors.payment_type = "Payment type is required";
        if (!formData.total_amount || formData.total_amount <= 0) newErrors.total_amount = "Total amount must be greater than 0";
        if (!formData.status) newErrors.status = "Status is required";
        if (parseFloat(formData.paid_amount) > parseFloat(formData.total_amount)) 
            newErrors.paid_amount = "Paid amount cannot exceed total amount";
        if (!selectedOrder?.id) newErrors.purchase_order_id = "Purchase order is required";

        setErrors(newErrors);
        
        if (Object.keys(newErrors).length === 0) {
            try {
                setLoading(true);

                // Format dates for the API
                const issueDate = formData.issue_date ? new Date(formData.issue_date).toISOString().split('T')[0] : null;
                const dueDate = formData.due_date ? new Date(formData.due_date).toISOString().split('T')[0] : null;

                // First, create a basic payload without the file
                const payloadData = {
                    user_id: userId,
                    purchase_order_id: selectedOrder?.id,
                    issue_date: issueDate,
                    due_date: dueDate,
                    payment_type: formData.payment_type,
                    total_amount: parseFloat(formData.total_amount).toFixed(2),
                    paid_amount: parseFloat(formData.paid_amount).toFixed(2),
                    status: formData.status
                };

                // If we have an existing attachment from selectedOrder, use that
                if (selectedOrder?.attachment) {
                    console.log("Using existing attachment path:", selectedOrder.attachment);
                    payloadData.attachment = selectedOrder.attachment;
                }

                console.log("Submitting payment order with payload:", payloadData);

                // Send request with JSON payload (not FormData)
                const response = await axios.post(
                    "/api/v1/payment-orders",
                    payloadData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    }
                );

                console.log("Payment order response:", response.data);

                // If we have a new file to upload and the payment order was created successfully
                if (tempDocument && response.data?.data?.id) {
                    console.log("Now uploading document for payment order:", response.data.data.id);
                    const documentFormData = new FormData();
                    documentFormData.append('payment_order_document', tempDocument);

                    try {
                        // Use the upload document endpoint for file uploads
                        const uploadResponse = await axios.post(
                            `/api/v1/payment-orders/${response.data.data.id}/upload-document`,
                            documentFormData,
                            {
                                headers: {
                                    'Content-Type': 'multipart/form-data',
                                    'Accept': 'application/json'
                                }
                            }
                        );
                        console.log("Document upload response:", uploadResponse.data);
                    } catch (uploadError) {
                        console.error("Error uploading document:", uploadError);
                    }
                }

                // Check if we have a valid response with an ID
                if (!response.data?.data?.id) {
                    throw new Error('Invalid response from server');
                }
                
                const paymentOrderResponse = response.data.data.id;

                // Create payment order logs
                const paymentLogsPayload = {
                    description: "Payment order created",
                    action: "Approved",
                    priority: "Standard",
                    payment_order_id: paymentOrderResponse,
                };

                // Update purchase order has_payment_order status only if selectedOrder exists
                if (selectedOrder?.id) {
                    const purchaseOrderPayload = {
                        has_payment_order: true,
                    };
                    await axios.put(
                        `/api/v1/purchase-orders/${selectedOrder.id}`,
                        purchaseOrderPayload
                    );
                }

                // Create payment order logs
                await axios.post(
                    "/api/v1/payment-order-logs",
                    paymentLogsPayload
                );

                // Create approval workflow
                try {
                    const processResponse = await axios.get(
                        "/api/v1/processes?include=steps,creator,updater&filter[title]=Payment Order Approval"
                    );

                    // Check if we have valid process data
                    if (
                        processResponse.data.data &&
                        processResponse.data.data.length > 0
                    ) {
                        const process = processResponse.data.data[0];

                        // Check if process has steps
                        if (process.steps && process.steps.length > 0) {
                            const processStep = process.steps[0];

                            // Only proceed if we have a valid process step
                            if (processStep && processStep.order) {
                                const processResponseViaUser = await axios.get(
                                    `/api/v1/process-steps/${processStep.order}/user/${userId}`
                                );

                                // Check if we have valid user assignment data
                                if (
                                    processResponseViaUser?.data?.user?.user?.id
                                ) {
                                    const assignUser =
                                        processResponseViaUser.data;

                                    // Create approval transaction
                                    const PaymentOrderApprovalPayload = {
                                        payment_order_id: paymentOrderResponse,
                                        requester_id: userId,
                                        assigned_to: assignUser.user.user.id,
                                        order: processStep.order,
                                        description: processStep.description,
                                        status: "Pending",
                                    };
                                    await axios.post(
                                        "/api/v1/payment-order-approval-trans",
                                        PaymentOrderApprovalPayload
                                    );

                                    // Create task
                                    const taskPayload = {
                                        process_step_id: processStep.id,
                                        process_id: processStep.process_id,
                                        assigned_at: new Date().toISOString(),
                                        urgency: "Normal",
                                        assigned_to_user_id:
                                            assignUser.user.user.id,
                                        assigned_from_user_id: userId,
                                        payment_order_id: paymentOrderResponse,
                                    };
                                    await axios.post(
                                        "/api/v1/tasks",
                                        taskPayload
                                    );
                                }
                            }
                        }
                    }
                } catch (approvalError) {
                    console.error("Approval process error:", approvalError);
                }

                setLoading(false);
                onClose();
                router.visit("/payment-orders");
            } catch (error) {
                setLoading(false);
                console.error("Error creating payment order:", error);
                
                if (error.response) {
                    console.log("Error response:", error.response);
                    console.log("Error status:", error.response.status);
                    console.log("Error headers:", error.response.headers);
                    console.log("Full error response data:", JSON.stringify(error.response.data));
                    
                    if (error.response.data && error.response.data.errors) {
                        console.log("Validation errors:", error.response.data.errors);
                        // Log each error in detail
                        Object.entries(error.response.data.errors).forEach(([field, messages]) => {
                            console.log(`Field '${field}' errors:`, messages);
                            
                            // Special handling for attachment errors
                            if (field === 'attachment' || field === 'uploaded_document') {
                                console.log("Attachment field error detected. Current value:", tempDocument ? 'New file selected' : (selectedOrder?.attachment || 'None'));
                            }
                        });
                        setErrors(error.response.data.errors);
                    } else if (error.response.data && error.response.data.message) {
                        console.log("Error message:", error.response.data.message);
                        setErrors({ general: error.response.data.message });
                    } else {
                        console.log("Unexpected error format:", error.response.data);
                        setErrors({ general: `Server error: ${error.response.status}` });
                    }
                } else if (error.request) {
                    console.log("Error request:", error.request);
                    setErrors({ general: "No response received from server. Check your network." });
                } else {
                    console.log("Error message:", error.message);
                    setErrors({ general: `Error: ${error.message}` });
                }
            }
        }
    };

    // Calculate suggested status based on dates and paid amount
    const calculateSuggestedStatus = () => {
        const today = new Date();
        const dueDate = formData.due_date ? new Date(formData.due_date) : null;
        const totalAmount = parseFloat(formData.total_amount) || 0;
        const paidAmount = parseFloat(formData.paid_amount) || 0;

        if (paidAmount === 0) {
            return dueDate && today > dueDate ? "Overdue" : "Pending";
        } else if (paidAmount < totalAmount) {
            return "Partially Paid";
        } else if (paidAmount >= totalAmount) {
            return "Paid";
        }
        return "Draft";
    };

    // Update status when relevant fields change
    useEffect(() => {
        const suggestedStatus = calculateSuggestedStatus();
        setFormData(prev => ({
            ...prev,
            status: suggestedStatus
        }));
    }, [formData.due_date, formData.total_amount, formData.paid_amount]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between border-b pb-2 mb-6">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        Create New Payment Order
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-6">
                        {/* Issue Date */}
                        <div className="w-full">
                            <InputFloating
                                label="Select Issue Date"
                                name="issue_date"
                                type="date"
                                value={formData.issue_date}
                                onChange={handleChange}
                                error={errors.issue_date}
                            />
                        </div>

                        {/* Due Date */}
                        <div className="w-full">
                            <InputFloating
                                label="Select Due Date"
                                name="due_date"
                                type="date"
                                value={formData.due_date}
                                onChange={handleChange}
                                error={errors.due_date}
                            />
                        </div>

                        {/* Payment Type */}
                        <div className="w-full">
                            <SelectFloating
                                label="Payment Type"
                                name="payment_type"
                                value={formData.payment_type}
                                onChange={handleChange}
                                options={[
                                    { id: "Cash", label: "Cash" },
                                    { id: "Card", label: "Card" },
                                    { id: "Bank Transfer", label: "Bank Transfer" },
                                    { id: "Cheque", label: "Cheque" },
                                ]}
                            />
                            {errors.payment_type && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.payment_type}
                                </p>
                            )}
                        </div>

                        {/* Status */}
                        <div className="w-full">
                            <SelectFloating
                                label="Status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                options={[
                                    { id: "Draft", label: "Draft" },
                                    { id: "Pending", label: "Pending" },
                                    { id: "Paid", label: "Paid" },
                                    { id: "Partially Paid", label: "Partially Paid" },
                                    { id: "Overdue", label: "Overdue" },
                                    { id: "Cancelled", label: "Cancelled" },
                                ]}
                            />
                            {errors.status && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.status}
                                </p>
                            )}
                        </div>

                        {/* Total Amount */}
                        <div className="w-full">
                            <div className="relative w-full">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="total_amount"
                                    value={formData.total_amount}
                                    onChange={handleChange}
                                    className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                                />
                                <label
                                    className={`absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                                        ${"-top-2 left-2 text-base text-[#009FDC] px-1"}`}
                                >
                                    Total Amount
                                </label>
                                {errors.total_amount && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.total_amount}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Paid Amount */}
                        <div className="w-full">
                            <div className="relative w-full">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="paid_amount"
                                    value={formData.paid_amount}
                                    onChange={handleChange}
                                    className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                                />
                                <label
                                    className={`absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                                        ${"-top-2 left-2 text-base text-[#009FDC] px-1"}`}
                                >
                                    Paid Amount
                                </label>
                                {errors.paid_amount && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.paid_amount}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Attachment */}
                    <div className="flex justify-center mt-6 mb-4">
                        <div className="w-1/2 text-center">
                            <div className="space-y-2 text-center">
                                <label className="block text-sm font-medium text-gray-700 text-center">
                                    Attachment (Optional)
                                </label>
                                <div className="flex flex-col items-center justify-center">
                                    <input
                                        type="file"
                                        name="attachment"
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        className="w-full max-w-xs text-sm text-gray-500 text-center pl-16
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-[#009FDC] file:text-white
                                            hover:file:bg-[#007BB5]"
                                    />
                                    {tempDocument && (
                                        <div className="mt-2 text-sm text-green-600">
                                            Selected file: {tempDocument.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* General Error Message */}
                    {errors.general && (
                        <div className="text-red-500 text-sm mt-2 text-center">
                            {errors.general}
                        </div>
                    )}

                    {/* Purchase Order ID Error */}
                    {errors.purchase_order_id && (
                        <div className="text-red-500 text-sm mt-2 text-center">
                            {errors.purchase_order_id}
                        </div>
                    )}

                    <div className="my-4 flex justify-center">
                        <button
                            className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-1/2 mx-auto"
                            disabled={loading}
                        >
                            {loading ? "Submitting..." : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentOrderModal;
