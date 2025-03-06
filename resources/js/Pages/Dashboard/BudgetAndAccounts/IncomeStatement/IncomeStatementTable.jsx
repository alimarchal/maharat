import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEye,
    faFilePdf,
    faFileExcel,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";

const IncomeStatementTable = () => {
    const [formData, setFormData] = useState({
        from_date: "",
        to_date: "",
    });

    const [incomeStatements, setIncomeStatements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const staticIncomeData = [
        {
            id: 1,
            month: "01 Nov - 30 Nov, 2024",
            total_revenue: "500000.00",
            total_expenses: "400000.00",
            change: "100000.00",
            previous: "4,000,000.00",
            final_net_assets: "4,100,000.00",
        },
        {
            id: 2,
            month: "01 Dec - 31 Dec, 2024",
            total_revenue: "500000.00",
            total_expenses: "400000.00",
            change: "100000.00",
            previous: "4,000,000.00",
            final_net_assets: "4,100,000.00",
        },
        {
            id: 3,
            month: "01 Jan - 31 Jan, 2025",
            total_revenue: "500000.00",
            total_expenses: "400000.00",
            change: "100000.00",
            previous: "4,000,000.00",
            final_net_assets: "4,100,000.00",
        },
        {
            id: 4,
            month: "01 Feb - 28 Feb, 2025",
            total_revenue: "500000.00",
            total_expenses: "400000.00",
            change: "100000.00",
            previous: "4,000,000.00",
            final_net_assets: "4,100,000.00",
        },
        {
            id: 5,
            month: "01 Mar - 31 Mar, 2025",
            total_revenue: "500000.00",
            total_expenses: "400000.00",
            change: "100000.00",
            previous: "4,000,000.00",
            final_net_assets: "4,100,000.00",
        },
    ];

    useEffect(() => {
        // const fetchIncomeStatements = async () => {
        //     setLoading(true);
        //     try {
        //         const response = await fetch("/api/v1/income-statements");
        //         const data = await response.json();
        //         if (response.ok) {
        //             setIncomeStatements(data);
        //         } else {
        //             setError("Failed to fetch income statements.");
        //         }
        //     } catch (err) {
        //         setError("Error loading income statements.");
        //     } finally {
        //         setLoading(false);
        //     }
        // };

        // fetchIncomeStatements();

        // Using static data for now
        setIncomeStatements(staticIncomeData);
    }, []);

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
                                        ? "-top-2 text-[#009FDC] text-sm px-2"
                                        : "top-1/2 text-gray-400 -translate-y-1/2"
                                }
                                peer-focus:top-0 peer-focus:text-sm peer-focus:text-[#009FDC] peer-focus:px-2`}
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
                                        ? "-top-2 text-[#009FDC] text-sm px-2"
                                        : "top-1/2 text-gray-400 -translate-y-1/2"
                                }
                                peer-focus:top-0 peer-focus:text-sm peer-focus:text-[#009FDC] peer-focus:px-2`}
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
                            Month
                        </th>
                        <th className="py-3 px-4">Total Revenue</th>
                        <th className="py-3 px-4">Total Expenses</th>
                        <th className="py-3 px-4">Change</th>
                        <th className="py-3 px-4">Previous</th>
                        <th className="py-3 px-4">Final Net Assets</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Action
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
                                    {statement.total_revenue}
                                </td>
                                <td className="py-3 px-4">
                                    {statement.total_expenses}
                                </td>
                                <td className="py-3 px-4">
                                    {statement.change}
                                </td>
                                <td className="py-3 px-4">
                                    {statement.previous}
                                </td>
                                <td className="py-3 px-4">
                                    {statement.final_net_assets}
                                </td>
                                <td className="py-3 px-4 flex items-center justify-center gap-4">
                                    <Link
                                        href={`income-statement/details/${statement.id}`}
                                        className="flex items-center justify-center rounded-full text-[#9B9DA2] hover:text-gray-800 cursor-pointer transition duration-200"
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
                                colSpan="7"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Income Statements found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default IncomeStatementTable;
