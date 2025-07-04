import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";
import { usePage } from "@inertiajs/react";

const InvoiceModal = ({
    isOpen,
    onClose,
    onSave,
    invoice = null,
    isEdit = false,
}) => {
    const user_id = usePage().props.auth.user.id;
    
    const [formData, setFormData] = useState({
        supplier_id: "",
        amount: "",
        vat_amount: "",
        status: "UnPaid",
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
    const [tempDocument, setTempDocument] = useState(null);
    const [existingDocument, setExistingDocument] = useState(null);
    const [uploadError, setUploadError] = useState("");
    const [selectedPO, setSelectedPO] = useState(null);
    const fileInputRef = React.useRef();

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
                // Handle existing document for edit mode
                if (invoice.documents && invoice.documents.length > 0) {
                    setExistingDocument(invoice.documents[0]);
                    if (invoice.documents[0].original_name) {
                        const name = invoice.documents[0].original_name;
                        if (name.endsWith(".pdf.pdf")) {
                            const correctedName = name.replace(
                                ".pdf.pdf",
                                ".pdf"
                            );
                            const corrected = {
                                ...invoice.documents[0],
                                original_name: correctedName,
                            };
                            setExistingDocument(corrected);
                        }
                    }
                } else {
                    setExistingDocument(null);
                }

                // Get the purchase order details for this invoice
                if (invoice.purchase_order_id) {
                    fetchPurchaseOrderDetails(invoice.purchase_order_id);
                }

                setFormData({
                    supplier_id: invoice.supplier_id || "",
                    amount: invoice.amount || "",
                    vat_amount: invoice.vat_amount || "",
                    status: invoice.status || "UnPaid",
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
                    status: "UnPaid",
                    type: "Cash",
                    payable_date: new Date().toISOString().split("T")[0],
                    purchase_order_id: "",
                    invoice_no: "",
                    invoice_date: "",
                    total_amount: "",
                    attachment: null,
                });
                setExistingDocument(null);
                setSelectedPO(null);
            }
            
            // Always clear tempDocument when modal opens
            setTempDocument(null);
            // Clear file input if it exists
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }, [isOpen, invoice, isEdit]);

    // Debug useEffect to track formData changes
    useEffect(() => {
        console.log("FormData changed:", formData);
        console.log("Suppliers loaded:", suppliers.length);
        console.log("Current supplier_id:", formData.supplier_id);
        console.log("Supplier name lookup result:", getSupplierName(formData.supplier_id));
    }, [formData, suppliers]);

    // Clean up state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setTempDocument(null);
            setExistingDocument(null);
            setUploadError("");
            setSelectedPO(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }, [isOpen]);

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get("/api/v1/suppliers");
            console.log("Suppliers API response:", response.data);
            setSuppliers(response.data.data || []);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            setErrors({ fetch: "Failed to load suppliers" });
        }
    };

    // Helper function to get supplier name safely
    const getSupplierName = (supplierId) => {
        if (!supplierId || !suppliers.length) return "";
        
        // Try to find supplier by ID, handling both string and number types
        const supplier = suppliers.find(s => 
            s.id === supplierId || 
            s.id === parseInt(supplierId, 10) || 
            s.id === String(supplierId)
        );
        
        console.log("Looking for supplier ID:", supplierId, "Found:", supplier);
        return supplier?.name || "";
    };

    const fetchAvailablePurchaseOrders = async () => {
        try {
            // Fetch only approved purchase orders
            const response = await axios.get("/api/v1/purchase-orders?filter[status]=Approved");
            
            if (response.data.data) {
                const allPOs = response.data.data;
                const allInvoicesResponse = await axios.get("/api/v1/external-invoices");

                if (allInvoicesResponse.data.data) {
                    const usedPOIds = allInvoicesResponse.data.data
                        .filter((invoice) => invoice.purchase_order_id)
                        .map((invoice) => invoice.purchase_order_id);

                    const availablePOs = allPOs
                        .filter((po) => !usedPOIds.includes(po.id))
                        .map((po) => ({
                            id: po.id,
                            label: po.purchase_order_no || `PO-${po.id}`,
                            supplier_id: po.supplier_id,
                            amount: po.amount,
                            vat_amount: po.vat_amount,
                        }));
                    setPurchaseOrders(availablePOs);
                } else {
                    const availablePOs = allPOs.map((po) => ({
                        id: po.id,
                        label: po.purchase_order_no || `PO-${po.id}`,
                        supplier_id: po.supplier_id,
                        amount: po.amount,
                        vat_amount: po.vat_amount,
                    }));
                    setPurchaseOrders(availablePOs);
                }
            } else {
                setPurchaseOrders([]);
            }
        } catch (error) {
            console.error("Error fetching purchase orders:", error);
            setPurchaseOrders([]);
        }
    };

    const fetchPurchaseOrderDetails = async (poId) => {
        try {
            const response = await axios.get(`/api/v1/purchase-orders/${poId}`);
            if (response.data.data) {
                setSelectedPO(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching purchase order details:", error);
        }
    };

    const calculateTotalInvoiceAmount = async (poId) => {
        try {
            const response = await axios.get(`/api/v1/external-invoices?filter[purchase_order_id]=${poId}`);
            if (response.data.data) {
                let totalAmount = 0;
                if (isEdit && invoice) {
                    // In edit mode, exclude the current invoice from total calculation
                    totalAmount = response.data.data
                        .filter(inv => inv.id !== invoice.id)
                        .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
                } else {
                    // In create mode, include all invoices
                    totalAmount = response.data.data.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
                }
                setFormData((prev) => ({
                    ...prev,
                    total_amount: totalAmount.toFixed(2),
                }));
            }
        } catch (error) {
            console.error("Error calculating total invoice amount:", error);
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

            // Auto-populate supplier, amount, and VAT when purchase order is selected
            if (name === "purchase_order_id" && value) {
                const selectedPO = purchaseOrders.find(po => po.id === parseInt(value, 10));
                console.log("Selected PO:", selectedPO, "Value:", value);
                
                if (selectedPO) {
                    newData.supplier_id = selectedPO.supplier_id;
                    newData.amount = selectedPO.amount || "";
                    
                    // Get VAT from purchase order (if available) or calculate as 15% of amount
                    let vatAmount = parseFloat(selectedPO.vat_amount);
                    if (isNaN(vatAmount)) {
                        vatAmount = parseFloat(selectedPO.amount) * 0.15;
                    }
                    newData.vat_amount = vatAmount.toFixed(2);
                    
                    console.log("Setting supplier_id to:", selectedPO.supplier_id);
                    console.log("Setting amount to:", selectedPO.amount);
                    console.log("Setting vat_amount to:", newData.vat_amount);
                    
                    setSelectedPO(selectedPO);
                }
            }

            return newData;
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setTempDocument(file);
            setUploadError("");
        }
    };

    const uploadDocumentToServer = async (invoiceId, file) => {
        if (!file) return true;
        const formData = new FormData();
        formData.append("document", file);
        formData.append("invoice_id", invoiceId);
        formData.append("type", "invoice");
        try {
            await axios.post("/api/v1/invoice-documents", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return true;
        } catch (error) {
            setUploadError(
                error.response?.data?.message || "Failed to upload document."
            );
            return false;
        }
    };

    const fixFilePath = (filePath) => {
        if (!filePath) return null;
        if (filePath.startsWith("http")) return filePath;
        if (filePath.startsWith("/storage/")) return filePath;
        if (filePath.startsWith("invoices/")) return `/storage/${filePath}`;
        
        // Handle .pdf.pdf extension issue
        if (filePath.endsWith(".pdf.pdf")) {
            filePath = filePath.replace(".pdf.pdf", ".pdf");
        }
        
        return filePath;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setErrors({});
        setUploadError("");

        const submissionData = {
            user_id: user_id,
            purchase_order_id: formData.purchase_order_id
                ? parseInt(formData.purchase_order_id, 10)
                : null,
            supplier_id: formData.supplier_id
                ? parseInt(formData.supplier_id, 10)
                : null,
            amount: parseFloat(formData.amount) || 0,
            vat_amount: parseFloat(formData.vat_amount) || 0,
            status: formData.status,
            type: formData.type,
            payable_date: formData.payable_date,
        };

        const validationErrors = {};
        if (!submissionData.supplier_id)
            validationErrors.supplier_id = "Supplier is required";
        if (!submissionData.amount)
            validationErrors.amount = "Amount is required";
        if (!submissionData.vat_amount)
            validationErrors.vat_amount = "VAT amount is required";
        if (!submissionData.type)
            validationErrors.type = "Payment Type is required";
        if (!submissionData.payable_date)
            validationErrors.payable_date = "Payable date is required";
        if (!isEdit && !submissionData.purchase_order_id)
            validationErrors.purchase_order_id = "Purchase Order is required";

        // Make attachment required
        if (!tempDocument && !existingDocument) {
            validationErrors.attachment = "Attachment is required";
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsSaving(false);
            return;
        }

        try {
            if (isEdit) {
                // For edit mode, if a new file is selected, use FormData
                if (tempDocument) {
                    const formDataToSend = new FormData();
                    Object.keys(submissionData).forEach((key) => {
                        if (
                            submissionData[key] !== null &&
                            submissionData[key] !== undefined &&
                            key !== "attachment"
                        ) {
                            formDataToSend.append(key, submissionData[key]);
                        }
                    });
                    formDataToSend.append("attachment", tempDocument);

                    await axios.post(
                        `/api/v1/external-invoices/${invoice.id}?_method=PUT`,
                        formDataToSend,
                        {
                            headers: { "Content-Type": "multipart/form-data" },
                        }
                    );
                    // Clear file input after upload
                    if (fileInputRef.current) fileInputRef.current.value = "";
                } else {
                    // No new file, send JSON as before
                    await axios.put(
                        `/api/v1/external-invoices/${invoice.id}`,
                        submissionData
                    );
                }
                onSave(submissionData);
                onClose();
            } else {
                // For create mode, use FormData to include the file
                const formDataToSend = new FormData();
                Object.keys(submissionData).forEach((key) => {
                    if (
                        submissionData[key] !== null &&
                        submissionData[key] !== undefined &&
                        key !== "attachment"
                    ) {
                        formDataToSend.append(key, submissionData[key]);
                    }
                });

                if (tempDocument) {
                    formDataToSend.append("attachment", tempDocument);
                }

                await axios.post(
                    "/api/v1/external-invoices",
                    formDataToSend,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                    }
                );

                onSave(submissionData);
                onClose();
            }
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

                {errors.submit && (
                    <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                        role="alert"
                    >
                        <span className="block sm:inline">{errors.submit}</span>
                    </div>
                )}

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
                            <InputFloating
                                label="Supplier"
                                name="supplier_name"
                                type="text"
                                value={getSupplierName(formData.supplier_id)}
                                readOnly={true}
                                error={errors.supplier_id}
                            />
                        </div>
                        <div>
                            <InputFloating
                                label="Amount"
                                name="amount"
                                type="number"
                                value={formData.amount}
                                onChange={isEdit ? () => {} : handleChange}
                                onKeyDown={isEdit ? (e) => e.preventDefault() : undefined}
                                disabled={isEdit}
                                readOnly={isEdit}
                                error={errors.amount}
                            />
                        </div>
                        <div>
                            <InputFloating
                                label="VAT Amount"
                                name="vat_amount"
                                type="number"
                                value={formData.vat_amount}
                                onChange={isEdit ? () => {} : handleChange}
                                onKeyDown={isEdit ? (e) => e.preventDefault() : undefined}
                                disabled={isEdit}
                                readOnly={isEdit}
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
                        <div>
                            <InputFloating
                                label="Payable Date"
                                name="payable_date"
                                type="date"
                                value={formData.payable_date}
                                onChange={handleChange}
                                error={errors.payable_date}
                            />
                        </div>
                    </div>

                    {/* Attachment Section - Only in add mode, positioned after invoice date */}
                    {!isEdit && (
                        <div className="flex justify-center">
                            <div className="space-y-2 w-full max-w-sm">
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

                                <div className="flex justify-end">
                                    <input
                                        type="file"
                                        className="text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-[#009FDC] file:text-white
                                            hover:file:bg-[#007BB5]"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                        ref={fileInputRef}
                                    />
                                </div>

                                {uploadError && (
                                    <div className="text-red-500 text-xs mt-1 text-center">
                                        {uploadError}
                                    </div>
                                )}
                                {errors.attachment && (
                                    <div className="text-red-500 text-xs mt-1 text-center">
                                        {errors.attachment}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Attachment Section - Only in edit mode, at the bottom */}
                    {isEdit && (
                        <div className="flex justify-center">
                            <div className="space-y-2 w-full max-w-sm">
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
                                    Attachment
                                </label>

                                {existingDocument && !tempDocument && (
                                    <div className="flex items-center justify-center space-x-2 mb-2">
                                        <DocumentArrowDownIcon
                                            className="h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700"
                                            onClick={() =>
                                                existingDocument.file_path &&
                                                window.open(
                                                    fixFilePath(
                                                        existingDocument.file_path
                                                    ),
                                                    "_blank"
                                                )
                                            }
                                        />
                                        <span
                                            className="text-sm text-blue-600 cursor-pointer truncate max-w-[220px]"
                                            title={existingDocument.original_name}
                                            onClick={() =>
                                                existingDocument.file_path &&
                                                window.open(
                                                    fixFilePath(
                                                        existingDocument.file_path
                                                    ),
                                                    "_blank"
                                                )
                                            }
                                        >
                                            {existingDocument.original_name}
                                        </span>
                                    </div>
                                )}

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

                                <div className="flex justify-end">
                                    <input
                                        type="file"
                                        className="text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-[#009FDC] file:text-white
                                            hover:file:bg-[#007BB5]"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                        ref={fileInputRef}
                                    />
                                </div>

                                {uploadError && (
                                    <div className="text-red-500 text-xs mt-1 text-center">
                                        {uploadError}
                                    </div>
                                )}
                                {errors.attachment && (
                                    <div className="text-red-500 text-xs mt-1 text-center">
                                        {errors.attachment}
                                    </div>
                                )}
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
