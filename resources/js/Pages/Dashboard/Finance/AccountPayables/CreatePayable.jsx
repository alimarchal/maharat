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
                // If we're editing, fetch the full payment order details
                const orderResponse = await axios.get(`/api/v1/payment-orders/${paymentOrder.id}`);
                const orderData = orderResponse.data.data;
                
                // Format the status properly
                let formattedStatus = "Pending";
                if (orderData.status) {
                    // Check if it's draft status
                    if (orderData.status.toLowerCase() === "draft") {
                        formattedStatus = "Draft";
                    } else {
                        // Convert snake_case to Title Case
                        formattedStatus = orderData.status
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase());
                    }
                        
                    // Ensure it matches one of our status options
                    const validStatuses = ["Pending", "Paid", "Partially Paid", "Overdue", "Draft"];
                    if (!validStatuses.includes(formattedStatus)) {
                        formattedStatus = "Pending";
                    }
                }
                
                console.log("Original status:", orderData.status);
                console.log("Formatted status for form:", formattedStatus);
                
                setFormData({
                    supplier_id: orderData.user_id?.toString() || "",
                    status: formattedStatus,
                    issue_date: formatDateForInput(orderData.issue_date) || "",
                    due_date: formatDateForInput(orderData.due_date) || "",
                    payment_method: orderData.payment_method || "",
                    total_amount: orderData.total_amount?.toString() || "0.00",
                    paid_amount: orderData.paid_amount?.toString() || "0.00",
                    balance: ((orderData.total_amount || 0) - (orderData.paid_amount || 0)).toFixed(2)
                });
            } catch (error) {
                console.error('Error fetching payment order details:', error);
                setErrors({ fetch: "Failed to load payment order details" });
            }
        } else {
            // For new payment orders, set default values
            const today = new Date().toISOString().split('T')[0];
            setFormData({
                supplier_id: "",
                status: "",
                issue_date: today,
                due_date: "",
                payment_method: "",
                total_amount: "0.00",
                paid_amount: "0.00",
                balance: "0.00"
            });
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
            // Prepare update data
            const updateData = {
                user_id: formData.supplier_id,
                status: formData.status.toLowerCase().replace(/ /g, "_"),
                issue_date: formData.issue_date,
                due_date: formData.due_date,
                payment_method: formData.payment_method,
                total_amount: formData.total_amount,
                paid_amount: formData.paid_amount,
                currency: "SAR",
            };
            
            console.log("Submitting data:", updateData);
            
            let response;
            
            if (isEdit && paymentOrder) {
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
            onSave(response.data.data);
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
        { id: "Cheque", label: "Cheque" }
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
                        <div className="grid grid-cols-2 gap-4">
                            <SelectFloating
                                label="Supplier"
                                name="supplier_id"
                                value={formData.supplier_id}
                                onChange={handleChange}
                                options={supplierOptions}
                                error={errors.supplier_id}
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
                        
                        <div className="grid grid-cols-3 gap-4">
                            <SelectFloating
                                label="Payment Terms"
                                name="payment_method"
                                value={formData.payment_method}
                                onChange={handleChange}
                                options={paymentTermsOptions}
                                error={errors.payment_method}
                            />
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