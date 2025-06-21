import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "../../../../Components/InputFloating";
import { usePage } from "@inertiajs/react";

const ApproveOrder = ({
    isOpen,
    onClose,
    onSave,
    quotationId,
    purchaseOrder = null,
    isEdit = false,
}) => {
    const user_id = usePage().props.auth.user.id;

    const [formData, setFormData] = useState({
        purchase_order_no: "",
        supplier_id: "",
        supplier_name: "",
        purchase_order_date: "",
        amount: "",
        attachment: null,
        status: "Approved",
        quotation_id: quotationId,
        rfq_id: "",
    });

    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [tempDocument, setTempDocument] = useState(null);
    const [quotationDetails, setQuotationDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fiscalPeriods, setFiscalPeriods] = useState([]);
    const [selectedFiscalPeriod, setSelectedFiscalPeriod] = useState(null);
    const [budgetValidation, setBudgetValidation] = useState(null);

    const generatePONumber = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const random = Math.floor(1000 + Math.random() * 9000);
        return `PO-${year}${month}${day}-${random}`;
    };

    const fetchQuotationDetails = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                `/api/v1/quotations/${quotationId}`
            );
            if (response.data.data) {
                const quotation = response.data.data;
                setQuotationDetails(quotation);
                const rfqId = quotation.rfq?.id;

                if (rfqId) {
                    setFormData((prev) => ({
                        ...prev,
                        rfq_id: rfqId,
                    }));
                    
                    // Check fiscal periods for RFQ date
                    await checkFiscalPeriods(quotation.rfq.request_date);
                } else {
                    setErrors((prev) => ({
                        ...prev,
                        rfq_id: "No RFQ associated with this quotation.",
                    }));
                }

                // Set supplier information and amount from quotation
                if (quotation.supplier_id) {
                    setFormData((prev) => ({
                        ...prev,
                        supplier_id: quotation.supplier_id,
                        supplier_name: quotation.supplier?.name || "",
                        amount: quotation.total_amount || "",
                    }));
                }
            }
        } catch (error) {
            console.error("Error fetching quotation details:", error);
            setErrors((prev) => ({
                ...prev,
                submit: "Failed to load quotation details. Please try again.",
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const checkFiscalPeriods = async (rfqDate) => {
        try {
            const response = await axios.get('/api/v1/purchase-orders/applicable-fiscal-periods', {
                params: { date: rfqDate }
            });
            
            if (response.data.success) {
                const periods = response.data.data;
                setFiscalPeriods(periods);
                
                if (periods.length === 0) {
                    setErrors(prev => ({
                        ...prev,
                        fiscal_period: 'RFQ date is not within any fiscal period range'
                    }));
                } else if (periods.length === 1) {
                    setSelectedFiscalPeriod(periods[0]);
                    await validateBudget(periods[0].id);
                } else {
                    // Multiple periods overlap - user needs to select
                    setErrors(prev => ({
                        ...prev,
                        fiscal_period: 'Multiple fiscal periods overlap for this date. Please select one.'
                    }));
                }
            }
        } catch (error) {
            console.error('Error checking fiscal periods:', error);
            setErrors(prev => ({
                ...prev,
                fiscal_period: 'Failed to check fiscal periods'
            }));
        }
    };

    const validateBudget = async (fiscalPeriodId) => {
        if (!quotationDetails?.rfq) return;
        
        try {
            const response = await axios.post('/api/v1/purchase-orders/validate-budget', {
                department_id: quotationDetails.rfq.department_id,
                cost_center_id: quotationDetails.rfq.cost_center_id,
                sub_cost_center_id: quotationDetails.rfq.sub_cost_center_id,
                fiscal_period_id: fiscalPeriodId,
                amount: formData.amount
            });
            
            setBudgetValidation(response.data);
            
            if (!response.data.success) {
                setErrors(prev => ({
                    ...prev,
                    budget: response.data.data.message
                }));
            } else {
                // Clear budget error if validation passes
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.budget;
                    return newErrors;
                });
            }
        } catch (error) {
            console.error('Error validating budget:', error);
            setErrors(prev => ({
                ...prev,
                budget: 'Failed to validate budget'
            }));
        }
    };

    const fetchPurchaseOrderDetails = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                `/api/v1/purchase-orders/${purchaseOrder?.id}`
            );
            if (response.data.data) {
                const orderData = response.data.data;
                setFormData({
                    purchase_order_no: orderData.purchase_order_no || "",
                    supplier_id: orderData.supplier_id || "",
                    supplier_name: orderData.supplier?.name || "",
                    purchase_order_date: orderData.purchase_order_date || "",
                    amount: orderData.amount || "",
                    attachment: orderData.attachment || null,
                    status: orderData.status || "Approved",
                    quotation_id: quotationId,
                    rfq_id: orderData.rfq_id || "",
                });

                if (!orderData.rfq_id) {
                    fetchQuotationDetails();
                }
            }
        } catch (error) {
            console.error("Error fetching purchase order details:", error);
            setErrors((prev) => ({
                ...prev,
                submit: "Failed to load purchase order details. Please try again.",
            }));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && quotationId) {
            if (isEdit && purchaseOrder) {
                fetchPurchaseOrderDetails();
            } else {
                const poNumber = generatePONumber();
                const today = new Date().toISOString().split("T")[0];
                setFormData((prev) => ({
                    ...prev,
                    purchase_order_no: poNumber,
                    quotation_id: quotationId,
                    purchase_order_date: today,
                }));
                fetchQuotationDetails();
            }
        }
    }, [isOpen, isEdit, quotationId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error for this field when user makes changes
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
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

        // Validation
        const validationErrors = {};
        if (!formData.supplier_id)
            validationErrors.supplier_id = "Supplier is required";
        if (!formData.purchase_order_date)
            validationErrors.purchase_order_date = "Issue date is required";
        if (!formData.amount) validationErrors.amount = "Amount is required";
        if (!formData.rfq_id)
            validationErrors.rfq_id =
                "RFQ ID is missing. Please refresh and try again.";

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsSaving(false);
            return;
        }

        try {
            // Check for process and process steps first
            const processResponse = await axios.get(
                "/api/v1/processes?include=steps,creator,updater&filter[title]=Purchase Order Approval"
            );
            const process = processResponse.data?.data?.[0];
            const processSteps = process?.steps || [];

            // Check if process and steps exist
            if (!process || processSteps.length === 0) {
                setErrors({
                    submit: "No approval process or steps found for Purchase Order Approval",
                });
                setIsSaving(false);
                return;
            }
            const processStep = processSteps[0];

            const processResponseViaUser = await axios.get(
                `/api/v1/process-steps/${processStep.id}/user/${user_id}`
            );
            const assignUser = processResponseViaUser?.data?.data;

            if (!assignUser) {
                setErrors({
                    submit: "No assignee found for this process step and user",
                });
                setIsSaving(false);
                return;
            }

            // Check if fiscal period is selected (for overlapping periods)
            if (fiscalPeriods.length > 1 && !selectedFiscalPeriod) {
                setErrors({
                    submit: "Please select a fiscal period from the overlapping options",
                });
                setIsSaving(false);
                return;
            }

            // Check budget validation
            if (budgetValidation && !budgetValidation.success) {
                setErrors({
                    submit: budgetValidation.data.message,
                });
                setIsSaving(false);
                return;
            }

            // Prepare form data
            const formDataToSend = new FormData();
            const dataToSubmit = {
                ...formData,
                fiscal_period_id: selectedFiscalPeriod?.id,
            };

            // Ensure we have a purchase order number
            if (!dataToSubmit.purchase_order_no) {
                dataToSubmit.purchase_order_no = generatePONumber();
            }
            dataToSubmit.status = "Draft"; // Start with Draft status

            Object.keys(dataToSubmit).forEach((key) => {
                if (
                    dataToSubmit[key] !== null &&
                    dataToSubmit[key] !== undefined &&
                    key !== "supplier_name"
                ) {
                    formDataToSend.append(key, dataToSubmit[key]);
                }
            });

            if (tempDocument) {
                formDataToSend.append("attachment", tempDocument);
            }

            // Create/update purchase order
            let response;
            if (isEdit && purchaseOrder) {
                response = await axios.put(
                    `/api/v1/purchase-orders/${purchaseOrder.id}`,
                    formDataToSend
                );
            } else {
                response = await axios.post(
                    "/api/v1/purchase-orders",
                    formDataToSend
                );
            }
            const newPOId = response.data.data?.id;

            if (newPOId) {
                // Create approval transaction
                const POTransactionPayload = {
                    purchase_order_id: newPOId,
                    requester_id: user_id,
                    assigned_to: assignUser?.approver_id,
                    order: processStep.order,
                    description: processStep.description,
                    status: "Pending",
                };

                await axios.post(
                    "/api/v1/po-approval-transactions",
                    POTransactionPayload
                );

                // Create task
                const taskPayload = {
                    process_step_id: processStep.id,
                    process_id: processStep.process_id,
                    assigned_at: new Date().toISOString(),
                    urgency: "Normal",
                    assigned_to_user_id: assignUser?.approver_id,
                    assigned_from_user_id: user_id,
                    purchase_order_id: newPOId,
                };

                await axios.post("/api/v1/tasks", taskPayload);

                // Successfully completed workflow
                onSave();
                onClose();
            }
        } catch (error) {
            setErrors({
                submit:
                    error.response?.data?.message ||
                    "Failed to save purchase order",
                ...error.response?.data?.errors,
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
                        {isEdit
                            ? "Edit Purchase Order"
                            : "Create Purchase Order"}
                    </h2>
                    <div className="flex items-center gap-4">
                        <span className="text-lg">
                            <span className="font-bold">Issue Date:</span> {new Date().toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            })}
                        </span>
                        <button
                            onClick={onClose}
                            className="text-red-500 hover:text-red-800"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex justify-center my-4">
                        <div
                            className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative"
                            role="alert"
                        >
                            <span className="block sm:inline">
                                Loading data, please wait...
                            </span>
                        </div>
                    </div>
                )}

                {/* Error messages */}
                {(errors.rfq_id || errors.submit || errors.fiscal_period || errors.budget) && (
                    <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                        role="alert"
                    >
                        <span className="block sm:inline">
                            {errors.rfq_id || errors.submit || errors.fiscal_period || errors.budget}
                        </span>
                    </div>
                )}

                {/* Fiscal Period Selection */}
                {fiscalPeriods.length > 1 && (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
                        <div className="mb-3">
                            <strong>Multiple fiscal periods overlap for this RFQ date. Please select one:</strong>
                        </div>
                        <select
                            value={selectedFiscalPeriod?.id || ""}
                            onChange={(e) => {
                                const period = fiscalPeriods.find(p => p.id === parseInt(e.target.value));
                                setSelectedFiscalPeriod(period);
                                if (period) {
                                    validateBudget(period.id);
                                }
                            }}
                            className="w-full p-2 border border-yellow-400 rounded"
                        >
                            <option value="">Select Fiscal Period</option>
                            {fiscalPeriods.map((period) => (
                                <option key={period.id} value={period.id}>
                                    {period.name} ({period.start_date} to {period.end_date})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Budget Validation Display */}
                {budgetValidation && budgetValidation.success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                        <strong>Budget Validation:</strong> Available amount: {budgetValidation.data.available_amount}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <InputFloating
                                label="Supplier"
                                name="supplier_name"
                                value={formData.supplier_name}
                                onChange={() => {}}
                                onKeyDown={(e) => e.preventDefault()}
                                disabled={true}
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
                                onChange={() => {}}
                                onKeyDown={(e) => e.preventDefault()}
                                disabled={true}
                                readOnly={true}
                                error={errors.amount}
                            />
                        </div>
                        {/* <div>
                            <InputFloating
                                label="Select Issue Date"
                                name="purchase_order_date"
                                type="date"
                                value={formData.purchase_order_date}
                                onChange={handleChange}
                                error={errors.purchase_order_date}
                            />
                        </div> */}

                        {/* <div className="flex justify-start">
                            <div className="w-full text-start">
                                <div className="space-y-2 text-start">
                                    <label className="block text-sm font-medium text-gray-700 text-center">
                                        Attachment (Optional)
                                    </label>
                                    <div className="flex justify-start">
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
                        </div> */}
                    </div>

                    <div className="flex justify-center w-full mt-4">
                        <button
                            type="submit"
                            className="w-full px-6 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5]"
                            disabled={isSaving || isLoading}
                        >
                            {isSaving
                                ? "Saving..."
                                : isLoading
                                ? "Loading..."
                                : isEdit
                                ? "Update"
                                : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApproveOrder;
