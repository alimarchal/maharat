import React, { useState, useEffect } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-hot-toast";
import SelectFloating from "@/Components/SelectFloating";
import ViewSavedPDFs from "./ViewSavedPDFs";
import axios from "axios";

const BalanceSheetReport = () => {
    const [formData, setFormData] = useState({
        year: new Date().getFullYear().toString(),
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [balanceSheetData, setBalanceSheetData] = useState({
        assets: { current: [], nonCurrent: [] },
        liabilities: { current: [], nonCurrent: [] },
        netAssets: { withoutDonorRestrictions: [], withDonorRestrictions: [] },
        equity: [],
    });
    const [summary, setSummary] = useState({
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        balance: 0,
    });

    const [openSections, setOpenSections] = useState({
        currentAssets: true,
        nonCurrentAssets: false,
        currentLiabilities: false,
        nonCurrentLiabilities: false,
        withoutDonorRestrictions: false,
        withDonorRestrictions: false,
        equity: false,
    });

    useEffect(() => {
        fetchBalanceSheetData();
    }, [formData.year]);

    const fetchBalanceSheetData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                "/api/v1/accounts?include=costCenter,accountCode"
            );
            const accounts = response.data.data;
            const processedData = processAccountsData(accounts);
            setBalanceSheetData(processedData.balanceSheetData);
            setSummary(processedData.summary);
        } catch (error) {
            console.error("Error fetching balance sheet data:", error);
            toast.error("Failed to fetch balance sheet data");
        } finally {
            setLoading(false);
        }
    };

    const processAccountsData = (accounts) => {
        const currentAssets = [];
        const nonCurrentAssets = [];
        const currentLiabilities = [];
        const nonCurrentLiabilities = [];
        const withoutDonorRestrictions = [];
        const withDonorRestrictions = [];
        const equityAccounts = [];

        let totalCurrentAssets = 0;
        let totalNonCurrentAssets = 0;
        let totalCurrentLiabilities = 0;
        let totalNonCurrentLiabilities = 0;
        let totalEquity = 0;

        let cashAccount = null;

        accounts.forEach((account) => {
            const accountType = account.account_code?.account_type;
            if (!accountType) return;

            const amount = parseFloat(account.credit_amount) || 0;

            const item = {
                name: account.name,
                account_number: account.account_number,
                account_type: accountType,
                total: amount,
            };

            if (accountType === "Asset") {
                if (
                    account.name.toLowerCase().includes("cash") ||
                    account.account_number === "1200"
                ) {
                    currentAssets.push(item);
                    totalCurrentAssets += amount;
                    cashAccount = { ...item };
                } else {
                    nonCurrentAssets.push(item);
                    totalNonCurrentAssets += amount;
                }
            } else if (accountType === "Liability") {
                if (
                    account.name.toLowerCase().includes("payable") ||
                    account.account_number === "2000"
                ) {
                    currentLiabilities.push(item);
                    totalCurrentLiabilities += amount;
                } else {
                    nonCurrentLiabilities.push(item);
                    totalNonCurrentLiabilities += amount;
                }
            } else if (accountType === "Equity") {
                equityAccounts.push(item);
                totalEquity += amount;
            }
        });

        if (cashAccount) {
            withoutDonorRestrictions.push(cashAccount);
        }

        withDonorRestrictions.push({
            name: "Restricted Funds",
            total: 0,
            account_number: "",
            account_type: "Equity",
        });

        const totalAssets = totalCurrentAssets + totalNonCurrentAssets;
        const totalLiabilities =
            totalCurrentLiabilities + totalNonCurrentLiabilities;

        return {
            balanceSheetData: {
                assets: {
                    current: currentAssets,
                    nonCurrent: nonCurrentAssets,
                },
                liabilities: {
                    current: currentLiabilities,
                    nonCurrent: nonCurrentLiabilities,
                },
                netAssets: {
                    withoutDonorRestrictions,
                    withDonorRestrictions,
                },
                equity: equityAccounts,
            },
            summary: {
                totalAssets,
                totalLiabilities,
                totalEquity,
                balance: totalAssets - totalLiabilities - totalEquity,
            },
        };
    };

    const toggleSection = (key) => {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: "" });
    };

    const renderTable = (title, data, isOpen, sectionKey) => {
        if (loading) {
            return (
                <div className="border rounded-lg shadow-md mb-4 bg-white p-4">
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-4 bg-gray-200 rounded"
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        const total = data.reduce(
            (sum, item) => sum + (parseFloat(item.total) || 0),
            0
        );

        return (
            <div className="border rounded-lg shadow-md mb-4 bg-white">
                <div
                    className="flex justify-between items-center p-4 cursor-pointer bg-[#C7E7DE]"
                    onClick={() => toggleSection(sectionKey)}
                >
                    <h2 className="text-xl font-bold text-[#2C323C]">
                        {title}
                    </h2>
                    {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                </div>
                {isOpen && (
                    <div className="px-8 pb-4 pt-2">
                        {data.length > 0 ? (
                            <table className="w-full border-collapse">
                                <tbody className="text-[#2C323C] divide-y divide-[#D7D8D9]">
                                    {data.map((item, index) => (
                                        <tr key={index}>
                                            <td className="p-3">
                                                <div className="font-medium">
                                                    {item.name}
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                {(
                                                    parseFloat(item.total) || 0
                                                ).toLocaleString("en-US", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100 font-bold">
                                        <td className="p-3">Total {title}</td>
                                        <td className="p-3 text-right">
                                            {total.toLocaleString("en-US", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-4 text-center text-gray-500">
                                No {title.toLowerCase()} found
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
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
                {/* Assets */}
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
                    <div className="bg-[#DCECF2] p-4 font-bold flex justify-between">
                        <h3>Total Assets:</h3>
                        <p>
                            {summary.totalAssets.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </p>
                    </div>
                </div>

                {/* Liabilities */}
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
                    <div className="bg-[#DCECF2] p-4 font-bold flex justify-between">
                        <h3>Total Liabilities:</h3>
                        <p>
                            {summary.totalLiabilities.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </p>
                    </div>
                </div>

                {/* Net Assets */}
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
                </div>

                {/* Equity */}
                <div className="bg-white rounded-2xl p-8 shadow-md">
                    <h2 className="text-2xl font-bold text-[#2C323C] border-b-2 border-[#009FDC] pb-3 mb-6">
                        Equity
                    </h2>
                    {renderTable(
                        "Equity",
                        balanceSheetData.equity || [],
                        openSections.equity,
                        "equity"
                    )}
                    <div className="bg-[#DCECF2] p-4 font-bold flex justify-between">
                        <h3>Total Equity:</h3>
                        <p>
                            {summary.totalEquity.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end my-8">
                <button
                    onClick={() => {
                        toast.loading("Generating PDF...");
                        axios
                            .post("/api/v1/balance-sheet/generate-pdf", {
                                balanceSheetData,
                                summary,
                                year: formData.year,
                            })
                            .then((res) => {
                                toast.dismiss();
                                const url = res?.data?.pdf_url;
                                if (url) {
                                    window.open(url, "_blank");
                                    toast.success("PDF generated");
                                    return axios.post(
                                        "/api/v1/balance-sheet/save-pdf",
                                        {
                                            pdf_url: url,
                                            year: formData.year,
                                        }
                                    );
                                }
                            })
                            .then((saveRes) => {
                                if (saveRes?.data?.success)
                                    toast.success("PDF saved to system");
                            })
                            .catch((err) => {
                                toast.dismiss();
                                toast.error("Failed to generate PDF");
                                console.error(err);
                            });
                    }}
                    className="flex items-center bg-[#009FDC] text-white px-6 py-3 rounded-full hover:bg-[#0077B6]"
                >
                    <FontAwesomeIcon
                        icon={faFilePdf}
                        className="mr-2 text-lg"
                    />
                    Generate PDF
                </button>
            </div>
            
            <div className="mt-8">
                <ViewSavedPDFs year={formData.year} />
            </div>
        </div>
    );
};

export default BalanceSheetReport;
