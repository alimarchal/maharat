import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";

const InvoiceModal = ({
    isOpen,
    onClose,
    onSave,
    invoice = null,
    isEdit = false,
}) => {
    const [formData, setFormData] = useState({
        supplier_id: "",
        amount: "",
        vat_amount: "",
        status: "Paid",
        type: "Cash",
        payable_date: new Date().toISOString().split("T")[0],
        purchase_order_id: "",
        invoice_no: "",
        invoice_date: "",
        total_amount: "",
        attachment: null,
    });

    const [suppliers, setSuppliers] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const statusOptions = [
        { id: "Paid", label: "Paid" },
        { id: "UnPaid", label: "Unpaid" },
        { id: "Partially Paid", label: "Partially Paid" },
    ];

    const paymentTypeOptions = [
        { id: "Cash", label: "Cash" },
        { id: "Credit upto 30 days", label: "Credit upto 30 days" },
        { id: "Credit upto 60 days", label: "Credit upto 60 days" },
        { id: "Credit upto 90 days", label: "Credit upto 90 days" },
        { id: "Credit upto 120 days", label: "Credit upto 120 days" },
    ];

    useEffect(() => {
        if (isOpen) {
            fetchSuppliers();
            fetchAvailablePurchaseOrders();

            if (invoice && isEdit) {
                setFormData({
                    supplier_id: invoice.supplier_id || "",
                    amount: invoice.amount || "",
                    vat_amount: invoice.vat_amount || "",
                    status: invoice.status || "Paid",
                    type: invoice.type || "Cash",
                    payable_date:
                        invoice.payable_date ||
                        new Date().toISOString().split("T")[0],
                    purchase_order_id: invoice.purchase_order_id || "",
                    invoice_no: invoice.invoice_no || "",
                    invoice_date: invoice.invoice_date || "",
                    total_amount: invoice.total_amount || "",
                    attachment: invoice.attachment || null,
                });
            } else {
                setFormData({
                    supplier_id: "",
                    amount: "",
                    vat_amount: "",
                    status: "Paid",
                    type: "Cash",
                    payable_date: new Date().toISOString().split("T")[0],
                    purchase_order_id: "",
                    invoice_no: "",
                    invoice_date: "",
                    total_amount: "",
                    attachment: null,
                });
            }
        }
    }, [isOpen, invoice, isEdit]);

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get("/api/v1/suppliers");
            setSuppliers(response.data.data || []);
        } catch {
            setErrors({ fetch: "Failed to load suppliers" });
        }
    };

    const fetchAvailablePurchaseOrders = async () => {
        try {
            const allPOsResponse = await axios.get("/api/v1/purchase-orders");
            const allInvoicesResponse = await axios.get(
                "/api/v1/external-invoices"
            );

            if (allPOsResponse.data.data && allInvoicesResponse.data.data) {
                const usedPOIds = allInvoicesResponse.data.data
                    .filter((invoice) => invoice.purchase_order_id)
                    .map((invoice) => invoice.purchase_order_id);

                const availablePOs = allPOsResponse.data.data
                    .filter((po) => !usedPOIds.includes(po.id))
                    .map((po) => ({
                        id: po.id,
                        label: po.purchase_order_no || `PO-${po.id}`,
                    }));
                setPurchaseOrders(availablePOs);
                return;
            }

            const response = await axios.get(
                "/api/v1/purchase-orders/available"
            );
            if (response.data.success) {
                const purchaseOrdersData = response.data.data.map((po) => ({
                    id: po.id,
                    label: po.purchase_order_no || `PO-${po.id}`,
                }));
                setPurchaseOrders(purchaseOrdersData);
            } else {
                setPurchaseOrders([]);
            }
        } catch (error) {
            console.error("Error fetching purchase orders:", error);
            setPurchaseOrders([]);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const processedValue =
            name === "purchase_order_id" || name === "supplier_id"
                ? parseInt(value, 10)
                : value;

        setFormData((prev) => {
            const newData = {
                ...prev,
                [name]: processedValue,
            };
            return newData;
        });
    };

    useEffect(() => {}, [formData]);

    useEffect(() => {
        if (isOpen && purchaseOrders.length > 0 && formData.purchase_order_id) {
            const selectedPO = purchaseOrders.find(
                (po) => po.id === formData.purchase_order_id
            );
        }
    }, [isOpen, purchaseOrders, formData.purchase_order_id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setErrors({});

        const submissionData = {
            ...formData,
            purchase_order_id: formData.purchase_order_id
                ? parseInt(formData.purchase_order_id, 10)
                : null,
            supplier_id: formData.supplier_id
                ? parseInt(formData.supplier_id, 10)
                : null,
            amount: formData.amount ? parseFloat(formData.amount) : null,
        };

        const validationErrors = {};
        if (!submissionData.supplier_id)
            validationErrors.supplier_id = "Supplier is required";
        if (!submissionData.amount)
            validationErrors.amount = "Amount is required";
        if (!submissionData.vat_amount)
            validationErrors.vat_amount = "VAT Amount is required";
        if (!submissionData.status)
            validationErrors.status = "Status is required";
        if (!submissionData.type)
            validationErrors.type = "Payment Type is required";
        if (!submissionData.payable_date)
            validationErrors.payable_date = "Payable date is required";
        if (!isEdit && !submissionData.purchase_order_id)
            validationErrors.purchase_order_id = "Purchase Order is required";

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsSaving(false);
            return;
        }

        try {
            onSave(submissionData);
            onClose();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({
                    submit:
                        error.response?.data?.message ||
                        "Failed to save invoice",
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-4xl">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        {isEdit
                            ? "Edit Customer Invoice"
                            : "Add Customer Invoice"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            {!isEdit && (
                                <SelectFloating
                                    label="Purchase Order"
                                    name="purchase_order_id"
                                    value={
                                        formData.purchase_order_id?.toString() ||
                                        ""
                                    }
                                    onChange={handleChange}
                                    options={purchaseOrders.map((po) => ({
                                        id: po.id.toString(),
                                        label: po.label,
                                    }))}
                                    error={errors.purchase_order_id}
                                />
                            )}
                            {isEdit && (
                                <InputFloating
                                    label="Payable Date"
                                    name="payable_date"
                                    type="date"
                                    value={formData.payable_date}
                                    onChange={handleChange}
                                    error={errors.payable_date}
                                />
                            )}
                        </div>
                        <div>
                            <SelectFloating
                                label="Supplier"
                                name="supplier_id"
                                value={formData.supplier_id?.toString() || ""}
                                onChange={handleChange}
                                options={suppliers.map((supplier) => ({
                                    id: supplier.id.toString(),
                                    label: supplier.name,
                                }))}
                                error={errors.supplier_id}
                            />
                        </div>
                        <div>
                            <InputFloating
                                label="Amount"
                                name="amount"
                                type="number"
                                value={formData.amount}
                                onChange={handleChange}
                                error={errors.amount}
                            />
                        </div>
                        <div>
                            <InputFloating
                                label="VAT Amount"
                                name="vat_amount"
                                type="number"
                                value={formData.vat_amount}
                                onChange={handleChange}
                                error={errors.vat_amount}
                            />
                        </div>
                        <div>
                            <SelectFloating
                                label="Payment Type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                options={paymentTypeOptions}
                                error={errors.type}
                            />
                        </div>
                        {!isEdit && (
                            <>
                                <div>
                                    <SelectFloating
                                        label="Status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        options={statusOptions}
                                        error={errors.status}
                                    />
                                </div>
                                <div>
                                    <InputFloating
                                        label="Invoice Date"
                                        name="payable_date"
                                        type="date"
                                        value={formData.payable_date}
                                        onChange={handleChange}
                                        error={errors.payable_date}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {isEdit && (
                        <div className="w-full flex justify-start mt-6">
                            <div className="w-1/2">
                                <SelectFloating
                                    label="Status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    options={statusOptions}
                                    error={errors.status}
                                />
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex justify-center w-full">
                        <button
                            type="submit"
                            className="w-full px-6 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5]"
                            disabled={isSaving}
                        >
                            {isSaving
                                ? "Saving..."
                                : isEdit
                                ? "Save"
                                : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InvoiceModal;
