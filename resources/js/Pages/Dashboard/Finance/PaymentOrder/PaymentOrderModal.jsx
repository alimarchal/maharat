import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { router, usePage } from "@inertiajs/react";
import SelectFloating from "../../../../Components/SelectFloating";
import InputFloating from "../../../../Components/InputFloating";

const PaymentOrderModal = ({ isOpen, onClose, selectedOrder }) => {
    const userId = usePage().props.auth.user.id;

    const [formData, setFormData] = useState({
        issue_date: "",
        due_date: "",
        payment_type: "",
        total_amount: selectedOrder?.amount,
        vat_amount: selectedOrder?.vat_amount || 0,
        paid_amount: 0,
        status: "Draft",
        attachment: null,
    });

    // Calculate balance based on total and paid amounts
    const balance =
        parseFloat(formData.total_amount || 0) -
        parseFloat(formData.paid_amount || 0);

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [tempDocument, setTempDocument] = useState(null);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validate the entire form
    const validateForm = () => {
        let newErrors = {};
        if (!formData.issue_date)
            newErrors.issue_date = "Issue date is required";
        if (!formData.due_date) newErrors.due_date = "Due date is required";
        if (!formData.payment_type)
            newErrors.payment_type = "Payment type is required";
        if (!formData.total_amount || parseFloat(formData.total_amount) <= 0)
            newErrors.total_amount = "Total amount must be greater than 0";

        // Validate paid amount
        const paidAmount = parseFloat(formData.paid_amount);
        const totalAmount = parseFloat(formData.total_amount);

        if (formData.paid_amount === "") {
            newErrors.paid_amount = "Paid amount is required";
        } else if (isNaN(paidAmount)) {
            newErrors.paid_amount = "Paid amount must be a valid number";
        } else if (paidAmount < 0) {
            newErrors.paid_amount = "Paid amount cannot be negative";
        } else if (paidAmount > totalAmount) {
            newErrors.paid_amount = "Paid amount can't be more than total amount";
        }

        if (!selectedOrder?.id)
            newErrors.purchase_order_id = "Purchase order is required";

        return newErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Handle numerical inputs specifically
        if (name === "paid_amount" || name === "total_amount") {
            // Allow empty string for initial input
            const newValue = value === "" ? "" : value;
            // Validate paid_amount vs total_amount
            if (name === "paid_amount" && parseFloat(newValue) > parseFloat(formData.total_amount)) {
                setErrors((prev) => ({ ...prev, paid_amount: "Paid amount can't be more than total amount" }));
            } else {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.paid_amount;
                    return newErrors;
                });
            }
            setFormData({ ...formData, [name]: newValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }

        // Clear the error for this field when it changes
        if (errors[name] && name !== "paid_amount") {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        // If form was previously submitted, validate again on change
        if (formSubmitted) {
            if (name === "paid_amount" || name === "total_amount") {
                validatePaidAmount(
                    name === "paid_amount" ? value : formData.paid_amount,
                    name === "total_amount" ? value : formData.total_amount
                );
            }
        }
    };

    // Function to validate paid amount in real-time
    const validatePaidAmount = (paidAmt, totalAmt) => {
        const paid = parseFloat(paidAmt) || 0;
        const total = parseFloat(totalAmt) || 0;

        let paidAmountError = null;

        if (paidAmt === "") {
            paidAmountError = "Paid amount is required";
        } else if (isNaN(paid)) {
            paidAmountError = "Paid amount must be a valid number";
        } else if (paid < 0) {
            paidAmountError = "Paid amount cannot be negative";
        } else if (paid > total) {
            paidAmountError = "Paid amount cannot exceed total amount";
        }

        if (paidAmountError) {
            setErrors((prev) => ({ ...prev, paid_amount: paidAmountError }));
            return false;
        } else {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.paid_amount;
                return newErrors;
            });
            return true;
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setTempDocument(file);

            // Clear any attachment errors
            if (errors.attachment) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.attachment;
                    return newErrors;
                });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormSubmitted(true);

        // Check for attachment before proceeding
        if (!tempDocument && !selectedOrder?.attachment) {
            setErrors((prev) => ({ ...prev, attachment: 'Attachment is required.' }));
            return;
        }

        // Check paid_amount vs total_amount
        if (parseFloat(formData.paid_amount) > parseFloat(formData.total_amount)) {
            setErrors((prev) => ({ ...prev, paid_amount: "Paid amount can't be more than total amount" }));
            return;
        }

        const newErrors = validateForm();
        setErrors(newErrors);

        // Only proceed if there are no validation errors
        if (Object.keys(newErrors).length === 0) {
            try {
                setLoading(true);
                const issueDate = formData.issue_date
                    ? new Date(formData.issue_date).toISOString().split("T")[0]
                    : null;
                const dueDate = formData.due_date
                    ? new Date(formData.due_date).toISOString().split("T")[0]
                    : null;

                const processResponse = await axios.get(
                    "/api/v1/processes?include=steps,creator,updater&filter[title]=Payment Order Approval"
                );

                const process = processResponse.data?.data?.[0];
                const processSteps = process?.steps || [];

                // Check if process and steps exist
                if (!process || processSteps.length === 0) {
                    setErrors({
                        submit: "No Process or steps found for Payment Order Approval",
                    });
                    setIsSubmitting(false);
                    return;
                }
                const processStep = processSteps[0];

                const processResponseViaUser = await axios.get(
                    `/api/v1/process-steps/${processStep.id}/user/${userId}`
                );
                const assignUser = processResponseViaUser?.data?.data;
                if (!assignUser) {
                    setErrors({
                        submit: "No assignee found for this process step and user",
                    });
                    setIsSubmitting(false);
                    return;
                }

                // Create a basic payload without the file
                const payloadData = {
                    user_id: userId,
                    purchase_order_id: selectedOrder?.id,
                    issue_date: issueDate,
                    due_date: dueDate,
                    payment_type: formData.payment_type,
                    total_amount: parseFloat(formData.total_amount).toFixed(2),
                    vat_amount: parseFloat(formData.vat_amount).toFixed(2),
                    paid_amount: parseFloat(formData.paid_amount).toFixed(2),
                    status: 'Draft', // Always set to Draft on creation
                };

                // If we have an existing attachment from selectedOrder, use that
                if (selectedOrder?.attachment) {
                    payloadData.attachment = selectedOrder.attachment;
                }

                const budgetResponse = await axios.get(
                    `/api/v1/request-budgets?filter[sub_cost_center]=${selectedOrder?.rfq?.sub_cost_center_id}&include=fiscalPeriod,department,costCenter,subCostCenter`
                );
                const requestDetails = budgetResponse.data?.data?.[0];

                // Check if requestDetails has data
                if (!requestDetails) {
                    setErrors({
                        submit: "No budget request found for this Sub cost center.",
                    });
                    setLoading(false);
                    return;
                }

                // Validate budget before creating payment order
                const validateBudgetResponse = await axios.post('/api/v1/purchase-orders/validate-budget', {
                    department_id: selectedOrder?.rfq?.department_id,
                    cost_center_id: selectedOrder?.rfq?.cost_center_id,
                    sub_cost_center_id: selectedOrder?.rfq?.sub_cost_center_id,
                    fiscal_period_id: requestDetails?.fiscal_period_id,
                    amount: formData.paid_amount
                });
                if (!validateBudgetResponse.data.success) {
                    setErrors({ submit: validateBudgetResponse.data.data.message });
                    setLoading(false);
                    return;
                }

                // Send request with JSON payload (not FormData)
                const response = await axios.post(
                    "/api/v1/payment-orders",
                    payloadData,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                    }
                );

                // If we have a new file to upload and the payment order was created successfully
                if (tempDocument && response.data?.data?.id) {
                    const documentFormData = new FormData();
                    documentFormData.append(
                        "payment_order_document",
                        tempDocument
                    );

                    try {
                        // Use the upload document endpoint for file uploads
                        await axios.post(
                            `/api/v1/payment-orders/${response.data.data.id}/upload-document`,
                            documentFormData,
                            {
                                headers: {
                                    "Content-Type": "multipart/form-data",
                                    Accept: "application/json",
                                },
                            }
                        );
                    } catch (uploadError) {
                        console.error("Error uploading document:", uploadError);
                    }
                }

                // Check if we have a valid response with an ID
                if (!response.data?.data?.id) {
                    throw new Error("Invalid response from server");
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

                // Create approval transaction
                const PaymentOrderApprovalPayload = {
                    payment_order_id: paymentOrderResponse,
                    requester_id: userId,
                    assigned_to: assignUser?.approver_id,
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
                    assigned_to_user_id: assignUser?.approver_id,
                    assigned_from_user_id: userId,
                    payment_order_id: paymentOrderResponse,
                };
                await axios.post("/api/v1/tasks", taskPayload);

                setLoading(false);
                onClose();
                router.visit("/payment-orders");
            } catch (error) {
                setLoading(false);
                console.error("Error creating payment order:", error);
                // Show attachment error if backend returns it
                if (error.response && error.response.data && error.response.data.errors && error.response.data.errors.attachment) {
                    setErrors((prev) => ({ ...prev, attachment: error.response.data.errors.attachment[0] }));
                } else {
                    setErrors((prev) => ({ ...prev, general: "An error occurred while creating the payment order." }));
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
        setFormData((prev) => ({
            ...prev,
            status: suggestedStatus,
        }));
    }, [formData.due_date, formData.total_amount, formData.paid_amount]);

    // Set initial issue date to today when modal opens
    useEffect(() => {
        if (isOpen) {
            const today = new Date().toISOString().split("T")[0];
            setFormData((prev) => ({
                ...prev,
                issue_date: today,
                total_amount: selectedOrder?.amount || 0,
                vat_amount: selectedOrder?.vat_amount || 0,
            }));
        }
    }, [isOpen, selectedOrder]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between border-b pb-2 mb-6">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        Create New Payment Order
                    </h2>
                    <div className="flex items-center gap-4">
                        <span className="text-lg">
                            <span className="font-bold">Issue Date:</span> {new Date().toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            })}
                        </span>
                        <button
                            onClick={onClose}
                            className="text-red-500 hover:text-red-800"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-6">
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

                        {/* Payment Type (scrollable dropdown) */}
                        <div className="w-full">
                            <div className="relative w-full">
                                <SelectFloating
                                    label="Payment Type"
                                    name="payment_type"
                                    value={formData.payment_type}
                                    onChange={handleChange}
                                    options={[
                                        { id: "Cash", label: "Cash" },
                                        { id: "Credit upto 30 days", label: "Credit upto 30 days" },
                                        { id: "Credit upto 60 days", label: "Credit upto 60 days" },
                                        { id: "Credit upto 90 days", label: "Credit upto 90 days" },
                                        { id: "Credit upto 120 days", label: "Credit upto 120 days" },
                                        // Add more options here if needed
                                    ]}
                                    error={errors.payment_type}
                                    dropdownClassName="max-h-40 overflow-y-auto"
                                />
                                {errors.payment_type && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.payment_type}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Amount (readOnly, white background) */}
                        <div className="w-full">
                            <div className="relative w-full">
                                <input
                                    type="number"
                                    min="0"
                                    name="total_amount"
                                    value={formData.total_amount}
                                    onChange={handleChange}
                                    className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none"
                                    readOnly
                                />
                                <label
                                    className={`absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                                        {"-top-2 left-2 text-base text-[#009FDC] px-1"}`}
                                >
                                    Amount
                                </label>
                                {errors.total_amount && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.total_amount}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* VAT Amount (readOnly, white background) */}
                        <div className="w-full">
                            <div className="relative w-full">
                                <input
                                    type="number"
                                    name="vat_amount"
                                    value={formData.vat_amount}
                                    className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none"
                                    readOnly
                                />
                                <label
                                    className={`absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                                        {"-top-2 left-2 text-base text-[#009FDC] px-1"}`}
                                >
                                    VAT Amount
                                </label>
                            </div>
                        </div>

                        {/* Attachment (commented out) */}
                        {/**
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
                                Attachment
                            </label>
                            {tempDocument && (
                                <div className="flex justify-center">
                                    <div
                                        className="text-sm text-orange-600 mb-2 truncate max-w-[220px] text-center"
                                        title={tempDocument.name}
                                    >
                                        Selected: {tempDocument.name}
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-end w-full">
                                <input
                                    type="file"
                                    name="attachment"
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    className="text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-[#009FDC] file:text-white
                                        hover:file:bg-[#007BB5]"
                                />
                            </div>
                            {errors.attachment && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.attachment}
                                </p>
                            )}
                        </div>
                        */}
                    </div>

                    {/* Error Messages */}
                    {(errors.general || errors.submit || errors.purchase_order_id) && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {errors.general && <p>{errors.general}</p>}
                            {errors.submit && <p>{errors.submit}</p>}
                            {errors.purchase_order_id && <p>{errors.purchase_order_id}</p>}
                        </div>
                    )}

                    <div className="my-4 flex justify-center">
                        <button
                            type="submit"
                            className="w-full px-8 py-3 text-xl font-medium bg-[#009FDC] text-white cursor-pointer rounded-full transition duration-300 hover:bg-[#007BB5] disabled:bg-gray-400 disabled:cursor-not-allowed"
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
