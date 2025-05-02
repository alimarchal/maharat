import React, { useState, useEffect } from "react";
import axios from "axios";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";
import { usePage, router } from "@inertiajs/react";
import FiscalPeriodModal from "./FiscalPeriodModal";

const CreateBudget = () => {
    const user_id = usePage().props.auth.user.id;

    const [formData, setFormData] = useState({
        fiscal_period_id: "",
        department_id: "",
        cost_center_id: "",
        sub_cost_center_id: "",
        status: "",
        description: "",
        total_revenue_planned: "",
        total_expense_planned: "",
    });

    const [fiscalPeriod, setFiscalPeriod] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [subCostCenters, setSubCostCenters] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filteredSubCostCenters, setFilteredSubCostCenters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDropdownData();
    }, []);

    const fetchDropdownData = async () => {
        setIsLoading(true);
        try {
            const [deptResponse, costCenterResponse, fiscalPeriodResponse] =
                await Promise.all([
                    axios.get("/api/v1/departments"),
                    axios.get("/api/v1/cost-centers"),
                    axios.get("/api/v1/fiscal-periods"),
                ]);
            setDepartments(deptResponse.data.data || []);
            setCostCenters(costCenterResponse.data.data || []);
            setSubCostCenters(costCenterResponse.data.data || []);
            setFiscalPeriod(fiscalPeriodResponse.data.data || []);
        } catch (error) {
            console.error("Error fetching dropdown data:", error);
            setErrors((prev) => ({
                ...prev,
                fetchError: "Failed to load form data. Please try again.",
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "cost_center_id" ? { sub_cost_center_id: "" } : {}),
        }));
        setErrors((prev) => ({ ...prev, [name]: "" }));

        if (name === "cost_center_id") {
            filterSubCostCenters(value);
        }
    };

    const filterSubCostCenters = (costCenterId) => {
        if (!costCenterId) {
            setFilteredSubCostCenters([]);
            return;
        }
        const filtered = subCostCenters.filter(
            (cost) => cost.parent_id === parseInt(costCenterId)
        );
        setFilteredSubCostCenters(filtered);
    };

    const validate = () => {
        const tempErrors = {};
        if (!formData.fiscal_period_id)
            tempErrors.fiscal_period_id = "Fiscal Period is required";
        if (!formData.department_id)
            tempErrors.department_id = "Department is required";
        if (!formData.cost_center_id)
            tempErrors.cost_center_id = "Cost Center is required";
        if (!formData.sub_cost_center_id)
            tempErrors.sub_cost_center_id = "Sub Cost Center is required";
        if (!formData.status) tempErrors.status = "Status is required";
        if (!formData.description)
            tempErrors.description = "Description is required";
        if (!formData.total_revenue_planned)
            tempErrors.total_revenue_planned =
                "Total revenue planned is required";
        if (!formData.total_expense_planned)
            tempErrors.total_expense_planned =
                "Total expense planned is required";
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);

        try {
            const processResponse = await axios.get(
                "/api/v1/processes?include=steps,creator,updater&filter[title]=Total Budget Approval"
            );

            const process = processResponse.data?.data?.[0];
            const processSteps = process?.steps || [];

            // Check if process and steps exist
            if (!process || processSteps.length === 0) {
                setErrors({
                    submit: "No Process or steps found for Total Budget Approval",
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

            const response = await axios.post("/api/v1/budgets", formData);
            const budgetId = response.data.data?.id;

            if (budgetId) {
                const budgetTransactionPayload = {
                    budget_id: budgetId,
                    requester_id: user_id,
                    assigned_to: assignUser?.approver_id,
                    order: processStep.order,
                    description: processStep.description,
                    status: "Pending",
                };
                await axios.post(
                    "/api/v1/budget-approval-transactions",
                    budgetTransactionPayload
                );

                const taskPayload = {
                    process_step_id: processStep.id,
                    process_id: processStep.process_id,
                    assigned_at: new Date().toISOString(),
                    urgency: "Normal",
                    assigned_to_user_id: assignUser?.approver_id,
                    assigned_from_user_id: user_id,
                    budget_id: budgetId,
                };
                await axios.post("/api/v1/tasks", taskPayload);
            }
            router.visit("/budget");
        } catch (error) {
            console.error("Error saving budget:", error);

            // Handle validation errors from the server
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderErrorMessage = (fieldName) => {
        return (
            errors[fieldName] && (
                <p className="text-red-500 text-sm mt-1">{errors[fieldName]}</p>
            )
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        Create a new Budget
                    </h2>
                    <p className="text-xl text-[#7D8086]">
                        Define a new budget for Maharat
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                    type="button"
                >
                    Create a Fiscal Period
                </button>
            </div>
            
            {/* Show any fetch errors at the top */}
            {errors.fetchError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 mb-2">
                    <p>{errors.fetchError}</p>
                </div>
            )}

            {/* Show any submission errors */}
            {errors.submit && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 mb-2">
                    <p>{errors.submit}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <SelectFloating
                            label="Fiscal Period"
                            name="fiscal_period_id"
                            value={formData.fiscal_period_id}
                            onChange={handleChange}
                            options={fiscalPeriod.map((fiscal) => ({
                                id: fiscal.id,
                                label: `${fiscal.period_name} ${
                                    fiscal.fiscal_year.split("-")[0]
                                }`,
                            }))}
                        />
                        {renderErrorMessage("fiscal_period_id")}
                    </div>
                    <div>
                        <SelectFloating
                            label="Department"
                            name="department_id"
                            value={formData.department_id}
                            onChange={handleChange}
                            options={departments.map((dept) => ({
                                id: dept.id,
                                label: dept.name,
                            }))}
                        />
                        {renderErrorMessage("department_id")}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
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
                        {renderErrorMessage("cost_center_id")}
                    </div>
                    <div>
                        <SelectFloating
                            label="Sub Cost Center"
                            name="sub_cost_center_id"
                            value={formData.sub_cost_center_id}
                            onChange={handleChange}
                            options={filteredSubCostCenters.map((sub) => ({
                                id: sub.id,
                                label: sub.name,
                            }))}
                            disabled={!formData.cost_center_id}
                        />
                        {renderErrorMessage("sub_cost_center_id")}
                    </div>
                    <div>
                        <SelectFloating
                            label="Status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            options={[
                                { value: "Active", label: "Active" },
                                { value: "Frozen", label: "Frozen" },
                                { value: "Closed", label: "Closed" },
                            ]}
                        />
                        {renderErrorMessage("status")}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                    <div>
                        <InputFloating
                            label="Total Revenue Planned"
                            name="total_revenue_planned"
                            type="number"
                            value={formData.total_revenue_planned}
                            onChange={handleChange}
                            min="0"
                        />
                        {renderErrorMessage("total_revenue_planned")}
                    </div>
                    <div>
                        <InputFloating
                            label="Total Expense Planned"
                            name="total_expense_planned"
                            type="number"
                            value={formData.total_expense_planned}
                            onChange={handleChange}
                            min="0"
                        />
                        {renderErrorMessage("total_expense_planned")}
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6 my-6">
                    <div>
                        <InputFloating
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                        />
                        {renderErrorMessage("description")}
                    </div>
                </div>

                <div className="flex justify-end my-8">
                    <button
                        type="submit"
                        className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Creating..." : "Create new Budget"}
                    </button>
                </div>
            </form>

            {/* Fiscal Period Modal */}
            <FiscalPeriodModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                fetchFiscalPeriods={fetchDropdownData}
            />
        </div>
    );
};

export default CreateBudget;
