import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink } from "@fortawesome/free-solid-svg-icons";
import { router, usePage } from "@inertiajs/react";
import SelectFloating from "../../../../Components/SelectFloating";
import InputFloating from "../../../../Components/InputFloating";

const VatBudgetRequestForm = () => {
    const { auth, budgetRequestId } = usePage().props;
    const user_id = auth.user.id;
    const isEditMode = !!budgetRequestId;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);

    const [formData, setFormData] = useState({
        fiscal_period_id: "",
        previous_year_budget_amount: "",
        requested_amount: "",
        revenue_planned: "",
        urgency: "",
        attachment: null,
        reason_for_increase: "",
    });

    const [errors, setErrors] = useState({});
    const [fiscalYears, setFiscalYears] = useState([]);
    const [tempAttachment, setTempAttachment] = useState(null);
    const [existingAttachment, setExistingAttachment] = useState(null);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = React.useRef();

    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            try {
                // Get all open fiscal periods
                const yearRes = await axios.get(
                    "/api/v1/fiscal-periods?filter[status]=open"
                );
                const allFiscalYears = yearRes.data.data || [];

                // If creating new VAT budget, hide years that already have non-rejected VAT budgets
                if (!isEditMode) {
                    const vatRes = await axios.get(
                        "/api/v1/request-budgets?filter[type]=vat&per_page=200&include=fiscalPeriod"
                    );
                    const existingVatBudgets = vatRes.data.data || [];

                    const blockedFiscalPeriodIds = new Set(
                        existingVatBudgets
                            .filter((rb) =>
                                ["Draft", "Pending", "Approved"].includes(
                                    rb.status
                                )
                            )
                            .map((rb) => rb.fiscal_period_id)
                    );

                    const availableFiscalYears = allFiscalYears.filter(
                        (year) => !blockedFiscalPeriodIds.has(year.id)
                    );

                    setFiscalYears(availableFiscalYears);
                } else {
                    setFiscalYears(allFiscalYears);
                }

                // If editing an existing VAT budget, load its data
                if (isEditMode) {
                    const res = await axios.get(
                        `/api/v1/request-budgets/${budgetRequestId}?include=fiscalPeriod`
                    );
                    const budgetRequest = res.data.data;

                    setFormData((prev) => ({
                        ...prev,
                        fiscal_period_id: budgetRequest.fiscal_period_id,
                        previous_year_budget_amount:
                            budgetRequest.previous_year_budget_amount ?? "",
                        requested_amount: budgetRequest.requested_amount ?? "",
                        revenue_planned: budgetRequest.revenue_planned ?? "",
                        urgency: budgetRequest.urgency ?? "",
                        reason_for_increase:
                            budgetRequest.reason_for_increase ?? "",
                    }));

                    // Handle existing attachment display
                    if (budgetRequest.attachment_path) {
                        setExistingAttachment({
                            file_path: budgetRequest.attachment_path,
                            original_name:
                                budgetRequest.original_name ||
                                budgetRequest.attachment_path
                                    .split("/")
                                    .pop() ||
                                "Document",
                        });
                    } else {
                        setExistingAttachment(null);
                    }
                }

                setDataLoaded(true);
            } catch (error) {
                console.error("Error loading VAT budget form data", error);
                setErrors((prev) => ({
                    ...prev,
                    fetchError:
                        "Failed to load fiscal years for VAT budget. Please refresh and try again.",
                }));
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, [budgetRequestId, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setTempAttachment(file);
            setUploadError("");
            setErrors((prev) => ({ ...prev, attachment: undefined }));
        }
    };

    const validateForm = () => {
        const requiredFields = {
            fiscal_period_id: "Fiscal Year is required",
            previous_year_budget_amount: "Previous VAT Budget is required",
            requested_amount: "Requested VAT Budget is required",
            revenue_planned: "Revenue Planned (for reference) is required",
            urgency: "Urgency is required",
            reason_for_increase: "Reason is required",
        };

        const newErrors = {};
        Object.entries(requiredFields).forEach(([field, message]) => {
            if (!formData[field]) {
                newErrors[field] = message;
            }
        });

        // On create, attachment is required; on edit, allow existing attachment
        if (!isEditMode && !tempAttachment) {
            newErrors.attachment = "Attachment is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const uploadAttachmentToServer = async (budgetRequestId, file) => {
        if (!file) return true;
        const formDataUpload = new FormData();
        formDataUpload.append("attachment", file);
        formDataUpload.append("request_budget_id", budgetRequestId);
        formDataUpload.append("type", "budget_request");

        try {
            await axios.post(
                "/api/v1/budget-request-attachments",
                formDataUpload,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            return true;
        } catch (error) {
            setUploadError(
                error.response?.data?.message ||
                    "Failed to upload attachment."
            );
            return false;
        }
    };

    const createVatBudgetRequest = async () => {
        try {
            // We can reuse the existing "Budget Request Approval" process
            const processResponse = await axios.get(
                "/api/v1/processes?include=steps,creator,updater&filter[title]=Budget Request Approval"
            );

            const process = processResponse.data?.data?.[0];
            const processSteps = process?.steps || [];

            if (!process || processSteps.length === 0) {
                setErrors({
                    submit:
                        "No Process or steps found for Budget Request Approval",
                });
                setIsSubmitting(false);
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
                setIsSubmitting(false);
                return;
            }

            // Build payload for VAT budget request
            const submitData = {
                fiscal_period_id: formData.fiscal_period_id,
                // No department / cost_center / sub_cost_center for VAT budget
                department_id: null,
                cost_center_id: null,
                sub_cost_center: null,
                previous_year_budget_amount:
                    formData.previous_year_budget_amount,
                requested_amount: formData.requested_amount,
                revenue_planned: formData.revenue_planned,
                urgency: formData.urgency,
                reason_for_increase: formData.reason_for_increase,
                status: "Draft",
                type: "vat",
            };

            const response = await axios.post(
                "/api/v1/request-budgets",
                submitData
            );

            const budgetRequestId = response.data.data?.id;
            if (!budgetRequestId) {
                setErrors({
                    submit:
                        "Failed to create VAT budget request. No ID was returned.",
                });
                setIsSubmitting(false);
                return;
            }

            // Upload attachment
            if (tempAttachment) {
                const uploadSuccess = await uploadAttachmentToServer(
                    budgetRequestId,
                    tempAttachment
                );
                if (!uploadSuccess) {
                    setErrors({
                        submit:
                            "Failed to upload attachment. Please try again.",
                    });
                    setIsSubmitting(false);
                    return;
                }
                if (fileInputRef.current) fileInputRef.current.value = "";
            }

            // Create approval transaction
            const transactionPayload = {
                request_budgets_id: budgetRequestId,
                requester_id: user_id,
                assigned_to: assignUser.approver_id,
                order: processStep.order,
                description: processStep.description,
                status: "Pending",
            };

            await axios.post(
                "/api/v1/budget-request-approval-trans",
                transactionPayload
            );

            // Create task
            const taskPayload = {
                process_step_id: processStep.id,
                process_id: processStep.process_id,
                assigned_at: new Date().toISOString(),
                urgency: "Normal",
                assigned_to_user_id: assignUser.approver_id,
                assigned_from_user_id: user_id,
                request_budgets_id: budgetRequestId,
            };

            await axios.post("/api/v1/tasks", taskPayload);
        } catch (error) {
            console.error("Error creating VAT budget request", error);
            throw error;
        }
    };

    const updateVatBudgetRequest = async () => {
        try {
            const submitData = {
                fiscal_period_id: formData.fiscal_period_id,
                previous_year_budget_amount:
                    formData.previous_year_budget_amount,
                requested_amount: formData.requested_amount,
                revenue_planned: formData.revenue_planned,
                urgency: formData.urgency,
                reason_for_increase: formData.reason_for_increase,
                type: "vat",
            };

            await axios.put(
                `/api/v1/request-budgets/${budgetRequestId}`,
                submitData
            );

            // If a new attachment has been selected in edit mode, upload it
            if (tempAttachment) {
                const uploadSuccess = await uploadAttachmentToServer(
                    budgetRequestId,
                    tempAttachment
                );
                if (!uploadSuccess) {
                    setErrors({
                        submit:
                            "Failed to upload attachment. Please try again.",
                    });
                    setIsSubmitting(false);
                    return;
                }
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        } catch (error) {
            console.error("Error updating VAT budget request", error);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            if (isEditMode) {
                await updateVatBudgetRequest();
            } else {
                await createVatBudgetRequest();
            }
            router.visit("/request-budgets");
        } catch (error) {
            if (error.response?.data?.errors) {
                const backendErrors = {};
                Object.keys(error.response.data.errors).forEach((key) => {
                    backendErrors[key] =
                        error.response.data.errors[key][0];
                });
                setErrors((prev) => ({ ...prev, ...backendErrors }));
            } else {
                setErrors((prev) => ({
                    ...prev,
                    submit:
                        error.message ||
                        "An error occurred while saving the VAT budget request.",
                }));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const ErrorMessage = ({ error }) => {
        if (!error) return null;
        return <p className="text-red-500 text-sm mt-1">{error}</p>;
    };

    if (loading || !dataLoaded) {
        return (
            <div className="w-full flex justify-center items-center py-12">
                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        {isEditMode ? "Edit VAT Budget Request" : "VAT Budget Request"}
                    </h2>
                    <p className="text-[#7D8086] text-lg">
                        {isEditMode
                            ? "Update your yearly VAT budget details"
                            : "Create a yearly VAT budget for the selected fiscal year"}
                    </p>
                </div>
                <div className="w-full lg:w-1/3">
                    {isEditMode ? (
                        <InputFloating
                            label="Fiscal Year"
                            name="fiscal_period_id"
                            value={
                                fiscalYears.length > 0 &&
                                formData.fiscal_period_id
                                    ? (() => {
                                          const year = fiscalYears.find(
                                              (year) =>
                                                  year.id.toString() ===
                                                  formData.fiscal_period_id.toString()
                                          );
                                          return year
                                              ? year.fiscal_year ||
                                                    year.budget_name ||
                                                    `Year #${year.id}`
                                              : "Loading...";
                                      })()
                                    : formData.fiscal_period_id
                                    ? "Loading..."
                                    : ""
                            }
                            onChange={() => {}}
                            onKeyDown={(e) => e.preventDefault()}
                            disabled
                            readOnly
                        />
                    ) : (
                        <SelectFloating
                            label="Fiscal Year"
                            name="fiscal_period_id"
                            value={formData.fiscal_period_id}
                            onChange={handleChange}
                            options={fiscalYears.map((year) => ({
                                id: year.id,
                                label:
                                    year.fiscal_year ||
                                    year.budget_name ||
                                    `Year #${year.id}`,
                            }))}
                        />
                    )}
                    <ErrorMessage error={errors.fiscal_period_id} />
                </div>
            </div>

            {(errors.fetchError || errors.submit) && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 mb-2">
                    <p>{errors.fetchError || errors.submit}</p>
                </div>
            )}

            <div className="flex items-center gap-4 w-full my-6">
                <p className="text-[#6E66AC] text-lg md:text-2xl">
                    VAT Budget Details
                </p>
                <div
                    className="h-[3px] flex-grow"
                    style={{
                        background:
                            "linear-gradient(to right, #9B9DA200, #9B9DA2)",
                    }}
                ></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <InputFloating
                            label="Previous VAT Budget Amount"
                            name="previous_year_budget_amount"
                            value={formData.previous_year_budget_amount}
                            onChange={handleChange}
                            type="number"
                            min="0"
                        />
                        <ErrorMessage
                            error={errors.previous_year_budget_amount}
                        />
                    </div>
                    <div>
                        <InputFloating
                            label="Requested VAT Budget"
                            name="requested_amount"
                            value={formData.requested_amount}
                            onChange={handleChange}
                            type="number"
                            min="0"
                        />
                        <ErrorMessage error={errors.requested_amount} />
                    </div>
                    <div>
                        <InputFloating
                            label="Revenue Planned (Reference)"
                            name="revenue_planned"
                            value={formData.revenue_planned}
                            onChange={handleChange}
                            type="number"
                            min="0"
                        />
                        <ErrorMessage error={errors.revenue_planned} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <SelectFloating
                            label="Urgency"
                            name="urgency"
                            value={formData.urgency}
                            onChange={handleChange}
                            options={[
                                { id: "High", label: "High" },
                                { id: "Medium", label: "Medium" },
                                { id: "Low", label: "Low" },
                            ]}
                        />
                        <ErrorMessage error={errors.urgency} />
                    </div>
                    <div>
                        <div>
                            <label className="border p-5 rounded-2xl bg-white w-full flex items-center justify-center cursor-pointer relative">
                                <FontAwesomeIcon
                                    icon={faLink}
                                    className="text-[#009FDC] mr-2"
                                />
                                {tempAttachment ? (
                                    <span className="text-gray-700 text-sm overflow-hidden text-ellipsis max-w-[80%]">
                                        {tempAttachment.name}
                                    </span>
                                ) : existingAttachment ? (
                                    <span
                                        className="text-blue-600 text-sm overflow-hidden text-ellipsis max-w-[80%] hover:text-blue-800 hover:underline cursor-pointer"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const filePath =
                                                existingAttachment.file_path;
                                            if (filePath) {
                                                const fixedPath =
                                                    filePath.startsWith("http")
                                                        ? filePath
                                                        : filePath.startsWith(
                                                              "/storage/"
                                                          )
                                                        ? filePath
                                                        : `/storage/${filePath}`;
                                                window.open(
                                                    fixedPath,
                                                    "_blank"
                                                );
                                            }
                                        }}
                                    >
                                        {existingAttachment.original_name}
                                    </span>
                                ) : (
                                    <span className="text-sm">
                                        Attachment
                                    </span>
                                )}
                                <input
                                    type="file"
                                    name="attachment"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    ref={fileInputRef}
                                />
                            </label>
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
                </div>

                <div className="w-full">
                    <div className="relative w-full">
                        <textarea
                            name="reason_for_increase"
                            value={formData.reason_for_increase}
                            onChange={handleChange}
                            className="peer border border-gray-300 p-5 rounded-2xl w-full h-24 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                        ></textarea>
                        <label
                            className={`absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                                    ${
                                        formData.reason_for_increase
                                            ? "-top-2 left-2 text-base text-[#009FDC] px-1"
                                            : "top-4 text-base text-gray-400"
                                    }
                                    peer-focus:-top-2 peer-focus:left-2 peer-focus:text-base peer-focus:text-[#009FDC] peer-focus:px-1`}
                        >
                            Reasons for VAT budget
                        </label>
                    </div>
                    <ErrorMessage error={errors.reason_for_increase} />
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className={`text-white text-lg font-medium px-6 py-3 rounded-full ${
                            isSubmitting
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-[#009FDC] hover:bg-[#007CB8]"
                        }`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? isEditMode
                                ? "Updating..."
                                : "Saving..."
                            : isEditMode
                            ? "Update"
                            : "Save"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VatBudgetRequestForm;


