import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink } from "@fortawesome/free-solid-svg-icons";
import SelectFloating from "../../../../Components/SelectFloating";
import InputFloating from "../../../../Components/InputFloating";
import { router, usePage } from "@inertiajs/react";

const BudgetRequestForm = () => {
    const { budgetRequestId, auth } = usePage().props;
    const user_id = auth.user.id;
    const isEditing = !!budgetRequestId;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
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

    useEffect(() => {
        fetchInitialData();
        if (isEditing) {
            fetchBudgetRequest();
        }
    }, [budgetRequestId]);

    const fetchInitialData = async () => {
        try {
            const [deptRes, costRes, yearRes] = await Promise.all([
                axios.get("/api/v1/departments"),
                axios.get("/api/v1/cost-centers"),
                axios.get("/api/v1/fiscal-periods"),
            ]);
            setDepartments(deptRes.data.data);
            setCostCenters(costRes.data.data);
            setFiscalYears(yearRes.data.data);
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

            const costCenterId = budgetRequest.cost_center_id;
            await filterSubCostCenters(costCenterId);

            setFormData({
                fiscal_period_id: budgetRequest.fiscal_period_id || "",
                department_id: budgetRequest.department_id || "",
                cost_center_id: costCenterId || "",
                sub_cost_center: budgetRequest.sub_cost_center || "",
                previous_year_budget_amount:
                    budgetRequest.previous_year_budget_amount || "",
                requested_amount: budgetRequest.requested_amount || "",
                revenue_planned: budgetRequest.revenue_planned || "",
                urgency: budgetRequest.urgency || "",
                attachment: null,
                reason_for_increase: budgetRequest.reason_for_increase || "",
            });
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
            const filtered = costCenters.filter(
                (cost) => cost.parent_id === parseInt(costCenterId)
            );
            setFilteredSubCostCenters(filtered);
        } catch (error) {
            console.error("Error filtering sub cost centers", error);
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
    };

    const handleFileChange = (e) => {
        setFormData((prev) => ({ ...prev, attachment: e.target.files[0] }));
        setErrors((prev) => ({ ...prev, attachment: undefined }));
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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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
        const response = await axios.post("/api/v1/request-budgets", formData);
        const budgetRequestId = response.data.data?.id;
        if (!budgetRequestId) {
            setErrors({
                submit: "Failed to create budget request. No ID was returned.",
            });
            setIsSubmitting(false);
            return;
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
        await axios.put(`/api/v1/request-budgets/${budgetRequestId}`, formData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);

        try {
            if (isEditing) {
                await updateBudgetRequest();
            } else {
                await createNewBudgetRequest();
            }
            router.visit("/request-budgets");
        } catch (error) {
            console.error("Error saving budget request:", error);
            setErrors((prev) => ({
                ...prev,
                submit:
                    error.message ||
                    "An error occurred while saving the budget request.",
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const ErrorMessage = ({ error }) => {
        if (!error) return null;
        return <p className="text-red-500 text-sm mt-1">{error}</p>;
    };

    if (loading) {
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
                        {isEditing ? "Edit Budget Request" : "Budget Request"}
                    </h2>
                    <p className="text-[#7D8086] text-lg">
                        {isEditing
                            ? "Update your budget request details"
                            : "Request by department head for the budget"}
                    </p>
                </div>
                <div className="w-full lg:w-1/4">
                    <SelectFloating
                        label="Year"
                        name="fiscal_period_id"
                        value={formData.fiscal_period_id}
                        onChange={handleChange}
                        options={fiscalYears.map((year) => ({
                            id: year.id,
                            label: `${year.period_name} ${
                                year.fiscal_year.split("-")[0]
                            }`,
                        }))}
                    />
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
                        <ErrorMessage error={errors.department_id} />
                    </div>
                    <div>
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
                        <ErrorMessage error={errors.cost_center_id} />
                    </div>
                    <div>
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
                        <label className="border p-5 rounded-2xl bg-white w-full flex items-center justify-center cursor-pointer relative">
                            <FontAwesomeIcon
                                icon={faLink}
                                className="text-[#009FDC] mr-2"
                            />
                            {formData.attachment ? (
                                <span className="text-gray-700 text-sm overflow-hidden text-ellipsis max-w-[80%]">
                                    {formData.attachment.name}
                                </span>
                            ) : (
                                <span className="text-sm">
                                    {isEditing
                                        ? "Update Attachment"
                                        : "Attachment"}
                                </span>
                            )}
                            <input
                                type="file"
                                name="attachment"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
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
                            ? isEditing
                                ? "Updating..."
                                : "Saving..."
                            : isEditing
                            ? "Update"
                            : "Save"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BudgetRequestForm;
