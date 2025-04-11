import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "@/Components/InputFloating";
import SelectFloating from "@/Components/SelectFloating";
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const QuotationModal = ({ isOpen, onClose, onSave, quotation = null, isEdit = false, rfqId }) => {
    const [formData, setFormData] = useState({
        company_name: "",
        supplier_name: "",
        issue_date: "",
        valid_until: "",
        total_amount: "",
        document: null
    });

    const [companies, setCompanies] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [tempDocument, setTempDocument] = useState(null);
    const [existingDocument, setExistingDocument] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchFormData();
            
            if (isEdit && quotation) {
                console.log("Setting up form for edit mode with quotation:", quotation);
                
                // If there's a document in the quotation, store it
                if (quotation.documents && quotation.documents.length > 0) {
                    setExistingDocument(quotation.documents[0]);
                    console.log("Existing document found:", quotation.documents[0]);
                    
                    // Check for duplicate extension and fix display name
                    if (quotation.documents[0].original_name) {
                        const name = quotation.documents[0].original_name;
                        if (name.endsWith('.pdf.pdf')) {
                            const correctedName = name.replace('.pdf.pdf', '.pdf');
                            const corrected = {...quotation.documents[0], original_name: correctedName};
                            setExistingDocument(corrected);
                        }
                    }
                } else {
                    setExistingDocument(null);
                }
                
                setFormData({
                    company_name: quotation.company_name || "",
                    supplier_name: quotation.supplier_name || "",
                    issue_date: formatDateForInput(quotation.issue_date) || "",
                    valid_until: formatDateForInput(quotation.valid_until) || "",
                    total_amount: quotation.total_amount || "",
                    id: quotation.id, // Add the ID to the form data
                    quotation_number: quotation.quotation_number // Store the quotation number
                });
            } else {
                // Reset form for new quotation
                const today = new Date().toISOString().split('T')[0];
                setFormData({
                    company_name: "",
                    supplier_name: "",
                    issue_date: today,
                    valid_until: "",
                    total_amount: "",
                    document: null
                });
                setExistingDocument(null);
                setTempDocument(null);
            }
        }
    }, [isOpen, quotation, isEdit]);

    const fetchFormData = async () => {
        try {
            // Fetch companies
            const companiesResponse = await axios.get('/api/v1/companies');
            setCompanies(companiesResponse.data.data || []);
            
            // Fetch suppliers
            const suppliersResponse = await axios.get('/api/v1/suppliers');
            setSuppliers(suppliersResponse.data.data || []);
        } catch (error) {
            console.error('Error fetching form data:', error);
            setErrors({ fetch: "Failed to load form data" });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log("New file selected:", file.name);
            setTempDocument(file);
        }
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setErrors({});

        // Validate required fields
        const validationErrors = {};
        if (!formData.company_name) validationErrors.company_name = "Company is required";
        if (!formData.supplier_name) validationErrors.supplier_name = "Supplier is required";
        if (!formData.issue_date) validationErrors.issue_date = "Issue date is required";
        if (!formData.total_amount) validationErrors.total_amount = "Amount is required";

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsSaving(false);
            return;
        }

        try {
            // Find company ID and supplier ID from names
            let companyId = null;
            if (formData.company_name) {
                const company = companies.find(c => c.name === formData.company_name);
                companyId = company ? company.id : null;
            }
            
            let supplierId = null;
            if (formData.supplier_name) {
                const supplier = suppliers.find(s => s.name === formData.supplier_name);
                supplierId = supplier ? supplier.id : null;
            }

            // Check if we have valid IDs
            if (!companyId) {
                console.error("Company ID not found for:", formData.company_name);
                setErrors({ company_name: "Selected company not found in system" });
                setIsSaving(false);
                return;
            }
            
            if (!supplierId) {
                console.error("Supplier ID not found for:", formData.supplier_name);
                setErrors({ supplier_name: "Selected supplier not found in system" });
                setIsSaving(false);
                return;
            }

            // For updates, use axios directly instead of FormData to avoid issues
            if (isEdit) {
                console.log("Updating quotation ID:", quotation.id);
                
                // Create the payload for update - with all required fields
                const updatePayload = {
                    id: quotation.id,
                    quotation_number: formData.quotation_number, // Important: keep the original quotation number
                    company_id: companyId,
                    rfq_company_id: companyId,
                    supplier_id: supplierId,
                    issue_date: formData.issue_date,
                    valid_until: formData.valid_until,
                    total_amount: formData.total_amount,
                    rfq_id: rfqId,
                    update_rfq: true,
                    updated_at: new Date().toISOString()
                };
                
                console.log("Update payload:", updatePayload);
                
                // Try the update with JSON data first
                const response = await axios.put(`/api/v1/quotations/${quotation.id}`, updatePayload);
                console.log("Update response:", response.data);
                
                // If there's a new document, upload it separately
                if (tempDocument) {
                    console.log("Uploading new document for existing quotation");
                    await uploadDocumentToServer(quotation.id, tempDocument);
                }
                
                // Force a refetch to see if our changes took effect
                await axios.get(`/api/v1/quotations/${quotation.id}?t=${new Date().getTime()}`);
                
                onSave();
                onClose();
                return;
            }
            
            // For new records, use FormData as before
            const formDataToSend = new FormData();
            
            // Prepare the data to submit
            const dataToSubmit = {
                company_id: companyId,
                rfq_company_id: companyId,
                supplier_id: supplierId,
                issue_date: formData.issue_date,
                valid_until: formData.valid_until,
                total_amount: formData.total_amount,
                rfq_id: rfqId,
                update_rfq: true,
                quotation_number: '', // Let the server generate the quotation number
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            console.log("Creating new quotation with data:", dataToSubmit);
            
            // Add data to FormData
            Object.keys(dataToSubmit).forEach(key => {
                if (dataToSubmit[key] !== null && dataToSubmit[key] !== undefined) {
                    formDataToSend.append(key, dataToSubmit[key]);
                }
            });

            // Add document if present
            if (tempDocument) {
                formDataToSend.append('document', tempDocument);
            }

            // Create new quotation
            const response = await axios.post('/api/v1/quotations', formDataToSend);
            console.log("Create response:", response.data);
            
            // If there's a document and creation was successful
            if (tempDocument && response.data.data && response.data.data.id) {
                // Upload the document to the newly created quotation
                console.log("Uploading document for new quotation");
                await uploadDocumentToServer(response.data.data.id, tempDocument);
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving quotation:', error);
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
                console.error('Error response headers:', error.response.headers);
                
                if (error.response.data?.errors) {
                    setErrors(error.response.data.errors);
                } else {
                    setErrors({ submit: error.response.data?.message || "Failed to save quotation" });
                }
            } else if (error.request) {
                console.error('Error request:', error.request);
                setErrors({ submit: "Request was made but no response received" });
            } else {
                console.error('Error message:', error.message);
                setErrors({ submit: error.message || "Failed to save quotation" });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const uploadDocumentToServer = async (quotationId, file) => {
        if (!file) return;
        
        const formData = new FormData();
        formData.append('document', file);
        formData.append('quotation_id', quotationId);
        formData.append('type', 'quotation');
    
        try {
            console.log(`Uploading document for quotation ID ${quotationId}:`, file.name);
            const response = await axios.post('/api/v1/quotation-documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.log("Document upload response:", response.data);
            return true;
        } catch (error) {
            console.error("Document upload error:", error);
            // We'll still consider the save successful even if document upload fails
            return false;
        }
    };

    const fixFilePath = (filePath) => {
        // Fix duplicate file extensions if necessary
        if (filePath && filePath.endsWith('.pdf.pdf')) {
            return filePath.replace('.pdf.pdf', '.pdf');
        }
        return filePath;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-2xl">
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
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{errors.submit}</span>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <SelectFloating
                            label="Company"
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleChange}
                            options={companies.map(company => ({
                                id: company.name,
                                label: company.name
                            }))}
                            error={errors.company_name}
                        />
                        <SelectFloating
                            label="Supplier"
                            name="supplier_name"
                            value={formData.supplier_name}
                            onChange={handleChange}
                            options={suppliers.map(supplier => ({
                                id: supplier.name,
                                label: supplier.name
                            }))}
                            error={errors.supplier_name}
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
                            label="Expiry Date"
                            name="valid_until"
                            type="date"
                            value={formData.valid_until}
                            onChange={handleChange}
                            error={errors.valid_until}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputFloating
                            label="Amount"
                            name="total_amount"
                            type="number"
                            value={formData.total_amount}
                            onChange={handleChange}
                            error={errors.total_amount}
                        />
                        
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Attachment (Optional)
                            </label>
                            
                            {/* Show existing document if available */}
                            {existingDocument && !tempDocument && (
                                <div className="flex items-center space-x-2 mb-2">
                                    <DocumentArrowDownIcon 
                                        className="h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700"
                                        onClick={() => existingDocument.file_path && window.open(fixFilePath(existingDocument.file_path), '_blank')}
                                    />
                                    <span 
                                        className="text-sm text-blue-600 cursor-pointer truncate max-w-[220px]" 
                                        title={existingDocument.original_name}
                                        onClick={() => existingDocument.file_path && window.open(fixFilePath(existingDocument.file_path), '_blank')}
                                    >
                                        {existingDocument.original_name}
                                    </span>
                                </div>
                            )}
                            
                            {/* Show selected file name if a new file is selected */}
                            {tempDocument && (
                                <div className="text-sm text-orange-600 mb-2 truncate max-w-[220px]" title={tempDocument.name}>
                                    Selected: {tempDocument.name}
                                </div>
                            )}
                            
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-[#009FDC] file:text-white
                                    hover:file:bg-[#007BB5]"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                            />
                        </div>
                    </div>
                    
                    <div className="my-4 flex justify-center w-full">
                        <button
                            type="submit"
                            className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full"
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : (isEdit ? "Save" : "Submit")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuotationModal; 