import React, { useState, useEffect } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import SelectFloating from "@/Components/SelectFloating";
import axios from "axios";
import { toast } from "react-hot-toast";
import ViewSavedPDFs from "./ViewSavedPDFs";

const safe = v => typeof v === 'number' && !isNaN(v) ? v : 0;

const formatNumber = (num) => parseFloat(num || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

    const [fiscalYears, setFiscalYears] = useState([]);

    useEffect(() => {
        fetchBalanceSheetData();
        fetchFiscalYears();
    }, [formData.year]);

    const fetchBalanceSheetData = async () => {
        try {
            setLoading(true);
            const [assetsRes, liabilitiesRes, equityRes, summaryRes] = await Promise.all([
                axios.get('/api/v1/balance-sheet/assets', { params: { year: formData.year } }),
                axios.get('/api/v1/balance-sheet/liabilities', { params: { year: formData.year } }),
                axios.get('/api/v1/balance-sheet/equity', { params: { year: formData.year } }),
                axios.get('/api/v1/balance-sheet/summary', { params: { year: formData.year } })
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

    const fetchFiscalYears = async () => {
        try {
            const res = await axios.get('/api/v1/balance-sheet/fiscal-years');
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                setFiscalYears(res.data);
                if (!formData.year || !res.data.some(y => y.label === formData.year)) {
                    setFormData(f => ({ ...f, year: res.data[0].label }));
                }
            }
        } catch (err) {
            console.error('Failed to fetch fiscal years', err);
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

    const regular = balanceSheetData.netAssets.withoutDonorRestrictions[0] || {};
    const restricted = balanceSheetData.netAssets.withDonorRestrictions[0] || {};

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
                        options={fiscalYears.map(y => ({ id: y.label, label: y.label }))}
                    />
                </div>
            </div>

            <div className="space-y-8">
                {/* Assets Section */}
                <div>
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

                {/* Liabilities Section */}
                <div>
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

                {/* Equity Section (was Net Assets) */}
                <div>
                    <h2 className="text-2xl font-bold text-[#2C323C] border-b-2 border-[#009FDC] pb-3 mb-6">
                        Equity
                    </h2>
                    {/* Without Donor Restrictions (Regular Funds) */}
                    <div className="border rounded-lg shadow-md mb-4 bg-white">
                        <div
                            className="flex justify-between items-center p-4 cursor-pointer bg-[#C7E7DE] hover:bg-[#D0E8E0] transition duration-200"
                            onClick={() => toggleSection('withoutDonorRestrictions')}
                        >
                            <h2 className="text-xl font-bold text-[#2C323C]">
                                Without Donor Restrictions
                            </h2>
                            {openSections.withoutDonorRestrictions ? (
                                <FaChevronUp className="text-[#2C323C]" />
                            ) : (
                                <FaChevronDown className="text-[#2C323C]" />
                            )}
                        </div>
                        {openSections.withoutDonorRestrictions && (
                            <div className="px-8 pb-4 pt-2 bg-transparent">
                                <table className="w-full border-collapse">
                                    <tbody className="text-[#2C323C] divide-y divide-[#D7D8D9]">
                                        <tr>
                                            <td className="p-3">Regular Funds</td>
                                            <td className="p-3 text-right">{formatNumber(regular.change)}</td>
                                        </tr>
                                        <tr className="bg-gray-100 font-bold">
                                            <td className="p-3">Total Without Donor Restrictions</td>
                                            <td className="p-3 text-right">{formatNumber(regular.change)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    {/* With Donor Restrictions (Restricted Funds) */}
                    <div className="border rounded-lg shadow-md mb-4 bg-white">
                        <div
                            className="flex justify-between items-center p-4 cursor-pointer bg-[#C7E7DE] hover:bg-[#D0E8E0] transition duration-200"
                            onClick={() => toggleSection('withDonorRestrictions')}
                        >
                            <h2 className="text-xl font-bold text-[#2C323C]">
                                With Donor Restrictions
                            </h2>
                            {openSections.withDonorRestrictions ? (
                                <FaChevronUp className="text-[#2C323C]" />
                            ) : (
                                <FaChevronDown className="text-[#2C323C]" />
                            )}
                        </div>
                        {openSections.withDonorRestrictions && (
                            <div className="px-8 pb-4 pt-2 bg-transparent">
                                <table className="w-full border-collapse">
                                    <tbody className="text-[#2C323C] divide-y divide-[#D7D8D9]">
                                        <tr>
                                            <td className="p-3">Restricted Funds</td>
                                            <td className="p-3 text-right">{formatNumber(restricted.change)}</td>
                                        </tr>
                                        <tr className="bg-gray-100 font-bold">
                                            <td className="p-3">Total With Donor Restrictions</td>
                                            <td className="p-3 text-right">{formatNumber(restricted.change)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    {/* Blue Total Equity row */}
                    <div className="bg-[#DCECF2] p-4 text-lg font-bold text-[#2C323C] rounded-lg mt-4 flex justify-between text-center">
                        <h3>Total Equity:</h3>
                        <p>{formatNumber((regular.change || 0) + (restricted.change || 0))}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap justify-end items-center my-8">
                <button 
                    onClick={() => {
                        // Show loading UI
                        toast.loading("Generating PDF...");
                        // Prepare netAssets for PDF: map 'change' to 'total' and add a name
                        const pdfNetAssets = {
                            withoutDonorRestrictions: [
                                { name: 'Regular Funds', total: safe(regular.change) }
                            ],
                            withDonorRestrictions: [
                                { name: 'Restricted Funds', total: safe(restricted.change) }
                            ]
                        };
                        axios.post("/api/v1/balance-sheet/generate-pdf", {
                            balanceSheetData: {
                                ...balanceSheetData,
                                netAssets: pdfNetAssets
                            },
                            summary,
                            year: String(formData.year)
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
                                    year: String(formData.year)
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
