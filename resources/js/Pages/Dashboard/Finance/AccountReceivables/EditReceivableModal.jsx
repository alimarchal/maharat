import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "@/Components/InputFloating";
import SelectFloating from "@/Components/SelectFloating";

// Add CSRF token setup for axios
axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.withCredentials = true;

const EditReceivableModal = ({ isOpen, onClose, onSave, invoiceId }) => {
    const [formData, setFormData] = useState({
        customer_id: "",
        status: "",
        issue_date: "",
        due_date: "",
        payment_method: "",
        total_amount: "",
        paid_amount: "",
        balance: "",
    });

    const [customers, setCustomers] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && invoiceId) {
            fetchCustomers();
            fetchInvoiceDetails();
        }
    }, [isOpen, invoiceId]);

    const fetchCustomers = async () => {
        try {
            const response = await axios.get("/api/v1/customers");
            setCustomers(response.data.data || []);
        } catch (error) {
            console.error("Error fetching customers:", error);
            setErrors({ fetch: "Failed to load customers" });
        }
    };

    const fetchInvoiceDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/v1/invoices/${invoiceId}`);
            const invoiceData = response.data.data;

            const subtotal = parseFloat(invoiceData.total_amount || 0);
            const paid = parseFloat(invoiceData.paid_amount || 0);
            const balance = (subtotal - paid).toFixed(2);

            setFormData({
                customer_id: invoiceData.client_id?.toString() || "",
                status: invoiceData.status || "Pending",
                issue_date: formatDateForInput(invoiceData.issue_date),
                due_date: formatDateForInput(invoiceData.due_date),
                payment_method: invoiceData.payment_method || "",
                total_amount: invoiceData.total_amount?.toString() || "",
                paid_amount: invoiceData.paid_amount?.toString() || "",
                balance,
            });

            setLoading(false);
        } catch (error) {
            console.error("Error fetching invoice details:", error);
            setErrors({ fetch: "Failed to load invoice details" });
            setLoading(false);
        }
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
    };

    const statusOptions = [
        { id: "Draft", label: "Draft" },
        { id: "Approved", label: "Approved" },
        { id: "Pending", label: "Pending" },
        { id: "Paid", label: "Paid" },
        { id: "Partially_Paid", label: "Partially Paid" },
        { id: "Overdue", label: "Overdue" },
        { id: "Cancelled", label: "Cancelled" }
    ];

    // Calculate suggested status based on dates and paid amount
    const calculateSuggestedStatus = () => {
        const today = new Date();
        const dueDate = formData.due_date ? new Date(formData.due_date) : null;
        const totalAmount = parseFloat(formData.total_amount) || 0;
        const paidAmount = parseFloat(formData.paid_amount) || 0;

        if (paidAmount === 0) {
            return dueDate && today > dueDate ? "Overdue" : "Pending";
        } else if (paidAmount < totalAmount) {
            return "Partially_Paid";
        } else if (paidAmount >= totalAmount) {
            return "Paid";
        }
        return "Draft";
    };

    // Update status when relevant fields change, but only if user hasn't manually changed it
    useEffect(() => {
        const suggestedStatus = calculateSuggestedStatus();
        setFormData(prev => ({
            ...prev,
            status: suggestedStatus
        }));
    }, [formData.due_date, formData.total_amount, formData.paid_amount]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let updatedData = { ...formData, [name]: value };

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

        const validationErrors = {};
        if (!formData.customer_id)
            validationErrors.customer_id = "Customer is required";
        if (!formData.status) validationErrors.status = "Status is required";
        if (!formData.issue_date)
            validationErrors.issue_date = "Issue date is required";
        if (!formData.payment_method)
            validationErrors.payment_method = "Payment terms is required";
        if (!formData.total_amount)
            validationErrors.total_amount = "Amount is required";

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsSaving(false);
            return;
        }

        try {
            const subtotal = parseFloat(formData.total_amount) || 0;
            const vatRate = 15;
            const taxAmount = (subtotal * vatRate) / 100;
            const total = subtotal + taxAmount;

            const updateData = {
                _method: 'PUT',
                client_id: formData.customer_id,
                status: formData.status,
                issue_date: formData.issue_date,
                due_date: formData.due_date || null,
                payment_method: formData.payment_method,
                vat_rate: vatRate,
                subtotal,
                tax_amount: taxAmount,
                total_amount: formData.total_amount,
                paid_amount: formData.paid_amount || "0.00",
                currency: "SAR",
                items: [
                    {
                        name: "Product",
                        description: "Service",
                        quantity: 1,
                        unit_price: subtotal,
                        subtotal,
                        tax_rate: vatRate,
                        tax_amount: taxAmount,
                        total,
                    },
                ],
            };

            console.log('Sending update data:', updateData);

            const response = await axios.post(
                `/api/v1/invoices/${invoiceId}`,
                updateData
            );
            onSave(response.data.data);
        } catch (error) {
            console.error('Update error:', error.response?.data || error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({
                    submit:
                        error.response?.data?.message ||
                        "Failed to update invoice",
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const paymentTermsOptions = [
        { id: "Cash", label: "Cash" },
        { id: "Credit", label: "Credit" },
        { id: "Bank Transfer", label: "Bank Transfer" },
        { id: "Cheque", label: "Cheque" },
    ];

    const customerOptions = customers.map((c) => ({
        id: c.id.toString(),
        label: c.name,
    }));

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        Edit Account Receivable
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
                        <span className="block sm:inline">
                            {" "}
                            {errors.submit}
                        </span>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-6">
                        <div className="w-10 h-10 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SelectFloating
                                label="Customer"
                                name="customer_id"
                                value={formData.customer_id}
                                onChange={handleChange}
                                options={customerOptions}
                                error={errors.customer_id}
                            />
                            <SelectFloating
                                label="Status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                options={statusOptions}
                                error={errors.status}
                            />
                            <InputFloating
                                label="Select Issue Date"
                                name="issue_date"
                                type="date"
                                value={formData.issue_date}
                                onChange={handleChange}
                                error={errors.issue_date}
                            />
                            <InputFloating
                                label="Select Due Date"
                                name="due_date"
                                type="date"
                                value={formData.due_date}
                                onChange={handleChange}
                                error={errors.due_date}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                        <div className="text-center mt-6">
                            <div className="text-xl font-semibold text-gray-700">
                                Balance:{" "}
                                <span className="text-[#009FDC]">
                                    {formData.balance} SAR
                                </span>
                            </div>
                        </div>

                        <div className="my-6 flex justify-center w-full">
                            <button
                                type="submit"
                                className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full"
                                disabled={isSaving}
                            >
                                {isSaving ? "Saving..." : "Update"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EditReceivableModal;
