import React, { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";

const ViewBudget = () => {
    const { budgetId, auth } = usePage().props;
    const user_id = auth.user.id;

    // Get the mode from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode");
    const isEditMode = mode === "edit";

    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isApproving, setIsApproving] = useState(false);
    const [approvalError, setApprovalError] = useState("");

    useEffect(() => {
        fetchBudget();
    }, []);

    const fetchBudget = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await axios.get(
                `/api/v1/budgets/${budgetId}?include=fiscalPeriod,department,costCenter,subCostCenter,creator,updater`
            );
            const fiscalPeriodId = res.data?.data?.fiscal_period_id;

            const response = await axios.get(
                `/api/v1/budgets?include=fiscalPeriod,department,costCenter,subCostCenter,creator,requestBudget`
            );
            if (response.data && response.data.data) {
                const filteredBudgets = response.data.data.filter(
                    (budget) => budget.fiscal_period_id === fiscalPeriodId
                );
                setBudgets(filteredBudgets.length > 0 ? filteredBudgets : []);
            } else {
                setError("Invalid response format. Please try again.");
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to fetch budgets. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleApproveBudget = async () => {
        setIsApproving(true);
        setApprovalError("");

        try {
            // Get the Budget Approval process
            const processResponse = await axios.get(
                "/api/v1/processes?include=steps,creator,updater&filter[title]=Budget Approval"
            );
            const process = processResponse.data?.data?.[0];
            const processSteps = process?.steps || [];

            // Check if process and steps exist
            if (!process || processSteps.length === 0) {
                setApprovalError(
                    "No Process or steps found for Budget Approval"
                );
                setIsApproving(false);
                return;
            }

            const processStep = processSteps[0];

            // Get the assignee for this process step and user
            const processResponseViaUser = await axios.get(
                `/api/v1/process-steps/${processStep.id}/user/${user_id}`
            );
            const assignUser = processResponseViaUser?.data?.data;

            if (!assignUser) {
                setApprovalError(
                    "No assignee found for this process step and user"
                );
                setIsApproving(false);
                return;
            }

            // Create budget approval transactions for each budget
            const approvalPromises = budgets.map(async (budget) => {
                // Create budget approval transaction
                const transactionPayload = {
                    budget_id: budget.id,
                    requester_id: user_id,
                    assigned_to: assignUser.approver_id,
                    order: processStep.order,
                    description: processStep.description,
                    status: "Pending",
                };

                await axios.post(
                    "/api/v1/budget-approval-transactions",
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
                    budget_id: budget.id,
                };

                await axios.post("/api/v1/tasks", taskPayload);
            });

            // Wait for all approval processes to complete
            await Promise.all(approvalPromises);
            alert("Budget approval process initiated successfully!");
            await fetchBudget();
        } catch (error) {
            console.error("Error initiating budget approval:", error);
            setApprovalError(
                error.response?.data?.message ||
                    error.message ||
                    "An error occurred while initiating the budget approval process."
            );
        } finally {
            setIsApproving(false);
        }
    };

    const totalRequested = budgets?.reduce(
        (sum, budget) => sum + (parseFloat(budget.total_expense_planned) || 0),
        0
    );

    const totalApproved = budgets?.reduce(
        (sum, budget) =>
            sum + (parseFloat(budget.request_budget?.approved_amount) || 0),
        0
    );

    return (
        <div className="w-full">
            <h2 className="text-3xl font-bold text-[#2C323C] mb-6">
                Budget {budgets[0]?.fiscal_period?.fiscal_year}
            </h2>

            {/* Show approval error if any */}
            {approvalError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <p>{approvalError}</p>
                </div>
            )}

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-center text-xl font-medium">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Cost Centers
                        </th>
                        <th className="py-3 px-4">Sub Cost Centers</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Amount Requested</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            Amount Approved
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-center text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="5" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="5"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : budgets.length > 0 ? (
                        budgets.map((budget) => (
                            <tr key={budget.id}>
                                <td className="py-3 px-4">
                                    {budget.cost_center?.name}
                                </td>
                                <td className="py-3 px-4">
                                    {budget.sub_cost_center?.name}
                                </td>
                                <td className="py-3 px-4">
                                    {budget.department?.name}
                                </td>
                                <td className="py-3 px-4 text-blue-500">
                                    {parseFloat(
                                        budget.total_expense_planned
                                    ).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-green-500">
                                    {parseFloat(
                                        budget.request_budget
                                            ?.approved_amount || 0
                                    ).toLocaleString()}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="py-4">
                                No budget data available.
                            </td>
                        </tr>
                    )}

                    <tr className="bg-[#DCECF2] text-2xl font-bold border-none">
                        <td
                            className="p-4 rounded-tl-2xl rounded-bl-2xl"
                            colSpan="3"
                        >
                            Total Amounts:
                        </td>
                        <td className="p-4 text-blue-500">
                            {totalRequested.toLocaleString()}
                        </td>
                        <td className="p-4 text-green-500 rounded-tr-2xl rounded-br-2xl">
                            {totalApproved.toLocaleString()}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Show Approve Budget button only when coming from edit mode */}
            {isEditMode && (
                <div className="flex justify-end my-6">
                    <button
                        onClick={handleApproveBudget}
                        disabled={isApproving || budgets.length === 0}
                        className={`px-4 py-2 rounded-full text-xl font-medium ${
                            isApproving || budgets.length === 0
                                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                                : "bg-[#009FDC] text-white hover:bg-[#007CB8]"
                        }`}
                    >
                        {isApproving ? "Processing..." : "Approve Budget"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ViewBudget;
