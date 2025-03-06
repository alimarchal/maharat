import React, { useEffect, useState } from "react";

const ViewBudget = () => {
    const [budgets, setBudgets] = useState([]);

    const staticBudgetData = [
        {
            id: 1,
            costCenter: "Management",
            subCostCenter: "Management",
            department: "Management",
            amountRequested: 6000000,
            amountApproved: 6000000,
        },
        {
            id: 2,
            costCenter: "IT",
            subCostCenter: "IT",
            department: "Engineering",
            amountRequested: 6000000,
            amountApproved: 6000000,
        },
        {
            id: 3,
            costCenter: "Marketing",
            subCostCenter: "Marketing",
            department: "Marketing",
            amountRequested: 6000000,
            amountApproved: 6000000,
        },
        {
            id: 4,
            costCenter: "Training",
            subCostCenter: "Training",
            department: "Training",
            amountRequested: 6000000,
            amountApproved: 6000000,
        },
        {
            id: 5,
            costCenter: "Maintenance",
            subCostCenter: "Training",
            department: "Building",
            amountRequested: 6000000,
            amountApproved: 6000000,
        },
    ];

    useEffect(() => {
        setBudgets(staticBudgetData);
    }, []);

    const totalRequested = budgets.reduce(
        (sum, budget) => sum + budget.amountRequested,
        0
    );
    const totalApproved = budgets.reduce(
        (sum, budget) => sum + budget.amountApproved,
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
                    {budgets.map((budget) => (
                        <tr key={budget.id}>
                            <td className="py-3 px-4">{budget.costCenter}</td>
                            <td className="py-3 px-4">
                                {budget.subCostCenter}
                            </td>
                            <td className="py-3 px-4">{budget.department}</td>
                            <td className="py-3 px-4">
                                {budget.amountRequested.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                                {budget.amountApproved.toLocaleString()}
                            </td>
                        </tr>
                    ))}

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
        </div>
    );
};

export default ViewBudget;
