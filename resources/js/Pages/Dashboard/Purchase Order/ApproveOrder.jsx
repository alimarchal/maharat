import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "../../../Components/InputFloating";
import SelectFloating from "../../../Components/SelectFloating";
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
        purchase_order_date: "",
        expiry_date: "",
        amount: "",
        attachment: null,
        status: "Approved",
        quotation_id: quotationId,
        rfq_id: "",
    });

    const [companies, setCompanies] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [tempDocument, setTempDocument] = useState(null);
    const [quotationDetails, setQuotationDetails] = useState(null);

    const generatePONumber = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const random = Math.floor(1000 + Math.random() * 9000);
        return `PO-${year}${month}${day}-${random}`;
    };

    const fetchQuotationDetails = async () => {
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
                }
                if (quotation.supplier_id) {
                    setFormData((prev) => ({
                        ...prev,
                        supplier_id: quotation.supplier_id,
                    }));
                }
            }
        } catch (error) {
            console.error("Error fetching quotation details:", error);
        }
    };

    const fetchPurchaseOrderDetails = async () => {
        try {
            const response = await axios.get(
                `/api/v1/purchase-orders/${purchaseOrder?.id}`
            );
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
                    rfq_id: orderData.rfq_id || "",
                });
                if (!orderData.rfq_id) {
                    fetchQuotationDetails();
                }
            }
        } catch (error) {
            console.error("Error fetching purchase order details:", error);
        }
    };

    useEffect(() => {
        if (isOpen && quotationId) {
            fetchCompanies();
            fetchQuotationDetails();

            if (isEdit && purchaseOrder) {
                fetchPurchaseOrderDetails();
            } else {
                const poNumber = generatePONumber();
                setFormData((prev) => ({
                    ...prev,
                    purchase_order_no: poNumber,
                    quotation_id: quotationId,
                }));
            }
        }
    }, [isOpen, isEdit, quotationId]);

    const fetchCompanies = async () => {
        try {
            const response = await axios.get("/api/v1/suppliers");
            setCompanies(response.data.data || []);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
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
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setErrors({});

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
            const currentYear = new Date().getFullYear();
            const budgetResponse = await axios.get(
                `/api/v1/request-budgets?filter[sub_cost_center]=${quotationDetails?.rfq?.sub_cost_center_id}&include=fiscalPeriod,department,costCenter,subCostCenter`
            );
            const requestDetails = budgetResponse.data?.data?.[0];

            // Check if requestDetails has data
            if (!requestDetails) {
                setErrors({
                    submit: "No budget request found for this Sub cost center.",
                });
                setIsSaving(false);
                return;
            }

            // Extract year from fiscal_year field
            const requestFiscalYear =
                requestDetails?.fiscal_period?.fiscal_year?.slice(0, 4);
            if (requestFiscalYear != currentYear) {
                setErrors({
                    submit: "No budget request found for current fiscal year",
                });
                setIsSaving(false);
                return;
            }

            // Check if the form amount exceeds the available amount
            const availableAmount = Number(requestDetails.balance_amount);
            const enteredAmount = Number(formData.amount);
            if (enteredAmount > availableAmount) {
                setErrors({
                    submit: "Insufficient Amount in this sub cost center for this Purchase Order.",
                });
                setIsSaving(false);
                return;
            }
            const formDataToSend = new FormData();
            const dataToSubmit = {
                ...formData,
                budget_request_id: requestDetails?.id,
            };

            // Ensure we have a purchase order number
            if (!dataToSubmit.purchase_order_no) {
                dataToSubmit.purchase_order_no = generatePONumber();
            }
            dataToSubmit.status = "Approved";

            Object.keys(dataToSubmit).forEach((key) => {
                if (
                    dataToSubmit[key] !== null &&
                    dataToSubmit[key] !== undefined
                ) {
                    formDataToSend.append(key, dataToSubmit[key]);
                }
            });

            if (tempDocument) {
                formDataToSend.append("attachment", tempDocument);
            }
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
                // Proceed with updating the budget request once Purchase Order is created
                const updatedBudgetData = {
                    reserved_amount: formData.amount,
                    balance_amount:
                        requestDetails.requested_amount - formData.amount,
                };
                // Update the budget request with the new reserved and balance amounts
                await axios.put(
                    `/api/v1/request-budgets/${requestDetails?.id}`,
                    updatedBudgetData
                );

                const processResponse = await axios.get(
                    "/api/v1/processes?include=steps,creator,updater&filter[title]=Purchase Order Approval"
                );
                if (processResponse.data?.data?.[0]?.steps?.[0]) {
                    const process = processResponse.data.data[0];
                    const processStep = process.steps[0];

                    // Only proceed if we have valid process step data
                    if (processStep?.id) {
                        const processResponseViaUser = await axios.get(
                            `/api/v1/process-steps/${processStep.id}/user/${user_id}`
                        );
                        const assignUser = processResponseViaUser?.data?.data;

                        if (assignUser) {
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
                        }
                    }
                }
            }

            onSave();
            onClose();
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
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                {errors.rfq_id && (
                    <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                        role="alert"
                    >
                        <span className="block sm:inline">{errors.rfq_id}</span>
                    </div>
                )}
                {errors.submit && (
                    <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                        role="alert"
                    >
                        <span className="block sm:inline">{errors.submit}</span>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <SelectFloating
                                label="Supplier"
                                name="supplier_id"
                                value={formData.supplier_id}
                                onChange={handleChange}
                                options={companies.map((company) => ({
                                    id: company.id,
                                    label: company.name,
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
                                label="Select Issue Date"
                                name="purchase_order_date"
                                type="date"
                                value={formData.purchase_order_date}
                                onChange={handleChange}
                                error={errors.purchase_order_date}
                            />
                        </div>
                        <div>
                            <InputFloating
                                label="Select Expiry Date"
                                name="expiry_date"
                                type="date"
                                value={formData.expiry_date}
                                onChange={handleChange}
                                error={errors.expiry_date}
                            />
                        </div>
                    </div>

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
                            className="w-full px-6 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5]"
                            disabled={isSaving}
                        >
                            {isSaving
                                ? "Saving..."
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
