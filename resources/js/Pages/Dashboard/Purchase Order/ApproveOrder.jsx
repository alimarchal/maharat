import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "../../../Components/InputFloating";
import SelectFloating from "../../../Components/SelectFloating";

const ApproveOrder = ({ isOpen, onClose, onSave, quotationId, purchaseOrder = null, isEdit = false }) => {
    const [formData, setFormData] = useState({
        purchase_order_no: "",
        supplier_id: "",
        purchase_order_date: "",
        expiry_date: "",
        amount: "",
        attachment: null,
        status: "Approved",
        quotation_id: quotationId,
        rfq_id: ""
    });

    const [companies, setCompanies] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [tempDocument, setTempDocument] = useState(null);
    const [quotationDetails, setQuotationDetails] = useState(null);

    const generatePONumber = () => {
        // Simple PO number format: PO-YYYYMMDD-XXXX
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
        return `PO-${year}${month}${day}-${random}`;
    };

    const fetchQuotationDetails = async () => {
        try {
            console.log('Fetching quotation details for quotation ID:', quotationId);
            const response = await axios.get(`/api/v1/quotations/${quotationId}`);
            console.log('Quotation details:', response.data);
            
            if (response.data.data) {
                const quotation = response.data.data;
                setQuotationDetails(quotation);
                
                // Set the RFQ ID from the quotation
                const rfqId = quotation.rfq?.id;
                console.log('RFQ ID from quotation:', rfqId);
                
                if (rfqId) {
                    setFormData(prev => ({
                        ...prev,
                        rfq_id: rfqId
                    }));
                }
                
                // Set supplier_id from quotation if available
                if (quotation.supplier_id) {
                    setFormData(prev => ({
                        ...prev,
                        supplier_id: quotation.supplier_id
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching quotation details:', error);
        }
    };

    const fetchPurchaseOrderDetails = async () => {
        try {
            console.log('Fetching purchase order details for ID:', purchaseOrder?.id);
            const response = await axios.get(`/api/v1/purchase-orders/${purchaseOrder?.id}`);
            console.log('Purchase order details:', response.data);
            
            if (response.data.data) {
                const orderData = response.data.data;
                setFormData({
                    purchase_order_no: orderData.purchase_order_no || "",
                    supplier_id: orderData.supplier_id || "",
                    purchase_order_date: orderData.purchase_order_date || "",
                    expiry_date: orderData.expiry_date || "",
                    amount: orderData.amount || "",
                    attachment: orderData.attachment || null,
                    status: orderData.status || "Approved",
                    quotation_id: quotationId,
                    rfq_id: orderData.rfq_id || ""
                });
                
                // If the RFQ ID is missing in the purchase order, fetch it from the quotation
                if (!orderData.rfq_id) {
                    fetchQuotationDetails();
                }
            }
        } catch (error) {
            console.error('Error fetching purchase order details:', error);
        }
    };

    useEffect(() => {
        if (isOpen && quotationId) {
            fetchCompanies();
            fetchQuotationDetails();
            
            if (isEdit && purchaseOrder) {
                console.log('Loading existing purchase order:', purchaseOrder);
                fetchPurchaseOrderDetails();
            } else {
                console.log('Setting up new purchase order form');
                // Generate PO number for new purchase orders
                const poNumber = generatePONumber();
                setFormData(prev => ({
                    ...prev,
                    purchase_order_no: poNumber,
                    quotation_id: quotationId
                }));
            }
        }
    }, [isOpen, isEdit, quotationId]);

    const fetchCompanies = async () => {
        try {
            const response = await axios.get('/api/v1/suppliers');
            setCompanies(response.data.data || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
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
        if (!formData.supplier_id) validationErrors.supplier_id = "Supplier is required";
        if (!formData.purchase_order_date) validationErrors.purchase_order_date = "Issue date is required";
        if (!formData.amount) validationErrors.amount = "Amount is required";
        if (!formData.rfq_id) validationErrors.rfq_id = "RFQ ID is missing. Please refresh and try again.";

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsSaving(false);
            return;
        }

        try {
            const formDataToSend = new FormData();
            
            // Make sure we have all necessary data
            const dataToSubmit = { ...formData };
            
            // Ensure we have a purchase order number
            if (!dataToSubmit.purchase_order_no) {
                dataToSubmit.purchase_order_no = generatePONumber();
            }
            
            // Ensure we have status set to Approved
            dataToSubmit.status = 'Approved';
            
            console.log('Data before sending to API:', dataToSubmit);
            
            Object.keys(dataToSubmit).forEach(key => {
                if (dataToSubmit[key] !== null && dataToSubmit[key] !== undefined) {
                    formDataToSend.append(key, dataToSubmit[key]);
                    console.log(`Adding field ${key}:`, dataToSubmit[key]);
                }
            });

            if (tempDocument) {
                console.log('Adding attachment:', tempDocument.name);
                formDataToSend.append('attachment', tempDocument);
            }

            console.log('Submitting purchase order:', {
                isEdit,
                purchaseOrderId: purchaseOrder?.id,
                endpoint: isEdit ? `/api/v1/purchase-orders/${purchaseOrder.id}` : '/api/v1/purchase-orders'
            });

            if (isEdit && purchaseOrder) {
                // Update existing purchase order
                const response = await axios.put(`/api/v1/purchase-orders/${purchaseOrder.id}`, formDataToSend);
                console.log('Purchase order updated successfully:', response.data);
            } else {
                // Create new purchase order
                const response = await axios.post('/api/v1/purchase-orders', formDataToSend);
                console.log('Purchase order created successfully:', response.data);
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving purchase order:', error);
            console.error('Error response:', error.response?.data);
            setErrors({ 
                submit: error.response?.data?.message || "Failed to save purchase order",
                ...error.response?.data?.errors
            });
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
                        {isEdit ? "Edit Purchase Order" : "Create Purchase Order"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                {errors.rfq_id && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{errors.rfq_id}</span>
                    </div>
                )}
                {errors.submit && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{errors.submit}</span>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Row 1 */}
                        <div>
                            <SelectFloating
                                label="Supplier"
                                name="supplier_id"
                                value={formData.supplier_id}
                                onChange={handleChange}
                                options={companies.map(company => ({
                                    id: company.id,
                                    label: company.name
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

                        {/* Row 2 */}
                        <div>
                            <InputFloating
                                label="Issue Date"
                                name="purchase_order_date"
                                type="date"
                                value={formData.purchase_order_date}
                                onChange={handleChange}
                                error={errors.purchase_order_date}
                            />
                        </div>
                        <div>
                            <InputFloating
                                label="Expiry Date"
                                name="expiry_date"
                                type="date"
                                value={formData.expiry_date}
                                onChange={handleChange}
                                error={errors.expiry_date}
                            />
                        </div>
                    </div>

                    {/* Row 3 - Attachment (Centered) */}
                    <div className="flex justify-center mt-2">
                        <div className="w-1/2 text-center">
                            <div className="space-y-2 text-center">
                                <label className="block text-sm font-medium text-gray-700 text-center">
                                    Attachment (Optional)
                                </label>
                                <div className="flex justify-center">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="w-full max-w-xs text-sm text-gray-500 text-center pl-16
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-[#009FDC] file:text-white
                                            hover:file:bg-[#007BB5]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center w-full mt-4">
                        <button
                            type="submit"
                            className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-1/2"
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : (isEdit ? "Update" : "Create")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApproveOrder;
