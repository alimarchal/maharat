import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import axios from "axios";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";

const RequestBudgetTable = () => {
    const [budgetRequests, setBudgetRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);

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

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this budget request? This will also delete any associated tasks and approval transactions.")) {
            return;
        }

        setDeletingId(id);
        try {
            await axios.delete(`/api/v1/request-budgets/${id}`);
            setBudgetRequests(prev => prev.filter(request => request.id !== id));
        } catch (err) {
            alert("Failed to delete budget request. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

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
                        <th className="py-3 px-2">Planned Revenue</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
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
                                <td className="py-3 px-2">
                                    {request.revenue_planned}
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        request.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                                        request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                        request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                        request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                        {request.status}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-start justify-center gap-4">
                                        <Link
                                            href={`/request-budgets/${request.id}/edit`}
                                            className="text-blue-400 hover:text-blue-500"
                                            title="Edit Budget Request"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </Link>
                                        {request.attachment_path && (
                                            <button
                                                className="w-4 h-4"
                                                onClick={() => {
                                                    const filePath = request.attachment_path;
                                                    if (filePath) {
                                                        const fixedPath = filePath.startsWith("http") 
                                                            ? filePath 
                                                            : filePath.startsWith("/storage/") 
                                                                ? filePath 
                                                                : `/storage/${filePath}`;
                                                        window.open(fixedPath, "_blank");
                                                    }
                                                }}
                                                title="View Attachment"
                                            >
                                                <img
                                                    src="/images/pdf-file.png"
                                                    alt="PDF"
                                                    className="w-full h-full"
                                                />
                                            </button>
                                        )}
                                        <button
                                            className={`text-red-500 hover:text-red-800 ${
                                                deletingId === request.id ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                            title="Delete Budget Request"
                                            onClick={() => handleDelete(request.id)}
                                            disabled={deletingId === request.id}
                                        >
                                            {deletingId === request.id ? (
                                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <FontAwesomeIcon icon={faTrash} />
                                            )}
                                        </button>
                                    </div>
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
