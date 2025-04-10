import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "../../../Components/InputFloating";
import SelectFloating from "../../../Components/SelectFloating";

const ApproveOrder = ({ isOpen, onClose, onSave, quotationId, purchaseOrder = null, isEdit = false }) => {
    const [formData, setFormData] = useState({
        purchase_order_no: "",
        company_name: "",
        issue_date: "",
        expiry_date: "",
        amount: "",
        attachment: null,
        quotation_id: quotationId
    });

    const [companies, setCompanies] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [tempDocument, setTempDocument] = useState(null);

    const generatePONumber = () => {
        // Simple PO number format: PO-YYYYMMDD-XXXX
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
        const poNumber = `PO-${year}${month}${day}-${random}`;
        
        setFormData(prev => ({
            ...prev,
            purchase_order_no: poNumber
        }));
    };

    const fetchPurchaseOrderDetails = async () => {
        try {
            console.log('Fetching purchase order details for ID:', purchaseOrder?.id);
            const response = await axios.get(`/api/v1/purchase-orders/${purchaseOrder?.id}`);
            console.log('Purchase order details:', response.data);
            
            if (response.data) {
                setFormData({
                    purchase_order_no: response.data.purchase_order_no || "",
                    company_name: response.data.company_name || "",
                    issue_date: response.data.issue_date || "",
                    expiry_date: response.data.expiry_date || "",
                    amount: response.data.amount || "",
                    attachment: response.data.attachment || null,
                    quotation_id: quotationId
                });
            }
        } catch (error) {
            console.error('Error fetching purchase order details:', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchCompanies();
            if (isEdit && purchaseOrder) {
                console.log('Loading existing purchase order:', purchaseOrder);
                fetchPurchaseOrderDetails();
            } else {
                console.log('Generating new PO number');
                generatePONumber();
                setFormData(prev => ({
                    ...prev,
                    company_name: "",
                    issue_date: "",
                    expiry_date: "",
                    amount: "",
                    attachment: null,
                    quotation_id: quotationId
                }));
            }
        }
    }, [isOpen, purchaseOrder, isEdit, quotationId]);

    const fetchCompanies = async () => {
        try {
            const response = await axios.get('/api/v1/companies');
            setCompanies(response.data.data || []);
        } catch (error) {
            console.error('Error fetching companies:', error);
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
            setTempDocument(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setErrors({});

        // Validate required fields
        const validationErrors = {};
        if (!formData.company_name) validationErrors.company_name = "Company is required";
        if (!formData.issue_date) validationErrors.issue_date = "Issue date is required";
        if (!formData.expiry_date) validationErrors.expiry_date = "Expiry date is required";
        if (!formData.amount) validationErrors.amount = "Amount is required";

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsSaving(false);
            return;
        }

        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== undefined) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            if (tempDocument) {
                formDataToSend.append('attachment', tempDocument);
            }

            console.log('Submitting purchase order:', {
                isEdit,
                purchaseOrder,
                formData: Object.fromEntries(formDataToSend)
            });

            if (isEdit && purchaseOrder) {
                // Update existing purchase order
                await axios.put(`/api/v1/purchase-orders/${purchaseOrder.id}`, formDataToSend);
                console.log('Purchase order updated successfully');
            } else {
                // Create new purchase order
                await axios.post('/api/v1/purchase-orders', formDataToSend);
                console.log('Purchase order created successfully');
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving purchase order:', error);
            setErrors({ submit: error.response?.data?.message || "Failed to save purchase order" });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-lg">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        {isEdit ? "Edit Purchase Order" : "Create Purchase Order"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputFloating
                        label="PO Number"
                        name="purchase_order_no"
                        value={formData.purchase_order_no}
                        onChange={handleChange}
                        disabled={true}
                        error={errors.purchase_order_no}
                    />
                    <SelectFloating
                        label="Company"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        options={companies.map(company => ({
                            id: company.id,
                            label: company.name
                        }))}
                        error={errors.company_name}
                    />
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
                        name="expiry_date"
                        type="date"
                        value={formData.expiry_date}
                        onChange={handleChange}
                        error={errors.expiry_date}
                    />
                    <InputFloating
                        label="Amount"
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handleChange}
                        error={errors.amount}
                    />
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Attachment
                        </label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-[#009FDC] file:text-white
                                hover:file:bg-[#007BB5]"
                        />
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

export default ApproveOrder;
