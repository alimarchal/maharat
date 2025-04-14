import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEye,
    faFilePdf,
    faFileExcel,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import axios from "axios";

const IncomeStatementTable = () => {
    const [formData, setFormData] = useState({
        from_date: "",
        to_date: "",
    });

    const [incomeStatements, setIncomeStatements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [progress, setProgress] = useState(0);

    const fetchIncomeStatementData = async () => {
        if (!formData.from_date || !formData.to_date) return;
        setLoading(true);
        try {
            const revenueResponse = await axios.get(
                "/api/v1/income-statement/revenue",
                {
                    params: {
                        from_date: formData.from_date,
                        to_date: formData.to_date,
                    },
                }
            );
            const expensesResponse = await axios.get(
                "/api/v1/income-statement/expenses",
                {
                    params: {
                        from_date: formData.from_date,
                        to_date: formData.to_date,
                    },
                }
            );
            const transactionsResponse = await axios.get(
                "/api/v1/income-statement/transactions",
                {
                    params: {
                        from_date: formData.from_date,
                        to_date: formData.to_date,
                    },
                }
            );
            const totalRevenue =
                parseFloat(revenueResponse.data.data.total_revenue) || 0;
            const totalExpenses =
                parseFloat(expensesResponse.data.data.total_expenses) || 0;
            const previousTransactions =
                parseFloat(transactionsResponse.data.data.total_amount) || 0;

            const change = totalExpenses - totalRevenue;
            const finalNetAssets = change + previousTransactions;

            const fromDate = new Date(formData.from_date);
            const toDate = new Date(formData.to_date);
            const monthPeriod = `${fromDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            })} - ${toDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            })}`;

            setIncomeStatements([
                {
                    id: 1,
                    month: monthPeriod,
                    total_revenue: totalRevenue.toFixed(2),
                    total_expenses: totalExpenses.toFixed(2),
                    change: change.toFixed(2),
                    previous: previousTransactions.toFixed(2),
                    final_net_assets: finalNetAssets.toFixed(2),
                },
            ]);

            setError("");
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Failed to fetch income statement data"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (formData.from_date && formData.to_date) {
            fetchIncomeStatementData();
        }
    }, [formData.from_date, formData.to_date]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    Income Statement
                </h2>
                <div className="flex flex-col lg:flex-row lg:justify-start items-center gap-3 w-full md:w-2/5">
                    <div className="relative w-full">
                        <input
                            type="date"
                            name="from_date"
                            value={formData.from_date}
                            onChange={handleChange}
                            className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                        />
                        <label
                            className={`absolute left-3 px-2 bg-white text-gray-500 text-base transition-all
                            ${
                                formData.from_date
                                    ? "-top-2 text-[#009FDC] text-sm"
                                    : "top-1/2 -translate-y-1/2"
                            }
                            peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#009FDC]`}
                        >
                            Select From Date
                        </label>
                    </div>
                    <div className="relative w-full">
                        <input
                            type="date"
                            name="to_date"
                            value={formData.to_date}
                            onChange={handleChange}
                            className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                        />
                        <label
                            className={`absolute left-3 px-2 bg-white text-gray-500 text-base transition-all
                            ${
                                formData.to_date
                                    ? "-top-2 text-[#009FDC] text-sm"
                                    : "top-1/2 -translate-y-1/2"
                            }
                            peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#009FDC]`}
                        >
                            Select To Date
                        </label>
                    </div>
                </div>
            </div>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Month Period
                        </th>
                        <th className="py-3 px-4">Total Revenue</th>
                        <th className="py-3 px-4">Total Expenses</th>
                        <th className="py-3 px-4">Change</th>
                        <th className="py-3 px-4">Previous</th>
                        <th className="py-3 px-4">Final Net Assets</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="7" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="7"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : incomeStatements.length > 0 ? (
                        incomeStatements.map((statement) => (
                            <tr key={statement.id}>
                                <td className="py-3 px-4">{statement.month}</td>
                                <td className="py-3 px-4">
                                    {Number(
                                        statement.total_revenue
                                    ).toLocaleString()}{" "}
                                    SAR
                                </td>
                                <td className="py-3 px-4">
                                    {Number(
                                        statement.total_expenses
                                    ).toLocaleString()}{" "}
                                    SAR
                                </td>
                                <td className="py-3 px-4">
                                    {Number(statement.change).toLocaleString()}{" "}
                                    SAR
                                </td>
                                <td className="py-3 px-4">
                                    {Number(
                                        statement.previous
                                    ).toLocaleString()}{" "}
                                    SAR
                                </td>
                                <td className="py-3 px-4">
                                    {Number(
                                        statement.final_net_assets
                                    ).toLocaleString()}{" "}
                                    SAR
                                </td>
                                <td className="py-3 px-4 flex justify-center items-center text-center space-x-3">
                                    <Link
                                        href={`income-statement/details/${statement.id}`}
                                        className="text-[#9B9DA2] hover:text-gray-500"
                                        title="View Income Statement"
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                    </Link>
                                    <button
                                        className="w-4 h-4"
                                        title="Download Income Statement"
                                    >
                                        <img
                                            src="/images/pdf-file.png"
                                            alt="PDF"
                                            className="w-full h-full"
                                        />
                                    </button>
                                    <button
                                        className="text-green-500 hover:text-green-600"
                                        title="Export to Excel"
                                    >
                                        <FontAwesomeIcon icon={faFileExcel} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" className="text-center py-4">
                                {formData.from_date && formData.to_date
                                    ? "No data found for selected date range"
                                    : "Please select date range"}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default IncomeStatementTable;
