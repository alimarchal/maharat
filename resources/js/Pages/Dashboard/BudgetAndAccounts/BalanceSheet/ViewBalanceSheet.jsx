import React, { useState, useEffect } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import SelectFloating from "@/Components/SelectFloating";
import axios from "axios";
import { toast } from "react-hot-toast";
import ViewSavedPDFs from "./ViewSavedPDFs";

const BalanceSheetReport = () => {
    const [formData, setFormData] = useState({
        year: new Date().getFullYear().toString(),
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [balanceSheetData, setBalanceSheetData] = useState({
        assets: { current: [], nonCurrent: [] },
        liabilities: { current: [], nonCurrent: [] },
        netAssets: { withoutDonorRestrictions: [], withDonorRestrictions: [] }
    });
    const [summary, setSummary] = useState({
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        balance: 0
    });
    
    const [openSections, setOpenSections] = useState({
        currentAssets: true,
        nonCurrentAssets: false,
        currentLiabilities: false,
        nonCurrentLiabilities: false,
        withoutDonorRestrictions: false,
        withDonorRestrictions: false,
    });

    useEffect(() => {
        fetchBalanceSheetData();
    }, [formData.year]);

    const fetchBalanceSheetData = async () => {
        try {
            setLoading(true);
            const [assetsRes, liabilitiesRes, equityRes, summaryRes] = await Promise.all([
                axios.get('/api/v1/balance-sheet/assets'),
                axios.get('/api/v1/balance-sheet/liabilities'),
                axios.get('/api/v1/balance-sheet/equity'),
                axios.get('/api/v1/balance-sheet/summary')
            ]);

            setBalanceSheetData({
                assets: assetsRes.data,
                liabilities: liabilitiesRes.data,
                netAssets: equityRes.data
            });
            setSummary(summaryRes.data);
        } catch (error) {
            console.error('Error fetching balance sheet data:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const renderTable = (title, data, isOpen, sectionKey) => {
        if (loading) {
            return (
                <div className="border rounded-lg shadow-md mb-4 bg-white p-4">
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-4 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        const total = data.reduce((sum, item) => {
            const amount = parseFloat(item.total) || 0;
            return sum + amount;
        }, 0);

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
                                        <td className="p-3">{item.name || item.category}</td>
                                        <td className="p-3 text-right">
                                            {parseFloat(item.total).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-100 font-bold">
                                    <td className="p-3">Total {title}</td>
                                    <td className="p-3 text-right">
                                        {total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
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
        return section.reduce((sum, item) => {
            const amount = parseFloat(item.total) || 0;
            return sum + amount;
        }, 0);
    };

    if (loading) {
        return (
            <div className="w-full p-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
                    <div className="space-y-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

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
                        <p>{summary.totalAssets.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
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
                        <p>{summary.totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
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
                        <p>{summary.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap justify-end items-center my-8">
                <button 
                    onClick={() => {
                        // Show loading UI
                        toast.loading("Generating PDF...");
                        // Generate PDF directly
                        axios.post("/api/v1/balance-sheet/generate-pdf", {
                            balanceSheetData,
                            summary,
                            year: formData.year
                        })
                        .then(response => {
                            if (response.data && response.data.pdf_url) {
                                // Dismiss loading toast
                                toast.dismiss();
                                toast.success("PDF generated successfully");
                                // Open PDF in new tab
                                window.open(response.data.pdf_url, '_blank');
                                
                                // Also save the PDF to the system
                                return axios.post("/api/v1/balance-sheet/save-pdf", {
                                    pdf_url: response.data.pdf_url,
                                    year: formData.year
                                });
                            }
                        })
                        .then(saveResponse => {
                            if (saveResponse && saveResponse.data && saveResponse.data.success) {
                                toast.success("PDF saved to system");
                            }
                        })
                        .catch(error => {
                            toast.dismiss();
                            toast.error("Failed to generate PDF");
                            console.error("Error generating PDF:", error);
                        });
                    }}
                    className="flex items-center bg-[#009FDC] text-white px-6 py-3 rounded-full hover:bg-[#0077B6] transition duration-200"
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
