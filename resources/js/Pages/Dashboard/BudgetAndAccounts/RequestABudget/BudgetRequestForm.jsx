import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink } from "@fortawesome/free-solid-svg-icons";
import SelectFloating from "../../../../Components/SelectFloating";
import InputFloating from "../../../../Components/InputFloating";
import { router, usePage } from "@inertiajs/react";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";

const BudgetRequestForm = () => {
    const { budgetRequestId, auth } = usePage().props;
    const user_id = auth.user.id;
    const isEditMode = !!budgetRequestId;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [formData, setFormData] = useState({
        fiscal_period_id: "",
        department_id: "",
        cost_center_id: "",
        sub_cost_center: "",
        previous_year_budget_amount: "",
        requested_amount: "",
        revenue_planned: "",
        urgency: "",
        attachment: null,
        reason_for_increase: "",
    });
    const [errors, setErrors] = useState({});
    const [departments, setDepartments] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [fiscalYears, setFiscalYears] = useState([]);
    const [filteredSubCostCenters, setFilteredSubCostCenters] = useState([]);
    const [tempAttachment, setTempAttachment] = useState(null);
    const [existingAttachment, setExistingAttachment] = useState(null);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = React.useRef();

    useEffect(() => {
        const initializeData = async () => {
            await fetchInitialData();
            if (isEditMode) {
                await fetchBudgetRequest();
            }
        };
        
        initializeData();
    }, [budgetRequestId]);

    // Add a separate useEffect to handle sub cost center filtering when costCenters are loaded
    useEffect(() => {
        if (costCenters.length > 0 && formData.cost_center_id) {
            filterSubCostCenters(formData.cost_center_id);
        }
    }, [costCenters, formData.cost_center_id]);

    const fetchInitialData = async () => {
        try {
            const [deptRes, costRes, yearRes] = await Promise.all([
                axios.get("/api/v1/departments"),
                axios.get("/api/v1/cost-centers"),
                axios.get("/api/v1/fiscal-periods?filter[status]=open"),
            ]);
            
            setDepartments(deptRes.data.data);
            setCostCenters(costRes.data.data);
            setFiscalYears(yearRes.data.data);
            setDataLoaded(true);
        } catch (error) {
            console.error("Error fetching initial data", error);
            setErrors((prev) => ({
                ...prev,
                fetchError:
                    "Failed to load necessary data. Please refresh and try again.",
            }));
        }
    };

    const fetchBudgetRequest = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `/api/v1/request-budgets/${budgetRequestId}?include=fiscalPeriod,department,costCenter,subCostCenter`
            );
            const budgetRequest = response.data.data;

            setFormData({
                ...formData,
                ...budgetRequest,
            });

            // Handle existing attachment
            if (budgetRequest.attachment_path) {
                const attachmentData = {
                    file_path: budgetRequest.attachment_path,
                    original_name: budgetRequest.original_name || budgetRequest.attachment_path.split('/').pop() || 'Document'
                };
                setExistingAttachment(attachmentData);
            } else {
                setExistingAttachment(null);
            }

            setDataLoaded(true);
        } catch (error) {
            console.error("Error fetching budget request", error);
            setErrors((prev) => ({
                ...prev,
                fetchError: "Failed to load budget request data.",
            }));
        } finally {
            setLoading(false);
        }
    };

    const filterSubCostCenters = async (costCenterId) => {
        if (!costCenterId) {
            setFilteredSubCostCenters([]);
            return;
        }

        try {
            // Convert costCenterId to number for comparison
            const numericCostCenterId = parseInt(costCenterId);
            
            // Filter cost centers that have the selected cost center as their parent
            const filtered = costCenters.filter((cost) => {
                return cost.parent_id === numericCostCenterId;
            });
            
            console.log("Filtered sub cost centers for cost center", costCenterId, ":", filtered);
            setFilteredSubCostCenters(filtered);
        } catch (error) {
            console.error("Error filtering sub cost centers", error);
            setFilteredSubCostCenters([]);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "cost_center_id" ? { sub_cost_center: "" } : {}),
        }));

        setErrors((prev) => ({ ...prev, [name]: undefined }));

        if (name === "cost_center_id") {
            filterSubCostCenters(value);
        }

        // Clear hierarchical uniqueness error when key fields change
        if (['fiscal_period_id', 'department_id', 'cost_center_id', 'sub_cost_center'].includes(name)) {
            setErrors((prev) => ({ ...prev, hierarchical_uniqueness: undefined }));
        }
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
            fiscal_period_id: "Year is required",
            department_id: "Department is required",
            cost_center_id: "Cost Center is required",
            sub_cost_center: "Sub Cost Center is required",
            previous_year_budget_amount: "Previous Budget is required",
            requested_amount: "Requested Amount is required",
            revenue_planned: "Revenue Planned is required",
            urgency: "Urgency is required",
            reason_for_increase: "Reason is required",
        };

        const newErrors = {};
        Object.entries(requiredFields).forEach(([field, message]) => {
            if (!formData[field]) {
                newErrors[field] = message;
            }
        });

        // Check for attachment
        if (!tempAttachment && !existingAttachment) {
            newErrors.attachment = "Attachment is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const checkHierarchicalUniqueness = async () => {
        if (!formData.fiscal_period_id || !formData.department_id || !formData.cost_center_id) {
            return true; // Skip validation if required fields are not filled
        }

        try {
            const response = await axios.get('/api/v1/request-budgets', {
                params: {
                    'filter[fiscal_period_id]': formData.fiscal_period_id,
                    'filter[department_id]': formData.department_id,
                    'filter[cost_center_id]': formData.cost_center_id,
                    'filter[sub_cost_center]': formData.sub_cost_center || '',
                    'include': 'fiscalPeriod,department,costCenter,subCostCenter'
                }
            });

            const existingRequests = response.data.data || [];
            
            // Filter out the current record if in edit mode
            const filteredRequests = isEditMode 
                ? existingRequests.filter(req => req.id != budgetRequestId)
                : existingRequests;

            if (filteredRequests.length > 0) {
                const existingRequest = filteredRequests[0];
                const details = [];
                
                if (existingRequest.fiscal_period) {
                    details.push(`Fiscal Year: ${existingRequest.fiscal_period.fiscal_year}`);
                }
                if (existingRequest.department) {
                    details.push(`Department: ${existingRequest.department.name}`);
                }
                if (existingRequest.cost_center) {
                    details.push(`Cost Center: ${existingRequest.cost_center.name}`);
                }
                if (existingRequest.sub_cost_center_details) {
                    details.push(`Sub Cost Center: ${existingRequest.sub_cost_center_details.name}`);
                }

                setErrors(prev => ({
                    ...prev,
                    hierarchical_uniqueness: `Budget request already exists for ${details.join(', ')}`
                }));
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking hierarchical uniqueness:', error);
            return true; // Allow submission if validation fails
        }
    };

    const uploadAttachmentToServer = async (budgetRequestId, file) => {
        if (!file) return true;
        const formData = new FormData();
        formData.append("attachment", file);
        formData.append("request_budget_id", budgetRequestId);
        formData.append("type", "budget_request");
        try {
            await axios.post("/api/v1/budget-request-attachments", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return true;
        } catch (error) {
            setUploadError(
                error.response?.data?.message || "Failed to upload attachment."
            );
            return false;
        }
    };

    const createNewBudgetRequest = async () => {
        const processResponse = await axios.get(
            "/api/v1/processes?include=steps,creator,updater&filter[title]=Budget Request Approval"
        );
        const process = processResponse.data?.data?.[0];
        const processSteps = process?.steps || [];

        // Check if process and steps exist
        if (!process || processSteps.length === 0) {
            setErrors({
                submit: "No Process or steps found for Budget Request Approval",
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

        // Create budget request
        const response = await axios.post("/api/v1/request-budgets", {
            ...formData,
            status: "Draft"
        });
        const budgetRequestId = response.data.data?.id;
        if (!budgetRequestId) {
            setErrors({
                submit: "Failed to create budget request. No ID was returned.",
            });
            setIsSubmitting(false);
            return;
        }

        // Upload attachment if provided
        if (tempAttachment) {
            const uploadSuccess = await uploadAttachmentToServer(budgetRequestId, tempAttachment);
            if (!uploadSuccess) {
                setErrors({
                    submit: "Failed to upload attachment. Please try again.",
                });
                setIsSubmitting(false);
                return;
            }
            // Clear file input after upload
            if (fileInputRef.current) fileInputRef.current.value = "";
        }

        // Create budget request transaction
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
    };

    const updateBudgetRequest = async () => {
        console.log('updateBudgetRequest called with formData:', formData);
        console.log('budgetRequestId:', budgetRequestId);
        
        // Extract only the required fields for the API
        const updateData = {
            fiscal_period_id: formData.fiscal_period_id,
            department_id: formData.department_id,
            cost_center_id: formData.cost_center_id,
            sub_cost_center: formData.sub_cost_center,
            previous_year_budget_amount: formData.previous_year_budget_amount,
            requested_amount: formData.requested_amount,
            revenue_planned: formData.revenue_planned,
            previous_year_revenue: formData.previous_year_revenue,
            current_year_revenue: formData.current_year_revenue,
            approved_amount: formData.approved_amount,
            reserved_amount: formData.reserved_amount,
            consumed_amount: formData.consumed_amount,
            balance_amount: formData.balance_amount,
            urgency: formData.urgency,
            attachment_path: formData.attachment_path,
            original_name: formData.original_name || null,
            reason_for_increase: formData.reason_for_increase,
            status: formData.status
        };
        
        console.log('Sending update data:', updateData);
        
        try {
            const response = await axios.put(`/api/v1/request-budgets/${budgetRequestId}`, updateData);
            console.log('Update response:', response.data);
            
            // Upload new attachment if provided
            if (tempAttachment) {
                console.log('Uploading attachment:', tempAttachment);
                const uploadSuccess = await uploadAttachmentToServer(budgetRequestId, tempAttachment);
                if (!uploadSuccess) {
                    setErrors({
                        submit: "Failed to upload attachment. Please try again.",
                    });
                    setIsSubmitting(false);
                    return;
                }
                // Clear file input after upload
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        } catch (error) {
            console.error('Update request failed:', error.response?.data);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        // Only check hierarchical uniqueness for new requests, not updates
        if (!isEditMode) {
            const isUnique = await checkHierarchicalUniqueness();
            if (!isUnique) return;
        }
        
        setIsSubmitting(true);

        try {
            if (isEditMode) {
                await updateBudgetRequest();
            } else {
                await createNewBudgetRequest();
            }
            router.visit("/request-budgets");
        } catch (error) {
            console.error("Error saving budget request:", error);
            
            // Handle backend validation errors
            if (error.response?.data?.errors) {
                const backendErrors = {};
                Object.keys(error.response.data.errors).forEach(key => {
                    backendErrors[key] = error.response.data.errors[key][0];
                });
                setErrors(prev => ({ ...prev, ...backendErrors }));
            } else {
                setErrors((prev) => ({
                    ...prev,
                    submit:
                        error.message ||
                        "An error occurred while saving the budget request.",
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

    if (loading || (!dataLoaded && isEditMode)) {
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
                        {isEditMode ? "Edit Department Budget Request" : "Department Budget Request"}
                    </h2>
                    <p className="text-[#7D8086] text-lg">
                        {isEditMode
                            ? "Update your department budget request details"
                            : "Request by department head for the budget"}
                    </p>
                </div>
                <div className="w-full lg:w-1/4">
                    {isEditMode ? (
                        <InputFloating
                            label="Budget"
                            name="fiscal_period_id"
                            value={
                                fiscalYears.find((year) => year.id === formData.fiscal_period_id)
                                    ? `${fiscalYears.find((year) => year.id === formData.fiscal_period_id).budget_name} (${fiscalYears.find((year) => year.id === formData.fiscal_period_id).period_name})`
                                    : ''
                            }
                            onChange={() => {}}
                            onKeyDown={(e) => e.preventDefault()}
                            disabled
                            readOnly
                        />
                    ) : (
                        <SelectFloating
                            label="Budget"
                            name="fiscal_period_id"
                            value={formData.fiscal_period_id}
                            onChange={handleChange}
                            options={fiscalYears.map((year) => ({
                                id: year.id,
                                label: `${year.budget_name} (${year.period_name})`,
                            }))}
                        />
                    )}
                    <ErrorMessage error={errors.fiscal_period_id} />
                </div>
            </div>

            {(errors.fetchError || errors.submit || errors.hierarchical_uniqueness) && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 mb-2">
                    <p>{errors.fetchError || errors.submit || errors.hierarchical_uniqueness}</p>
                </div>
            )}

            <div className="flex items-center gap-4 w-full my-6">
                <p className="text-[#6E66AC] text-lg md:text-2xl">
                    Request Details
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
                        {isEditMode ? (
                            <InputFloating
                                label="Department Name"
                                name="department_id"
                                value={departments.find(dept => dept.id === formData.department_id)?.name || ''}
                                onChange={() => {}}
                                onKeyDown={(e) => e.preventDefault()}
                                disabled={true}
                                readOnly={true}
                            />
                        ) : (
                            <SelectFloating
                                label="Department Name"
                                name="department_id"
                                value={formData.department_id}
                                onChange={handleChange}
                                options={departments.map((dept) => ({
                                    id: dept.id,
                                    label: dept.name,
                                }))}
                            />
                        )}
                        <ErrorMessage error={errors.department_id} />
                    </div>
                    <div>
                        {isEditMode ? (
                            <InputFloating
                                label="Cost Center"
                                name="cost_center_id"
                                value={costCenters.find(cost => cost.id === formData.cost_center_id)?.name || ''}
                                onChange={() => {}}
                                onKeyDown={(e) => e.preventDefault()}
                                disabled={true}
                                readOnly={true}
                            />
                        ) : (
                            <SelectFloating
                                label="Cost Center"
                                name="cost_center_id"
                                value={formData.cost_center_id}
                                onChange={handleChange}
                                options={costCenters.map((cost) => ({
                                    id: cost.id,
                                    label: cost.name,
                                }))}
                            />
                        )}
                        <ErrorMessage error={errors.cost_center_id} />
                    </div>
                    <div>
                        {isEditMode ? (
                            <InputFloating
                                label="Sub Cost Center"
                                name="sub_cost_center"
                                value={filteredSubCostCenters.find(sub => sub.id === formData.sub_cost_center)?.name || ''}
                                onChange={() => {}}
                                onKeyDown={(e) => e.preventDefault()}
                                disabled={true}
                                readOnly={true}
                            />
                        ) : (
                            <SelectFloating
                                label="Sub Cost Center"
                                name="sub_cost_center"
                                value={formData.sub_cost_center}
                                onChange={handleChange}
                                options={filteredSubCostCenters.map((sub) => ({
                                    id: sub.id,
                                    label: sub.name,
                                }))}
                                disabled={!formData.cost_center_id}
                            />
                        )}
                        <ErrorMessage error={errors.sub_cost_center} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <InputFloating
                            label="Previous Budget Amount"
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
                            label="Requested Amount"
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
                            label="Revenue Planned"
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
                                            const filePath = existingAttachment.file_path;
                                            if (filePath) {
                                                const fixedPath = filePath.startsWith("http") 
                                                    ? filePath 
                                                    : filePath.startsWith("/storage/") 
                                                        ? filePath 
                                                        : `/storage/${filePath}`;
                                                window.open(fixedPath, "_blank");
                                            }
                                        }}
                                    >
                                        {existingAttachment.original_name}
                                    </span>
                                ) : (
                                    <span className="text-sm">
                                        {isEditMode
                                            ? "Update Attachment"
                                            : "Attachment"}
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
                                <div className="text-red-500 text-xs mt-1 text-center">{uploadError}</div>
                            )}
                            {errors.attachment && (
                                <div className="text-red-500 text-xs mt-1 text-center">{errors.attachment}</div>
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
                            Reasons for increase
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

export default BudgetRequestForm;
