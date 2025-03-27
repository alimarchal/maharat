import React, { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";

const ViewBudget = () => {
    const { budgetId } = usePage().props;

    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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
                `/api/v1/request-budgets?include=fiscalPeriod,department,costCenter,subCostCenter,creator`
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

    const totalRequested = budgets?.reduce(
        (sum, budget) => sum + (parseFloat(budget.requested_amount) || 0),
        0
    );

    const totalApproved = budgets?.reduce(
        (sum, budget) =>
            sum + (parseFloat(budget.previous_year_budget_amount) || 0),
        0
    );

    return (
        <div className="w-full">
            <h2 className="text-3xl font-bold text-[#2C323C] mb-6">Budgets</h2>
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
                                    {budget.sub_cost_center_details?.name}
                                </td>
                                <td className="py-3 px-4">
                                    {budget.department?.name}
                                </td>
                                <td className="py-3 px-4 text-blue-500">
                                    {parseFloat(
                                        budget.requested_amount
                                    ).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-green-500">
                                    {parseFloat(
                                        budget.previous_year_budget_amount
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
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default ViewBudget;
