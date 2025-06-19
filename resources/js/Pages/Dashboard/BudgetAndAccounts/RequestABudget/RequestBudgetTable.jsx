import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import axios from "axios";

const RequestBudgetTable = () => {
    const [budgetRequests, setBudgetRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchBudgetRequests = async () => {
            setLoading(true);
            try {
                const response = await axios.get(
                    `/api/v1/request-budgets?include=fiscalPeriod,department,costCenter,subCostCenter,creator`
                );
                setBudgetRequests(response.data.data);
            } catch (err) {
                setError("Failed to fetch budget requests.");
            } finally {
                setLoading(false);
            }
        };

        fetchBudgetRequests();
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
                    Create department Budget Request
                </Link>
            </div>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Year
                        </th>
                        <th className="py-3 px-4">Created By</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Cost Center</th>
                        <th className="py-3 px-4">Sub Cost Center</th>
                        <th className="py-3 px-4">Previous Budget</th>
                        <th className="py-3 px-4">Requested Amount</th>
                        <th className="py-3 px-4">Urgency</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="10" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="10"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : budgetRequests.length > 0 ? (
                        budgetRequests.map((request) => (
                            <tr key={request.id}>
                                <td className="py-3 px-4">
                                    {request.fiscal_period?.fiscal_year}
                                </td>
                                <td className="py-3 px-4">
                                    {request.creator?.name}
                                </td>
                                <td className="py-3 px-4">
                                    {request.department?.name}
                                </td>
                                <td className="py-3 px-4">
                                    {request.cost_center?.name}
                                </td>
                                <td className="py-3 px-4">
                                    {request.sub_cost_center_details?.name}
                                </td>
                                <td className="py-3 px-4">
                                    {request.previous_year_budget_amount}
                                </td>
                                <td className="py-3 px-4">
                                    {request.requested_amount}
                                </td>
                                <td className="py-3 px-4">{request.urgency}</td>
                                <td className="py-3 px-4">
                                    {request.reason_for_increase}
                                </td>
                                <td className="py-3 px-4 flex items-center justify-center gap-4">
                                    <Link
                                        href={`/request-budgets/${request.id}/edit`}
                                        className="text-blue-400 hover:text-blue-500"
                                        title="Edit Budget Request"
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </Link>
                                    <button
                                        className="text-red-500 hover:text-red-800"
                                        title="Delete Budget Request"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="10"
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
