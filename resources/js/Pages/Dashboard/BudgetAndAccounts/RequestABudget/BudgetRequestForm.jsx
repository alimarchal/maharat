import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink } from "@fortawesome/free-solid-svg-icons";
import SelectFloating from "../../../../Components/SelectFloating";
import InputFloating from "../../../../Components/InputFloating";
import { router, usePage } from "@inertiajs/react";

const BudgetRequestForm = () => {
    const user_id = usePage().props.auth.user.id;

    const [formData, setFormData] = useState({
        fiscal_period_id: "",
        department_id: "",
        cost_center_id: "",
        sub_cost_center: "",
        previous_year_budget_amount: "",
        requested_amount: "",
        urgency: "",
        attachment: null,
        reason_for_increase: "",
    });
    const [errors, setErrors] = useState({});
    const [departments, setDepartments] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [subCostCenters, setSubCostCenters] = useState([]);
    const [fiscalYears, setFiscalYears] = useState([]);
    const [filteredSubCostCenters, setFilteredSubCostCenters] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [deptRes, costRes, yearRes] = await Promise.all([
                axios.get("/api/v1/departments"),
                axios.get("/api/v1/cost-centers"),
                axios.get("/api/v1/fiscal-periods"),
            ]);
            setDepartments(deptRes.data.data);
            setCostCenters(costRes.data.data);
            setSubCostCenters(costRes.data.data);
            setFiscalYears(yearRes.data.data);
        } catch (error) {
            console.error("Error fetching data", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "cost_center_id" ? { sub_cost_center: "" } : {}),
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

    const handleFileChange = (e) => {
        setFormData((prev) => ({ ...prev, attachment: e.target.files[0] }));
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.fiscal_period_id)
            newErrors.fiscal_period_id = "Year is required";
        if (!formData.department_id)
            newErrors.department_id = "Department is required";
        if (!formData.cost_center_id)
            newErrors.cost_center_id = "Cost Center is required";
        if (!formData.sub_cost_center)
            newErrors.sub_cost_center = "Sub Cost Center is required";
        if (!formData.previous_year_budget_amount)
            newErrors.previous_year_budget_amount =
                "Previous Budget is required";
        if (!formData.requested_amount)
            newErrors.requested_amount = "Requested Amount is required";
        if (!formData.urgency) newErrors.urgency = "Urgency is required";
        if (!formData.reason_for_increase)
            newErrors.reason_for_increase = "Reason is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const response = await axios.post(
                "/api/v1/request-budgets",
                formData
            );
            console.log("Budget Request:", response);
            const budgetRequestId = response.data.data?.id;
            if (budgetRequestId) {
                const processResponse = await axios.get(
                    "/api/v1/processes?include=steps,creator,updater&filter[title]=Budget Request Approval"
                );

                if (processResponse.data?.data?.[0]?.steps?.[0]) {
                    const process = processResponse.data.data[0];
                    const processStep = process.steps[0];

                    // Only proceed if we have valid process step data
                    if (processStep?.id && processStep?.order) {
                        const processResponseViaUser = await axios.get(
                            `/api/v1/process-steps/${processStep.order}/user/${user_id}`
                        );
                        const assignUser = processResponseViaUser?.data;

                        if (assignUser?.user?.user?.id) {
                            const RequestBudgetTransactionPayload = {
                                request_budgets_id: budgetRequestId,
                                requester_id: user_id,
                                assigned_to: assignUser.user.user.id,
                                order: processStep.order,
                                description: processStep.description,
                                status: "Pending",
                            };
                            await axios.post(
                                "/api/v1/budget-request-approval-trans",
                                RequestBudgetTransactionPayload
                            );

                            const taskPayload = {
                                process_step_id: processStep.id,
                                process_id: processStep.process_id,
                                assigned_at: new Date().toISOString(),
                                urgency: "Normal",
                                assigned_to_user_id: assignUser.user.user.id,
                                assigned_from_user_id: user_id,
                                request_budgets_id: budgetRequestId,
                            };
                            await axios.post("/api/v1/tasks", taskPayload);
                        }
                    }
                }
            }
            router.visit("/request-budgets");
        } catch (error) {
            console.error("Error saving Request a budget:", error);
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        Budget Request
                    </h2>
                    <p className="text-[#7D8086] text-lg">
                        Request by department head for the budget
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
                    {errors.fiscal_period_id && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.fiscal_period_id}
                        </p>
                    )}
                </div>
            </div>

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
                        {errors.department_id && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.department_id}
                            </p>
                        )}
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
                        {errors.cost_center_id && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.cost_center_id}
                            </p>
                        )}
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
                        />
                        {errors.sub_cost_center && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.sub_cost_center}
                            </p>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputFloating
                            label="Previous Budget Amount"
                            name="previous_year_budget_amount"
                            value={formData.previous_year_budget_amount}
                            onChange={handleChange}
                        />
                        {errors.previous_year_budget_amount && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.previous_year_budget_amount}
                            </p>
                        )}
                    </div>
                    <div>
                        <InputFloating
                            label="Requested Amount"
                            name="requested_amount"
                            value={formData.requested_amount}
                            onChange={handleChange}
                        />
                        {errors.requested_amount && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.requested_amount}
                            </p>
                        )}
                    </div>
                    <div>
                        <SelectFloating
                            label="Urgency"
                            name="urgency"
                            value={formData.urgency}
                            onChange={handleChange}
                            options={[
                                { value: "High", label: "High" },
                                { value: "Medium", label: "Medium" },
                                { value: "Low", label: "Low" },
                            ]}
                        />
                        {errors.urgency && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.urgency}
                            </p>
                        )}
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
                                <span className="text-sm">Attachment</span>
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
                    {errors.reason_for_increase && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.reason_for_increase}
                        </p>
                    )}
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-[#009FDC] text-white text-lg font-medium px-6 py-3 rounded-full hover:bg-[#007CB8]"
                    >
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BudgetRequestForm;
