import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";

const ViewBudget = () => {
    const [budgets, setBudgets] = useState([]);

    const staticBudgetData = [
        {
            id: 1,
            costCenter: "Management",
            department: "Management",
            amountRequested: "6,000,000",
            amountApproved: "6,000,000",
        },
        {
            id: 2,
            costCenter: "IT",
            department: "Engineering",
            amountRequested: "6,000,000",
            amountApproved: "6,000,000",
        },
        {
            id: 3,
            costCenter: "Marketing",
            department: "Marketing",
            amountRequested: "6,000,000",
            amountApproved: "6,000,000",
        },
        {
            id: 4,
            costCenter: "Training",
            department: "Training",
            amountRequested: "6,000,000",
            amountApproved: "6,000,000",
        },
        {
            id: 5,
            costCenter: "Maintenance",
            department: "Building",
            amountRequested: "6,000,000",
            amountApproved: "6,000,000",
        },
    ];

    useEffect(() => {
        setBudgets(staticBudgetData);
    }, []);

    return (
        <div className="w-full">
            <h2 className="text-3xl font-bold text-[#2C323C] mb-6">Budgets</h2>
            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-center text-xl font-medium">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Cost Center
                        </th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Amount Requested</th>
                        <th className="py-3 px-4">Amount Approved</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            Download
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-center text-base font-medium divide-y divide-[#D7D8D9]">
                    {budgets.map((budget) => (
                        <tr key={budget.id}>
                            <td className="py-3 px-4">{budget.costCenter}</td>
                            <td className="py-3 px-4">{budget.department}</td>
                            <td className="py-3 px-4">
                                {budget.amountRequested}
                            </td>
                            <td className="py-3 px-4">
                                {budget.amountApproved}
                            </td>
                            <td className="py-3 px-4">
                                <Link>
                                    <FontAwesomeIcon
                                        icon={faDownload}
                                        className="text-gray-500 cursor-pointer hover:text-gray-700"
                                    />
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mt-8 p-4 bg-[#DCECF2] rounded-2xl text-xl font-medium text-[#2C323C] flex justify-end text-center">
                <p>Total Budget Amount:</p>
                <span className="ms-8 font-bold">30,000,000</span>
            </div>
        </div>
    );
};

export default ViewBudget;
