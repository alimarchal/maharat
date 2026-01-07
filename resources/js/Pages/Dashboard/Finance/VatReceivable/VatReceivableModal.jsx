import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUpload } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";

const VatReceivableModal = ({ isOpen, onClose, onSave }) => {
    const [paymentOrders, setPaymentOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        payment_order_number: "",
        refund_amount: "",
        refund_date: new Date().toISOString().split("T")[0],
        reference_number: "",
        description: "",
        attachment: null,
    });
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [selectedPaymentOrder, setSelectedPaymentOrder] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchPaymentOrders();
            // Reset form when modal opens
            setFormData({
                payment_order_number: "",
                refund_amount: "",
                refund_date: new Date().toISOString().split("T")[0],
                reference_number: "",
                description: "",
                attachment: null,
            });
            setSelectedPaymentOrder(null);
            setErrors({});
        }
    }, [isOpen]);

    const fetchPaymentOrders = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/v1/vat-receivable");
            setPaymentOrders(response.data.data || []);
        } catch (error) {
            console.error("Error fetching payment orders:", error);
            setErrors({
                submit: error.response?.data?.message || "Failed to fetch payment orders",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        // When payment order is selected, update selectedPaymentOrder and set max refund amount
        if (name === "payment_order_number") {
            const selected = paymentOrders.find(
                (po) => po.payment_order_number === value
            );
            setSelectedPaymentOrder(selected);
            if (selected) {
                setFormData((prev) => ({
                    ...prev,
                    refund_amount: "",
                    reference_number: selected.payment_order_number,
                }));
            }
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (e.g., max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setErrors({
                    attachment: "File size must be less than 10MB",
                });
                return;
            }
            setFormData((prev) => ({
                ...prev,
                attachment: file,
            }));
            if (errors.attachment) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.attachment;
                    return newErrors;
                });
            }
        }
    };

    const handleRemoveFile = () => {
        setFormData((prev) => ({
            ...prev,
            attachment: null,
        }));
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        // Validation
        const newErrors = {};
        if (!formData.payment_order_number) {
            newErrors.payment_order_number = "Payment order is required";
        }
        if (!formData.refund_amount || parseFloat(formData.refund_amount) <= 0) {
            newErrors.refund_amount = "Refund amount must be greater than 0";
        }
        if (selectedPaymentOrder) {
            const maxRefund = selectedPaymentOrder.vat_unpaid_amount;
            const refundAmount = parseFloat(formData.refund_amount);
            if (refundAmount > maxRefund) {
                newErrors.refund_amount = `Refund amount cannot exceed unpaid VAT (${maxRefund.toFixed(2)} SAR)`;
            }
        }
        if (!formData.refund_date) {
            newErrors.refund_date = "Refund date is required";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSaving(true);
        try {
            const submitData = new FormData();
            submitData.append("payment_order_number", formData.payment_order_number);
            submitData.append("refund_amount", formData.refund_amount);
            submitData.append("refund_date", formData.refund_date);
            submitData.append("reference_number", formData.reference_number || formData.payment_order_number);
            submitData.append("description", formData.description || "");
            if (formData.attachment) {
                submitData.append("attachment", formData.attachment);
            }

            const response = await axios.post("/api/v1/vat-receivable/refund", submitData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                onSave(response.data.data);
                onClose();
            }
        } catch (error) {
            console.error("Error recording VAT refund:", error);
            setErrors({
                submit:
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Failed to record VAT refund",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        Record VAT Refund
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {errors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-5 w-5 text-red-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    {errors.submit}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Payment Order Selection */}
                    <div>
                        <SelectFloating
                            label="Payment Order (Reference Number)"
                            name="payment_order_number"
                            value={formData.payment_order_number}
                            onChange={handleInputChange}
                            error={errors.payment_order_number}
                            required
                        >
                            <option value="">Select Payment Order</option>
                            {paymentOrders.map((po) => (
                                <option
                                    key={po.id}
                                    value={po.payment_order_number}
                                >
                                    {po.payment_order_number} - {po.supplier_name || "N/A"} - 
                                    VAT Paid: {po.vat_paid.toFixed(2)} SAR | 
                                    Available: {po.vat_unpaid_amount.toFixed(2)} SAR
                                </option>
                            ))}
                        </SelectFloating>
                        {selectedPaymentOrder && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-gray-700">
                                    <strong>Purchase Order:</strong> {selectedPaymentOrder.purchase_order_no || "N/A"}
                                </p>
                                <p className="text-sm text-gray-700">
                                    <strong>Original VAT Amount:</strong> {selectedPaymentOrder.vat_amount.toFixed(2)} SAR
                                </p>
                                <p className="text-sm font-semibold text-green-700">
                                    <strong>Actual VAT Paid:</strong> {selectedPaymentOrder.vat_paid.toFixed(2)} SAR
                                </p>
                                <p className="text-sm text-gray-700">
                                    <strong>VAT Refunded:</strong> {selectedPaymentOrder.vat_refunded_amount.toFixed(2)} SAR
                                </p>
                                <p className="text-sm font-bold text-blue-700">
                                    <strong>VAT Available for Refund:</strong> {selectedPaymentOrder.vat_unpaid_amount.toFixed(2)} SAR
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Refund Amount */}
                    <InputFloating
                        label="Refund Amount (SAR)"
                        type="number"
                        name="refund_amount"
                        value={formData.refund_amount}
                        onChange={handleInputChange}
                        error={errors.refund_amount}
                        step="0.01"
                        min="0.01"
                        max={selectedPaymentOrder?.vat_unpaid_amount || ""}
                        required
                    />

                    {/* Refund Date */}
                    <InputFloating
                        label="Refund Date"
                        type="date"
                        name="refund_date"
                        value={formData.refund_date}
                        onChange={handleInputChange}
                        error={errors.refund_date}
                        required
                    />

                    {/* Reference Number */}
                    <InputFloating
                        label="Reference Number"
                        type="text"
                        name="reference_number"
                        value={formData.reference_number}
                        onChange={handleInputChange}
                        placeholder="Government reference number (optional)"
                    />

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Additional notes about the VAT refund"
                        />
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Attachment (Optional)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <FontAwesomeIcon icon={faUpload} />
                                <span>Upload File</span>
                            </button>
                            {formData.attachment && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-700">
                                        {formData.attachment.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>
                            )}
                        </div>
                        {errors.attachment && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.attachment}
                            </p>
                        )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                            disabled={isSaving || loading}
                        >
                            {isSaving ? "Recording..." : "Record Refund"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VatReceivableModal;

