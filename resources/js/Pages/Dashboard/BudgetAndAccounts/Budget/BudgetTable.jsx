import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEye,
    faFilePdf,
    faFileExcel,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";

const BudgetTable = () => {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("All");
    
    const filters = ["All", "Pending", "Referred", "Rejected", "Approved"];

    const staticBudgetData = [
        {
            id: 1,
            year: "2023",
            total_revenue_planned: "5,000,000",
            total_revenue_actual: "4,000,000",
            total_expense_planned: "5,000,000",
            total_expense_actual: "6,000,000",
        },
        {
            id: 2,
            year: "2024",
            total_revenue_planned: "5,500,000",
            total_revenue_actual: "5,200,000",
            total_expense_planned: "5,300,000",
            total_expense_actual: "5,400,000",
        },
        {
            id: 3,
            year: "2025",
            total_revenue_planned: "6,000,000",
            total_revenue_actual: "5,800,000",
            total_expense_planned: "5,700,000",
            total_expense_actual: "5,900,000",
        },
        {
            id: 4,
            year: "2026",
            total_revenue_planned: "6,000,000",
            total_revenue_actual: "5,800,000",
            total_expense_planned: "5,700,000",
            total_expense_actual: "5,900,000",
        },
        {
            id: 5,
            year: "2027",
            total_revenue_planned: "6,000,000",
            total_revenue_actual: "5,800,000",
            total_expense_planned: "5,700,000",
            total_expense_actual: "5,900,000",
        },
    ];

    useEffect(() => {
        setBudgets(staticBudgetData);
    }, []);

    return (
        <div className="min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    Budgets
                </h2>
                <div className="flex justify-between items-center gap-4">
                    <div className="p-1 space-x-2 border border-[#B9BBBD] bg-white rounded-full">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                className={`px-6 py-2 rounded-full text-xl transition ${
                                    selectedFilter === filter
                                        ? "bg-[#009FDC] text-white"
                                        : "text-[#9B9DA2]"
                                }`}
                                onClick={() => setSelectedFilter(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
                </div>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-center text-xl font-medium">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Year
                        </th>
                        <th className="py-3 px-4">Total Revenue Planned</th>
                        <th className="py-3 px-4">Total Revenue Actual</th>
                        <th className="py-3 px-4">Total Expense Planned</th>
                        <th className="py-3 px-4">Total Expense Actual</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-center text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="6" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="6"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : budgets.length > 0 ? (
                        budgets.map((budget) => (
                            <tr key={budget.id}>
                                <td className="py-3 px-4">{budget.year}</td>
                                <td className="py-3 px-4">
                                    {budget.total_revenue_planned}
                                </td>
                                <td className="py-3 px-4">
                                    {budget.total_revenue_actual}
                                </td>
                                <td className="py-3 px-4">
                                    {budget.total_expense_planned}
                                </td>
                                <td className="py-3 px-4">
                                    {budget.total_expense_actual}
                                </td>
                                <td className="py-3 px-4 flex items-center justify-center gap-4">
                                    <Link
                                        href={`budget/details/${budget.id}`}
                                        className="text-[#9B9DA2] hover:text-gray-800 transition duration-200"
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                    </Link>
                                    <button className="text-red-500 hover:text-red-700 transition duration-200">
                                        <FontAwesomeIcon icon={faFilePdf} />
                                    </button>
                                    <button className="text-green-500 hover:text-green-700 transition duration-200">
                                        <FontAwesomeIcon icon={faFileExcel} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="6"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Budgets found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default BudgetTable;
