import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { router, usePage } from "@inertiajs/react";
import SelectFloating from "../../../../Components/SelectFloating";

const PaymentOrderModal = ({ isOpen, onClose, selectedOrder }) => {
    const userId = usePage().props.auth.user.id;
    console.log("Selected order in modal:", selectedOrder);

    const [formData, setFormData] = useState({
        issue_date: new Date().toISOString().substr(0, 10),
        due_date: "",
        payment_type: "",
        total_amount: selectedOrder?.amount ? parseFloat(selectedOrder.amount) : 0,
        paid_amount: 0,
        status: "Draft"
    });
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        // Update total amount when selected order changes
        if (selectedOrder?.amount) {
            let amount = selectedOrder.amount;
            // Ensure amount is stored as a number
            if (typeof amount === 'string') {
                amount = parseFloat(amount);
            }
            setFormData(prev => ({
                ...prev,
                total_amount: amount
            }));
        }
    }, [selectedOrder]);

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

        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            try {
                setLoading(true);

                // Format dates for the API
                const issueDate = formData.issue_date ? new Date(formData.issue_date).toISOString().split('T')[0] : null;
                const dueDate = formData.due_date ? new Date(formData.due_date).toISOString().split('T')[0] : null;

                // Prepare payment order data
                const paymentOrderPayload = {
                    user_id: userId,
                    purchase_order_id: selectedOrder?.id,
                    issue_date: issueDate,
                    due_date: dueDate,
                    payment_type: formData.payment_type,
                    total_amount: parseFloat(formData.total_amount).toFixed(2),
                    paid_amount: parseFloat(formData.paid_amount).toFixed(2),
                    status: formData.status,
                    attachment: selectedOrder?.attachment,
                };

                console.log("Submitting payment order payload:", paymentOrderPayload);

                // Create payment order
                const response = await axios.post(
                    "/api/v1/payment-orders",
                    paymentOrderPayload
                );
                const paymentOrderResponse = response.data.data?.id;

                // Create payment order logs
                const paymentLogsPayload = {
                    description: "Payment order created",
                    action: "Approved",
                    priority: "Standard",
                    payment_order_id: paymentOrderResponse,
                };

                // Update purchase order has_payment_order status
                const purchaseOrderPayload = {
                    has_payment_order: true,
                };
                await axios.put(
                    `/api/v1/purchase-orders/${selectedOrder?.id}`,
                    purchaseOrderPayload
                );

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
                
                if (error.response && error.response.data && error.response.data.errors) {
                    setErrors(error.response.data.errors);
                } else {
                    setErrors({ general: "Failed to create payment order. Please try again." });
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
                            <div className="relative w-full">
                                <select
                                    className="absolute opacity-0 pointer-events-none"
                                    tabIndex="-1"
                                    aria-hidden="true"
                                >
                                    <option value="">placeholder</option>
                                </select>
                                <input
                                    type="date"
                                    name="issue_date"
                                    value={formData.issue_date}
                                    onChange={handleChange}
                                    className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                                />
                                <label
                                    className={`absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                                        ${"-top-2 left-2 text-base text-[#009FDC] px-1"}`}
                                >
                                    Issue Date
                                </label>
                                {errors.issue_date && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.issue_date}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="w-full">
                            <div className="relative w-full">
                                <select
                                    className="absolute opacity-0 pointer-events-none"
                                    tabIndex="-1"
                                    aria-hidden="true"
                                >
                                    <option value="">placeholder</option>
                                </select>
                                <input
                                    type="date"
                                    name="due_date"
                                    value={formData.due_date}
                                    onChange={handleChange}
                                    className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                                />
                                <label
                                    className={`absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                                        ${"-top-2 left-2 text-base text-[#009FDC] px-1"}`}
                                >
                                    Due Date
                                </label>
                                {errors.due_date && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.due_date}
                                    </p>
                                )}
                            </div>
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
                                        ${formData.total_amount !== "" ? "-top-2 left-2 text-base text-[#009FDC] px-1" : "top-4 text-base text-gray-400"}`}
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
                                        ${formData.paid_amount !== "" ? "-top-2 left-2 text-base text-[#009FDC] px-1" : "top-4 text-base text-gray-400"}`}
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

                    {/* General Error Message */}
                    {errors.general && (
                        <div className="text-red-500 text-sm mt-2 text-center">
                            {errors.general}
                        </div>
                    )}

                    <div className="my-4 flex justify-center w-full">
                        <button
                            className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full"
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
