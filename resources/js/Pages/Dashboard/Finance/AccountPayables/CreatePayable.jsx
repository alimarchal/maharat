import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUpload } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "@/Components/InputFloating";
import SelectFloating from "@/Components/SelectFloating";

const CreatePayable = ({ isOpen, onClose, onSave, paymentOrder = null, isEdit = false }) => {
    const [formData, setFormData] = useState({
        supplier_id: "",
        status: "",
        issue_date: "",
        due_date: "",
        payment_method: "",
        total_amount: "0.00",
        paid_amount: "0.00",
        balance: "0.00"
    });

    const [suppliers, setSuppliers] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchSuppliers();
            setDefaultFormData();
        }
    }, [isOpen, paymentOrder, isEdit]);

    useEffect(() => {
        if (paymentOrder) {
            console.log("CreatePayable - paymentOrder prop:", paymentOrder);
            console.log("CreatePayable - paymentOrder.status:", paymentOrder.status);
            console.log("CreatePayable - original status value:", paymentOrder.status);
        }
    }, [paymentOrder]);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/users?role=supplier');
            setSuppliers(response.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            setErrors({ fetch: "Failed to load suppliers" });
            setLoading(false);
        }
    };

    const setDefaultFormData = async () => {
        if (isEdit && paymentOrder) {
            try {
                console.log("Setting default data from payment order:", paymentOrder);
                
                let orderData;
                if (paymentOrder.id) {
                    // Try to use the raw-data endpoint first for complete data
                    try {
                        const rawResponse = await axios.get(`/api/v1/payment-orders/${paymentOrder.id}/raw-data`);
                        orderData = rawResponse.data.data;
                        console.log("Fetched raw order data from API:", orderData);
                    } catch (rawError) {
                        console.log("Raw data endpoint failed, falling back to standard API:", rawError);
                        const orderResponse = await axios.get(`/api/v1/payment-orders/${paymentOrder.id}?include=user,purchaseOrder`);
                        orderData = orderResponse.data.data;
                        console.log("Fetched standard order data from API:", orderData);
                    }
                } else {
                    orderData = paymentOrder;
                    console.log("Using provided payment order data:", orderData);
                }
                
                let formattedStatus = "Pending";
                if (orderData.status) {
                    if (typeof orderData.status === 'string' && 
                        ["Draft", "Pending", "Paid", "Partially Paid", "Overdue"].includes(orderData.status)) {
                        formattedStatus = orderData.status;
                        console.log("Using status directly from UI:", formattedStatus);
                    } 
                    else if (orderData.status.toLowerCase() === "draft") {
                        formattedStatus = "Draft";
                        console.log("Setting draft status");
                    } 
                    else {
                        formattedStatus = orderData.status
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase());
                        console.log("Converted status from snake_case:", formattedStatus);
                    }
                        
                    const validStatuses = ["Pending", "Paid", "Partially Paid", "Overdue", "Draft"];
                    if (!validStatuses.includes(formattedStatus)) {
                        console.log("Invalid status found, defaulting to Pending:", formattedStatus);
                        formattedStatus = "Pending";
                    }
                }
                
                // Get payment method with fallbacks
                const paymentMethod = orderData.payment_type || 
                                      orderData.payment_method || 
                                      orderData.payment_terms || 
                                      "Net 30";
                
                console.log("Original status:", orderData.status);
                console.log("Formatted status for form:", formattedStatus);
                console.log("Payment method/terms:", paymentMethod);
                
                const newFormData = {
                    supplier_id: orderData.user_id?.toString() || "",
                    status: formattedStatus,
                    issue_date: formatDateForInput(orderData.issue_date || orderData.date) || "",
                    due_date: formatDateForInput(orderData.due_date) || "",
                    payment_method: paymentMethod,
                    total_amount: orderData.total_amount?.toString() || "0.00",
                    paid_amount: orderData.paid_amount?.toString() || "0.00",
                    balance: ((orderData.total_amount || 0) - (orderData.paid_amount || 0)).toFixed(2)
                };
                
                console.log("Setting form data to:", newFormData);
                setFormData(newFormData);
            } catch (error) {
                console.error('Error fetching payment order details:', error);
                setErrors({ fetch: "Failed to load payment order details" });
            }
        } else {
            const today = new Date().toISOString().split('T')[0];
            const defaultData = {
                supplier_id: "",
                status: "Pending",
                issue_date: today,
                due_date: "",
                payment_method: "Net 30",
                total_amount: "0.00",
                paid_amount: "0.00",
                balance: "0.00"
            };
            
            console.log("Setting default form data for new payment order:", defaultData);
            setFormData(defaultData);
        }
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.error("Date formatting error:", error);
            return dateString;
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let updatedData = { ...formData, [name]: value };

        // Recalculate balance when amount or paid amount changes
        if (name === "total_amount" || name === "paid_amount") {
            const amount = parseFloat(updatedData.total_amount) || 0;
            const paid = parseFloat(updatedData.paid_amount) || 0;
            updatedData.balance = (amount - paid).toFixed(2);
        }

        setFormData(updatedData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setErrors({});
        
        console.log("Form data at submission:", formData);

        // Validate required fields
        const validationErrors = {};
        if (!formData.supplier_id) validationErrors.supplier_id = "Supplier is required";
        if (!formData.status) validationErrors.status = "Status is required";
        if (!formData.issue_date) validationErrors.issue_date = "Issue date is required";
        if (!formData.payment_method) validationErrors.payment_method = "Payment terms is required";
        if (!formData.total_amount) validationErrors.total_amount = "Amount is required";

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsSaving(false);
            return;
        }

        try {
            // Convert status to the API format
            let statusValue = formData.status.toLowerCase();
            
            // Special handling for UI-formatted statuses
            if (statusValue === "partially paid") {
                statusValue = "partially_paid";
            } else if (statusValue !== "draft" && statusValue !== "paid" && statusValue !== "pending" && statusValue !== "overdue") {
                // Only replace spaces with underscores if it's not a simple status
                statusValue = statusValue.replace(/ /g, "_");
            }
            
            // Prepare update data
            const updateData = {
                user_id: formData.supplier_id,
                status: statusValue,
                issue_date: formData.issue_date,
                due_date: formData.due_date,
                payment_type: formData.payment_method, // Use payment_type as primary field
                payment_method: formData.payment_method, // Include for backward compatibility
                total_amount: formData.total_amount,
                paid_amount: formData.paid_amount,
                currency: "SAR",
            };
            
            console.log("Submitting data to API:", updateData);
            
            let response;
            
            if (isEdit && paymentOrder && paymentOrder.id) {
                // Update existing payment order
                console.log(`Updating payment order ID: ${paymentOrder.id} with data:`, updateData);
                response = await axios.put(`/api/v1/payment-orders/${paymentOrder.id}`, updateData);
                console.log("Update response:", response.data);
            } else {
                // Create new payment order
                console.log("Creating new payment order with data:", updateData);
                response = await axios.post('/api/v1/payment-orders', updateData);
                console.log("Create response:", response.data);
            }
            
            console.log('API Response:', response.data);
            
            if (response.data && response.data.data) {
                onSave(response.data.data);
            } else {
                onSave(formData);
            }
            
            onClose();
        } catch (error) {
            console.error('Error saving payment order:', error);
            console.error('Error details:', error.response?.data);
            
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ 
                    submit: error.response?.data?.message || "Failed to save payment order" 
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    // Status options
    const statusOptions = [
        { id: "Draft", label: "Draft" },
        { id: "Pending", label: "Pending" },
        { id: "Paid", label: "Paid" },
        { id: "Partially Paid", label: "Partially Paid" },
        { id: "Overdue", label: "Overdue" }
    ];

    // Payment terms options
    const paymentTermsOptions = [
        { id: "Cash", label: "Cash" },
        { id: "Credit", label: "Credit" },
        { id: "Bank Transfer", label: "Bank Transfer" },
        { id: "Cheque", label: "Cheque" },
        { id: "Net 30", label: "Net 30" },
        { id: "Net 60", label: "Net 60" }
    ];

    // Supplier options
    const supplierOptions = suppliers.map(supplier => ({
        id: supplier.id.toString(),
        label: supplier.name
    }));

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-2xl">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        {isEdit ? "Edit Account Payable" : "Create Account Payable"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                
                {errors.submit && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline"> {errors.submit}</span>
                    </div>
                )}
                
                {loading ? (
                    <div className="flex justify-center py-6">
                        <div className="w-10 h-10 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* First row: Issue date and due date */}
                        <div className="grid grid-cols-2 gap-4">
                            <InputFloating
                                label="Issue Date"
                                name="issue_date"
                                type="date"
                                value={formData.issue_date}
                                onChange={handleChange}
                                error={errors.issue_date}
                            />
                            <InputFloating
                                label="Due Date"
                                name="due_date"
                                type="date"
                                value={formData.due_date}
                                onChange={handleChange}
                                error={errors.due_date}
                            />
                        </div>
                        
                        {/* Second row: Payment terms and status */}
                        <div className="grid grid-cols-2 gap-4">
                            <SelectFloating
                                label="Payment Terms"
                                name="payment_method"
                                value={formData.payment_method}
                                onChange={handleChange}
                                options={paymentTermsOptions}
                                error={errors.payment_method}
                            />
                            <SelectFloating
                                label="Status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                options={statusOptions}
                                error={errors.status}
                            />
                        </div>
                        
                        {/* Third row: Amount and paid amount */}
                        <div className="grid grid-cols-2 gap-4">
                            <InputFloating
                                label="Amount"
                                name="total_amount"
                                type="number"
                                step="0.01"
                                value={formData.total_amount}
                                onChange={handleChange}
                                error={errors.total_amount}
                            />
                            <InputFloating
                                label="Paid Amount"
                                name="paid_amount"
                                type="number"
                                step="0.01"
                                value={formData.paid_amount}
                                onChange={handleChange}
                                error={errors.paid_amount}
                            />
                        </div>
                        
                        {/* Only show supplier dropdown if creating new record */}
                        {!isEdit && (
                            <div className="mt-2">
                                <SelectFloating
                                    label="Supplier"
                                    name="supplier_id"
                                    value={formData.supplier_id}
                                    onChange={handleChange}
                                    options={supplierOptions}
                                    error={errors.supplier_id}
                                />
                            </div>
                        )}
                        
                        <div className="text-center mt-4">
                            <div className="text-xl font-semibold text-gray-700">
                                Balance: <span className="text-[#009FDC]">{formData.balance} SAR</span>
                            </div>
                        </div>
                        
                        <div className="my-6 flex justify-center w-full">
                            <button
                                type="submit"
                                className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full"
                                disabled={isSaving}
                            >
                                {isSaving
                                    ? "Saving..."
                                    : isEdit
                                    ? "Update"
                                    : "Save"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CreatePayable; 