import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";

const RequestBudgetTable = () => {
    const [budgetRequests, setBudgetRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const staticRequestData = [
        {
            id: 1,
            year: "2023",
            department: "Finance",
            costCenter: "Operations",
            subCostCenter: "Marketing",
            previousBudget: "$10,000",
            requestedAmount: "$15,000",
            urgency: "High",
            description: "Additional resources needed",
        },
        {
            id: 2,
            year: "2024",
            department: "HR",
            costCenter: "Recruitment",
            subCostCenter: "Training",
            previousBudget: "$20,000",
            requestedAmount: "$25,000",
            urgency: "Medium",
            description: "New hiring initiatives",
        },
    ];

    useEffect(() => {
        setBudgetRequests(staticRequestData);
    }, []);

    return (
        <div className="w-full">
            <div className="flex justify-between items-center text-center mb-6">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    Budget Requests
                </h2>
                <Link
                    href={`/request-budgets/create`}
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                >
                    Create new Budget Request
                </Link>
            </div>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-center text-xl font-medium">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Year
                        </th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Cost Center</th>
                        <th className="py-3 px-4">Sub Cost Center</th>
                        <th className="py-3 px-4">Previous Budget</th>
                        <th className="py-3 px-4">Requested Amount</th>
                        <th className="py-3 px-4">Urgency</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-center text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="9" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="9"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : budgetRequests.length > 0 ? (
                        budgetRequests.map((request) => (
                            <tr key={request.id}>
                                <td className="py-3 px-4">{request.year}</td>
                                <td className="py-3 px-4">
                                    {request.department}
                                </td>
                                <td className="py-3 px-4">
                                    {request.costCenter}
                                </td>
                                <td className="py-3 px-4">
                                    {request.subCostCenter}
                                </td>
                                <td className="py-3 px-4">
                                    {request.previousBudget}
                                </td>
                                <td className="py-3 px-4">
                                    {request.requestedAmount}
                                </td>
                                <td className="py-3 px-4">{request.urgency}</td>
                                <td className="py-3 px-4">
                                    {request.description}
                                </td>
                                <td className="py-3 px-4 flex items-center justify-center gap-4">
                                    <button className="text-gray-600 hover:text-gray-800">
                                        <FontAwesomeIcon icon={faEye} />
                                    </button>
                                    <button className="text-gray-600 hover:text-gray-800">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button className="text-red-600 hover:text-red-900">
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="9"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Budget Requests found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default RequestBudgetTable;
