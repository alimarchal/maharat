import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import SelectFloating from "@/Components/SelectFloating";

const BalanceSheetReport = () => {
    const [formData, setFormData] = useState({
        year: "",
    });
    const [errors, setErrors] = useState({});

    const [openSections, setOpenSections] = useState({
        currentAssets: true,
        nonCurrentAssets: false,
        currentLiabilities: false,
        nonCurrentLiabilities: false,
        withoutDonorRestrictions: false,
        withDonorRestrictions: false,
    });

    const toggleSection = (section) => {
        setOpenSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: "" });
    };

    const balanceSheetData = {
        assets: {
            current: [
                { category: "Cash & Cash Equivalents", total: 1250000 },
                { category: "Short-term Investments", total: 750000 },
                { category: "Accounts Receivable", total: 325000 },
                { category: "Prepaid Expenses", total: 125000 },
                { category: "Inventory", total: 75000 },
            ],
            nonCurrent: [
                { category: "Long-term Investments", total: 3500000 },
                { category: "Property, Plant & Equipment", total: 12500000 },
                { category: "Accumulated Depreciation", total: -375000 },
                { category: "Land", total: 2000000 },
                { category: "Intangible Assets", total: 250000 },
                { category: "Endowment Funds", total: 5000000 },
            ],
        },
        liabilities: {
            current: [
                { category: "Accounts Payable", total: 275000 },
                { category: "Accrued Expenses", total: 225000 },
                { category: "Deferred Revenue", total: 1200000 },
                { category: "Short-term Loan", total: 150000 },
                {
                    category: "Current Portion of Long-term Debt",
                    total: 300000,
                },
            ],
            nonCurrent: [
                { category: "Long-term Debt", total: 4500000 },
                { category: "Pension Liabilities", total: 1200000 },
                { category: "Other Long-term Obligations", total: 350000 },
            ],
        },
        netAssets: {
            withoutDonorRestrictions: [
                { category: "Undesignated", total: 3825000 },
                { category: "Board-designated", total: 2500000 },
            ],
            withDonorRestrictions: [
                { category: "Time-restricted", total: 1000000 },
                { category: "Purpose-restricted", total: 1500000 },
                {
                    category: "Perpetual in Nature (Endowments)",
                    total: 5000000,
                },
            ],
        },
    };

    const renderTable = (title, data, isOpen, sectionKey) => {
        const total = data.reduce((sum, item) => sum + item.total, 0);

        return (
            <div className="border rounded-lg shadow-md mb-4 bg-white">
                <div
                    className="flex justify-between items-center p-4 cursor-pointer bg-[#C7E7DE] hover:bg-[#D0E8E0] transition duration-200"
                    onClick={() => toggleSection(sectionKey)}
                >
                    <h2 className="text-xl font-bold text-[#2C323C]">
                        {title}
                    </h2>
                    {isOpen ? (
                        <FaChevronUp className="text-[#2C323C]" />
                    ) : (
                        <FaChevronDown className="text-[#2C323C]" />
                    )}
                </div>

                {isOpen && (
                    <div className="px-8 pb-4 pt-2 bg-transparent">
                        <table className="w-full border-collapse">
                            <tbody className="text-[#2C323C] divide-y divide-[#D7D8D9]">
                                {data.map((item, index) => (
                                    <tr key={index}>
                                        <td className="p-3">{item.category}</td>
                                        <td className="p-3 text-right">
                                            ${item.total.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-100 font-bold">
                                    <td className="p-3">Total {title}</td>
                                    <td className="p-3 text-right">
                                        ${total.toLocaleString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    const calculateSectionTotal = (section) => {
        return section.reduce((sum, item) => sum + item.total, 0);
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center text-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    Comprehensive Balance Sheet
                </h2>
                <div className="w-full lg:w-1/4">
                    <SelectFloating
                        label="Year"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        options={[
                            { id: 1, label: "2023" },
                            { id: 2, label: "2024" },
                            { id: 3, label: "2025" },
                        ]}
                    />
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-white rounded-2xl p-8 shadow-md">
                    <h2 className="text-2xl font-bold text-[#2C323C] border-b-2 border-[#009FDC] pb-3 mb-6">
                        Assets
                    </h2>
                    {renderTable(
                        "Current Assets",
                        balanceSheetData.assets.current,
                        openSections.currentAssets,
                        "currentAssets"
                    )}
                    {renderTable(
                        "Non-Current Assets",
                        balanceSheetData.assets.nonCurrent,
                        openSections.nonCurrentAssets,
                        "nonCurrentAssets"
                    )}
                    <div className="bg-[#DCECF2] p-4 text-lg font-bold text-[#2C323C] rounded-lg mt-4 flex justify-between text-center">
                        <h3>Total Assets:</h3>
                        <p>
                            $
                            {(
                                calculateSectionTotal(
                                    balanceSheetData.assets.current
                                ) +
                                calculateSectionTotal(
                                    balanceSheetData.assets.nonCurrent
                                )
                            ).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-md">
                    <h2 className="text-2xl font-bold text-[#2C323C] border-b-2 border-[#009FDC] pb-3 mb-6">
                        Liabilities
                    </h2>
                    {renderTable(
                        "Current Liabilities",
                        balanceSheetData.liabilities.current,
                        openSections.currentLiabilities,
                        "currentLiabilities"
                    )}
                    {renderTable(
                        "Non-Current Liabilities",
                        balanceSheetData.liabilities.nonCurrent,
                        openSections.nonCurrentLiabilities,
                        "nonCurrentLiabilities"
                    )}
                    <div className="bg-[#DCECF2] p-4 text-lg font-bold text-[#2C323C] rounded-lg mt-4 flex justify-between text-center">
                        <h3>Total Liabilities:</h3>
                        <p>
                            $
                            {(
                                calculateSectionTotal(
                                    balanceSheetData.liabilities.current
                                ) +
                                calculateSectionTotal(
                                    balanceSheetData.liabilities.nonCurrent
                                )
                            ).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-md">
                    <h2 className="text-2xl font-bold text-[#2C323C] border-b-2 border-[#009FDC] pb-3 mb-6">
                        Net Assets
                    </h2>
                    {renderTable(
                        "Without Donor Restrictions",
                        balanceSheetData.netAssets.withoutDonorRestrictions,
                        openSections.withoutDonorRestrictions,
                        "withoutDonorRestrictions"
                    )}
                    {renderTable(
                        "With Donor Restrictions",
                        balanceSheetData.netAssets.withDonorRestrictions,
                        openSections.withDonorRestrictions,
                        "withDonorRestrictions"
                    )}
                    <div className="bg-[#DCECF2] p-4 text-lg font-bold text-[#2C323C] rounded-lg mt-4 flex justify-between text-center">
                        <h3>Total Net Assets:</h3>
                        <p>
                            $
                            {(
                                calculateSectionTotal(
                                    balanceSheetData.netAssets
                                        .withoutDonorRestrictions
                                ) +
                                calculateSectionTotal(
                                    balanceSheetData.netAssets
                                        .withDonorRestrictions
                                )
                            ).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap justify-end items-center my-8">
                <Link className="flex items-center bg-[#009FDC] text-white px-6 py-3 rounded-full hover:bg-[#0077B6] transition duration-200">
                    <FontAwesomeIcon
                        icon={faFilePdf}
                        className="mr-2 text-lg"
                    />
                    Generate PDF
                </Link>
            </div>
        </div>
    );
};

export default BalanceSheetReport;
