import React, { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";

const BudgetTransactionDetails = () => {
    const { requestBudgetId } = usePage().props;
    const [auditLogs, setAuditLogs] = useState([]);
    const [budgetInfo, setBudgetInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchBudgetDetails();
    }, []);

    const fetchBudgetDetails = async () => {
        setLoading(true);
        setError("");
        try {
            const [budgetResponse, logsResponse] = await Promise.all([
                axios.get(`/api/v1/request-budgets/${requestBudgetId}?include=fiscalPeriod,department,costCenter,subCostCenter`),
                axios.get(`/api/v1/request-budgets/${requestBudgetId}/audit-logs`)
            ]);
            
            setBudgetInfo(budgetResponse.data.data);
            setAuditLogs(logsResponse.data.data || []);
            setError("");
        } catch (error) {
            console.error("Error fetching budget details:", error);
            setError(
                error.response?.data?.message ||
                "Failed to load budget transaction details. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const getActionLabel = (action) => {
        const labels = {
            'reserve': 'Reserved',
            'release': 'Released',
            'transfer': 'Transferred',
            'consume': 'Consumed',
            'allocate': 'Allocated'
        };
        return labels[action] || action;
    };

    const getActionColor = (action) => {
        const colors = {
            'reserve': 'text-blue-600 bg-blue-50',
            'release': 'text-green-600 bg-green-50',
            'transfer': 'text-purple-600 bg-purple-50',
            'consume': 'text-red-600 bg-red-50',
            'allocate': 'text-indigo-600 bg-indigo-50'
        };
        return colors[action] || 'text-gray-600 bg-gray-50';
    };

    if (loading) {
        return (
            <div className="w-full flex justify-center items-center py-12">
                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-[#2C323C] mb-4">
                    Budget Transaction Details
                </h2>
                {budgetInfo && (
                    <div className="p-4 mb-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Cost Center</p>
                                <p className="font-semibold">{budgetInfo.cost_center?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Sub Cost Center</p>
                                <p className="font-semibold">{budgetInfo.sub_cost_center_details?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Department</p>
                                <p className="font-semibold">{budgetInfo.department?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Fiscal Period</p>
                                <p className="font-semibold">{budgetInfo.fiscal_period?.fiscal_year || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Approved Amount</p>
                                <p className="font-semibold text-green-600">
                                    {parseFloat(budgetInfo.approved_amount || 0).toLocaleString()} SAR
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Reserved Amount</p>
                                <p className="font-semibold text-blue-600">
                                    {parseFloat(budgetInfo.reserved_amount || 0).toLocaleString()} SAR
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Consumed Amount</p>
                                <p className="font-semibold text-red-600">
                                    {parseFloat(budgetInfo.consumed_amount || 0).toLocaleString()} SAR
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Balance Amount</p>
                                <p className="font-semibold text-orange-600">
                                    {parseFloat(budgetInfo.balance_amount || 0).toLocaleString()} SAR
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-center text-xl font-medium">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">#</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Reference</th>
                        <th className="py-3 px-4">Reserved Before</th>
                        <th className="py-3 px-4">Reserved After</th>
                        <th className="py-3 px-4">Balance Before</th>
                        <th className="py-3 px-4">Balance After</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">Created By</th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-center text-base font-medium divide-y divide-[#D7D8D9]">
                    {auditLogs.length > 0 ? (
                        auditLogs.map((log, index) => (
                            <tr key={log.id}>
                                <td className="py-3 px-4">{index + 1}</td>
                                <td className="py-3 px-4">
                                    {new Date(log.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getActionColor(log.action)}`}>
                                            {getActionLabel(log.action)}
                                        </span>
                                        {log.is_inferred && (
                                            <span className="text-xs text-gray-500 italic">(Inferred)</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-4 font-semibold">
                                    {parseFloat(log.amount || 0).toLocaleString()} SAR
                                </td>
                                <td className="py-3 px-4">
                                    {log.purchase_order_no ? (
                                        <div>
                                            <div className="font-medium">{log.purchase_order_no}</div>
                                            {log.payment_order_number && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Payment: {log.payment_order_number}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        'N/A'
                                    )}
                                </td>
                                <td className="py-3 px-4">
                                    {log.reserved_amount_before !== null 
                                        ? parseFloat(log.reserved_amount_before).toLocaleString() 
                                        : 'N/A'}
                                </td>
                                <td className="py-3 px-4">
                                    {log.reserved_amount_after !== null 
                                        ? parseFloat(log.reserved_amount_after).toLocaleString() 
                                        : 'N/A'}
                                </td>
                                <td className="py-3 px-4">
                                    {log.balance_amount_before !== null 
                                        ? parseFloat(log.balance_amount_before).toLocaleString() 
                                        : 'N/A'}
                                </td>
                                <td className="py-3 px-4">
                                    {log.balance_amount_after !== null 
                                        ? parseFloat(log.balance_amount_after).toLocaleString() 
                                        : 'N/A'}
                                </td>
                                <td className="py-3 px-4">
                                    {log.created_by_name || 'N/A'}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="10" className="text-center py-8 text-gray-500">
                                No transaction history available for this budget.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default BudgetTransactionDetails;

