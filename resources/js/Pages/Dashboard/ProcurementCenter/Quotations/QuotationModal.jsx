import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "@/Components/InputFloating";
import SelectFloating from "@/Components/SelectFloating";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";

const QuotationModal = ({
    isOpen,
    onClose,
    onSave,
    quotation = null,
    isEdit = false,
    rfqId,
}) => {
    const [formData, setFormData] = useState({
        company_name: "Maharat",
        supplier_name: "",
        issue_date: "",
        valid_until: "",
        total_amount: "",
        vat_amount: "",
        document: null,
    });

    const [companies, setCompanies] = useState([{ id: 1, name: "Maharat" }]);
    const [suppliers, setSuppliers] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [tempDocument, setTempDocument] = useState(null);
    const [existingDocument, setExistingDocument] = useState(null);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = React.useRef();

    useEffect(() => {
        if (isOpen) {
            fetchFormData();

            if (isEdit && quotation) {
                if (quotation.documents && quotation.documents.length > 0) {
                    setExistingDocument(quotation.documents[0]);
                    if (quotation.documents[0].original_name) {
                        const name = quotation.documents[0].original_name;
                        if (name.endsWith(".pdf.pdf")) {
                            const correctedName = name.replace(
                                ".pdf.pdf",
                                ".pdf"
                            );
                            const corrected = {
                                ...quotation.documents[0],
                                original_name: correctedName,
                            };
                            setExistingDocument(corrected);
                        }
                    }
                } else {
                    setExistingDocument(null);
                }
                setFormData({
                    company_name: "Maharat",
                    supplier_name: quotation.supplier_name || "",
                    issue_date: formatDateForInput(quotation.issue_date) || "",
                    valid_until:
                        formatDateForInput(quotation.valid_until) || "",
                    total_amount: quotation.total_amount || "",
                    vat_amount: quotation.vat_amount || "",
                    id: quotation.id,
                    quotation_number: quotation.quotation_number,
                });
            } else {
                const today = new Date().toISOString().split("T")[0];
                setFormData({
                    company_name: "Maharat",
                    supplier_name: "",
                    issue_date: today,
                    valid_until: "",
                    total_amount: "",
                    vat_amount: "",
                    document: null,
                });
                setExistingDocument(null);
                setTempDocument(null);
            }
        }
    }, [isOpen, quotation, isEdit]);

    const fetchFormData = async () => {
        try {
            // Fetch all suppliers
            const suppliersResponse = await axios.get("/api/v1/suppliers");
            const allSuppliers = suppliersResponse.data.data || [];
            
            // Fetch existing quotations for this RFQ to filter out used suppliers
            let usedSupplierIds = new Set();
            if (rfqId) {
                try {
                    const quotationsResponse = await axios.get(`/api/v1/quotations?rfq_id=${rfqId}`);
                    const existingQuotations = quotationsResponse.data.data || [];
                    console.log("Existing quotations for RFQ:", existingQuotations);
                    usedSupplierIds = new Set(existingQuotations.map(q => q.supplier_id));
                    console.log("Used supplier IDs:", Array.from(usedSupplierIds));
                    
                    // In edit mode, remove the current quotation's supplier from the used list
                    // so it can still be selected
                    if (isEdit && quotation && quotation.supplier_id) {
                        usedSupplierIds.delete(quotation.supplier_id);
                        console.log("Removed current supplier from used list:", quotation.supplier_id);
                    }
                } catch (error) {
                    console.error("Error fetching existing quotations:", error);
                }
            }
            
            // Filter suppliers to exclude those already used for this RFQ
            const availableSuppliers = allSuppliers.filter(supplier => 
                !usedSupplierIds.has(supplier.id)
            );
            
            console.log("All suppliers count:", allSuppliers.length);
            console.log("Available suppliers count:", availableSuppliers.length);
            console.log("Available suppliers:", availableSuppliers);
            
            setSuppliers(availableSuppliers);
        } catch (error) {
            setErrors({ fetch: "Failed to load form data" });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setTempDocument(file);
            setUploadError("");
        }
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setErrors({});
        setUploadError("");

        const validationErrors = {};
        if (!formData.supplier_name)
            validationErrors.supplier_name = "Supplier is required";
        if (!formData.issue_date)
            validationErrors.issue_date = "Issue date is required";
        if (!formData.total_amount)
            validationErrors.total_amount = "Amount is required";
        if (formData.vat_amount && isNaN(formData.vat_amount))
            validationErrors.vat_amount = "VAT amount must be a valid number";
        if (formData.vat_amount && parseFloat(formData.vat_amount) < 0)
            validationErrors.vat_amount = "VAT amount cannot be negative";
        
        // Make attachment required
        if (!tempDocument && !existingDocument) {
            validationErrors.document = "Attachment is required";
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsSaving(false);
            return;
        }

        try {
            // Hardcode company to Maharat
            const companyId = 1; // Assuming Maharat has ID 1

            let supplierId = null;
            if (formData.supplier_name) {
                const supplier = suppliers.find(
                    (s) => s.name === formData.supplier_name
                );
                supplierId = supplier ? supplier.id : null;
            }

            if (!supplierId) {
                setErrors({
                    supplier_name: "Selected supplier not found in system",
                });
                setIsSaving(false);
                return;
            }

            // For updates, use axios directly instead of FormData to avoid issues
            if (isEdit) {
                const updatePayload = {
                    id: quotation.id,
                    quotation_number: formData.quotation_number,
                    company_id: companyId,
                    rfq_company_id: companyId,
                    supplier_id: supplierId,
                    issue_date: formData.issue_date,
                    valid_until: formData.valid_until,
                    total_amount: formData.total_amount,
                    vat_amount: formData.vat_amount,
                    rfq_id: rfqId,
                    update_rfq: true,
                    updated_at: new Date().toISOString(),
                };
                const response = await axios.put(
                    `/api/v1/quotations/${quotation.id}`,
                    updatePayload
                );
                if (tempDocument) {
                    const uploadSuccess = await uploadDocumentToServer(
                        quotation.id,
                        tempDocument
                    );
                    if (!uploadSuccess) {
                        setUploadError("Failed to upload document. Please try again.");
                        setIsSaving(false);
                        return;
                    }
                    // Clear file input after upload
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }
                await axios.get(
                    `/api/v1/quotations/${
                        quotation.id
                    }?t=${new Date().getTime()}`
                );

                onSave();
                onClose();
                return;
            }

            const formDataToSend = new FormData();
            const dataToSubmit = {
                company_id: companyId,
                rfq_company_id: companyId,
                supplier_id: supplierId,
                issue_date: formData.issue_date,
                valid_until: formData.valid_until,
                total_amount: formData.total_amount,
                vat_amount: formData.vat_amount,
                rfq_id: rfqId,
                update_rfq: true,
                quotation_number: "",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            Object.keys(dataToSubmit).forEach((key) => {
                if (
                    dataToSubmit[key] !== null &&
                    dataToSubmit[key] !== undefined
                ) {
                    formDataToSend.append(key, dataToSubmit[key]);
                }
            });

            if (tempDocument) {
                formDataToSend.append("document", tempDocument);
            }

            // Create new quotation
            const response = await axios.post(
                "/api/v1/quotations",
                formDataToSend
            );
            if (tempDocument && response.data.data && response.data.data.id) {
                const uploadSuccess = await uploadDocumentToServer(
                    response.data.data.id,
                    tempDocument
                );
                if (!uploadSuccess) {
                    setUploadError("Failed to upload document. Please try again.");
                    setIsSaving(false);
                    return;
                }
                // Clear file input after upload
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
            onSave();
            onClose();
        } catch (error) {
            if (error.response) {
                if (error.response.data?.errors) {
                    setErrors(error.response.data.errors);
                } else {
                    setErrors({
                        submit:
                            error.response.data?.message ||
                            "Failed to save quotation",
                    });
                }
            } else if (error.request) {
                setErrors({
                    submit: "Request was made but no response received",
                });
            } else {
                setErrors({
                    submit: error.message || "Failed to save quotation",
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const uploadDocumentToServer = async (quotationId, file) => {
        if (!file) return true;
        const formData = new FormData();
        formData.append("document", file);
        formData.append("quotation_id", quotationId);
        formData.append("type", "quotation");
        try {
            await axios.post("/api/v1/quotation-documents", formData, {
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
        if (filePath && filePath.endsWith(".pdf.pdf")) {
            return filePath.replace(".pdf.pdf", ".pdf");
        }
        return filePath;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-3xl">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        {isEdit ? "Edit Quotation" : "Add Quotation"}
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
                        {/* <SelectFloating
                            label="Company"
                            name="company_name"
                            value="Maharat"
                            onChange={handleChange}
                            options={[{ id: "Maharat", label: "Maharat" }]}
                            error={errors.company_name}
                            disabled={true}
                        /> */}
                        <SelectFloating
                            label="Supplier"
                            name="supplier_name"
                            value={formData.supplier_name}
                            onChange={handleChange}
                            options={suppliers.map((supplier) => ({
                                id: supplier.name,
                                label: supplier.name,
                            }))}
                            error={errors.supplier_name}
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
                            label="Select Expiry Date"
                            name="valid_until"
                            type="date"
                            value={formData.valid_until}
                            onChange={handleChange}
                            error={errors.valid_until}
                        />
                        <InputFloating
                            label="Amount"
                            name="total_amount"
                            type="number"
                            value={formData.total_amount}
                            onChange={handleChange}
                            error={errors.total_amount}
                        />
                        <InputFloating
                            label="VAT Amount"
                            name="vat_amount"
                            type="number"
                            value={formData.vat_amount}
                            onChange={handleChange}
                            error={errors.vat_amount}
                        />
                    </div>

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
                                <div className="text-red-500 text-xs mt-1 text-center">{uploadError}</div>
                            )}
                            {errors.document && (
                                <div className="text-red-500 text-xs mt-1 text-center">{errors.document}</div>
                            )}
                        </div>
                    </div>

                    <div className="my-4 flex justify-center w-full">
                        <button
                            type="submit"
                            className="px-6 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full"
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

export default QuotationModal;
