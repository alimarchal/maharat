import React, { useState, useEffect } from "react";
import axios from "axios";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";
import { router } from "@inertiajs/react";
import FiscalPeriodModal from "./FiscalPeriodModal";

const CreateBudget = () => {
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

    useEffect(() => {
        fetchDropdownData();
    }, []);

    const fetchDropdownData = async () => {
        try {
            const [deptResponse, costCenterResponse, fiscalPeriodResponse] =
                await Promise.all([
                    axios.get("/api/v1/departments"),
                    axios.get("/api/v1/cost-centers"),
                    axios.get("/api/v1/fiscal-periods"),
                ]);
            setDepartments(deptResponse.data.data);
            setCostCenters(costCenterResponse.data.data);
            setSubCostCenters(costCenterResponse.data.data);
            setFiscalPeriod(fiscalPeriodResponse.data.data);
        } catch (error) {
            console.error("Error fetching dropdown data:", error);
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
            await axios.post("/api/v1/budgets", formData);
            router.visit("/budget");
        } catch (error) {
            console.error("Error saving budget:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                >
                    Create a Fiscal Period
                </button>
            </div>

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
                        {errors.fiscal_period_id && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.fiscal_period_id}
                            </p>
                        )}
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
                        {errors.department_id && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.department_id}
                            </p>
                        )}
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
                        {errors.cost_center_id && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.cost_center_id}
                            </p>
                        )}
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
                        />
                        {errors.sub_cost_center_id && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.sub_cost_center_id}
                            </p>
                        )}
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
                        {errors.status && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.status}
                            </p>
                        )}
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
                        />
                        {errors.total_revenue_planned && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.total_revenue_planned}
                            </p>
                        )}
                    </div>
                    <div>
                        <InputFloating
                            label="Total Expense Planned"
                            name="total_expense_planned"
                            type="number"
                            value={formData.total_expense_planned}
                            onChange={handleChange}
                        />
                        {errors.total_expense_planned && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.total_expense_planned}
                            </p>
                        )}
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
                        {errors.description && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end my-8">
                    <button
                        type="submit"
                        className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5]"
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
