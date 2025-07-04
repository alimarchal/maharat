import React, { useEffect, useState } from "react";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons";

const IncomeStatementTable = (props) => {
    const { props: pageProps } = usePage();

    const [incomeData, setIncomeData] = useState({
        netAssets: {
            changeInNetAssets: { unrestricted: 0, restricted: 0 },
            beginningOfYear: { unrestricted: 0, restricted: 0 },
            endOfYear: { unrestricted: 0, restricted: 0 },
        },
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [dateRange, setDateRange] = useState("");
    const [revenueBreakdown, setRevenueBreakdown] = useState([]);
    const [expensesBreakdown, setExpensesBreakdown] = useState([]);
    const [vatPaidBreakdown, setVatPaidBreakdown] = useState([]);
    const [assetsBreakdown, setAssetsBreakdown] = useState([]);
    
    // Collapsible state for each table
    const [showRevenue, setShowRevenue] = useState(true);
    const [showExpenses, setShowExpenses] = useState(true);
    const [showVatPaid, setShowVatPaid] = useState(true);
    const [showAssets, setShowAssets] = useState(true);
    const [showNetAssetsSummary, setShowNetAssetsSummary] = useState(true);

    // Helper function to format numbers
    const formatNumber = (num) => {
        return parseFloat(num || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // Helper to get reference or description
    const getReferenceOrDescription = (t) => {
        if (!t.reference_number || t.reference_number === '-' || t.reference_number === 'N/A') {
            return t.description || '-';
        }
        return t.reference_number;
    };

    useEffect(() => {
        const fetchIncomeStatementData = async () => {
            setLoading(true);
            try {
                let fromDate, toDate;

                // Get date range from various sources
                if (props.from_date && props.to_date) {
                    fromDate = props.from_date;
                    toDate = props.to_date;
                } else if (props.statement?.from_date && props.statement?.to_date) {
                    fromDate = props.statement.from_date;
                    toDate = props.statement.to_date;
                } else if (pageProps.from_date && pageProps.to_date) {
                    fromDate = pageProps.from_date;
                    toDate = pageProps.to_date;
                } else if (pageProps.data?.from_date && pageProps.data?.to_date) {
                    fromDate = pageProps.data.from_date;
                    toDate = pageProps.data.to_date;
                } else {
                    const urlParams = new URL(window.location.href).searchParams;
                    fromDate = urlParams.get("from_date");
                    toDate = urlParams.get("to_date");
                }

                // Default to current month if no dates provided
                if (!fromDate || !toDate) {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    fromDate = firstDay.toISOString().split("T")[0];
                    toDate = lastDay.toISOString().split("T")[0];
                }

                if (!fromDate || !toDate) {
                    throw new Error("Date range is required");
                }

                // Format date range for display
                const fromDateObj = new Date(fromDate);
                const toDateObj = new Date(toDate);
                const formattedDateRange = `${fromDateObj.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                })} - ${toDateObj.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                })}`;
                setDateRange(formattedDateRange);

                // Fetch all required data
                const [
                    openingNetAssetsRes,
                    paidRevenueRes,
                    totalRevenueRes,
                    expensesResApi,
                    revenueRes,
                    expensesBreakdownRes,
                    vatPaidRes,
                    assetsRes
                ] = await Promise.all([
                    axios.get("/api/v1/income-statement/opening-net-assets", {
                        params: { from_date: fromDate }
                    }),
                    axios.get("/api/v1/income-statement/paid-revenue", {
                        params: { from_date: fromDate, to_date: toDate }
                    }),
                    axios.get("/api/v1/income-statement/total-revenue", {
                        params: { from_date: fromDate, to_date: toDate }
                    }),
                    axios.get("/api/v1/income-statement/expenses", {
                        params: { from_date: fromDate, to_date: toDate }
                    }),
                    axios.get("/api/v1/income-statement/revenue-breakdown", {
                        params: { from_date: fromDate, to_date: toDate }
                    }),
                    axios.get("/api/v1/income-statement/expenses-breakdown", {
                        params: { from_date: fromDate, to_date: toDate }
                    }),
                    axios.get("/api/v1/income-statement/vat-paid-breakdown", {
                        params: { from_date: fromDate, to_date: toDate }
                    }),
                    axios.get("/api/v1/income-statement/assets-breakdown", {
                        params: { from_date: fromDate, to_date: toDate }
                    }),
                ]);

                // Extract data from responses
                const openingNetAssets = parseFloat(openingNetAssetsRes.data.data.opening_net_assets) || 0;
                const paidRevenue = parseFloat(paidRevenueRes.data.data.paid_revenue) || 0;
                const totalRevenue = parseFloat(totalRevenueRes.data.data.total_revenue) || 0;
                const totalExpenses = parseFloat(expensesResApi.data.data.total_expenses) || 0;

                // Calculate net assets
                const unpaidRevenue = totalRevenue - paidRevenue;
                const changeRegular = paidRevenue - totalExpenses;
                const changeRestricted = unpaidRevenue;
                const endRegular = openingNetAssets + changeRegular;
                const endRestricted = changeRestricted;
                const endTotal = endRegular + endRestricted;

                // Set income data
                setIncomeData({
                    netAssets: {
                        changeInNetAssets: {
                            unrestricted: changeRegular,
                            restricted: changeRestricted,
                        },
                        beginningOfYear: {
                            unrestricted: openingNetAssets,
                            restricted: 0,
                        },
                        endOfYear: {
                            unrestricted: endRegular,
                            restricted: endRestricted,
                            total: endTotal,
                        },
                    },
                });

                // Set breakdown data
                setRevenueBreakdown(revenueRes.data.data || []);
                setExpensesBreakdown(expensesBreakdownRes.data.data || []);
                setVatPaidBreakdown(vatPaidRes.data.data || []);
                setAssetsBreakdown(assetsRes.data.data || []);

                setError("");
            } catch (err) {
                console.error("Error fetching income statement data:", err);
                setError(`Failed to load income statement data: ${err.message}`);
                setDateRange("Current Period");
            } finally {
                setLoading(false);
            }
        };

        fetchIncomeStatementData();
    }, [props, pageProps]);

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const netAssets = incomeData.netAssets;

    return (
        <div className="w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-[#2C323C] mb-6">
                Income Statement Details
            </h2>
            <div className="flex items-center gap-4 w-full">
                <p className="text-[#6E66AC] text-lg md:text-2xl">
                    {dateRange}
                </p>
                <div
                    className="h-[3px] flex-grow"
                    style={{
                        background: "linear-gradient(to right, #9B9DA200, #9B9DA2)",
                    }}
                ></div>
            </div>

            {error && (
                <div className="my-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Revenue Breakdown Table */}
            <div className="my-8 overflow-x-auto">
                <h3
                    className="text-xl font-semibold text-[#2C323C] mb-4 cursor-pointer select-none flex items-center"
                    onClick={() => setShowRevenue((prev) => !prev)}
                >
                    <button
                        className="text-[#009FDC] hover:text-[#0077B6] transition-colors focus:outline-none mr-2"
                        tabIndex={-1}
                        type="button"
                        style={{ background: 'none', border: 'none', padding: 0 }}
                    >
                        <FontAwesomeIcon
                            icon={showRevenue ? faChevronDown : faChevronRight}
                            className="text-lg transition-transform"
                        />
                    </button>
                    Revenue Summary
                </h3>
                {showRevenue && (
                <table className="w-full table-fixed border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium">
                        <tr>
                            <th className="py-3 pl-10 w-1/4 rounded-tl-2xl rounded-bl-2xl text-center">Reference</th>
                            <th className="py-3 w-1/2 text-center">Account Name</th>
                            <th className="py-3 pr-16 w-1/4 rounded-tr-2xl rounded-br-2xl text-center">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                        {revenueBreakdown.length > 0 ? revenueBreakdown.map((t, i) => (
                            <tr key={i}>
                                <td className="py-3 pl-10 w-1/4 text-center align-middle">{getReferenceOrDescription(t)}</td>
                                <td className="py-3 w-1/2 text-center align-middle">{t.account_name}</td>
                                <td className="py-3 pr-16 w-1/4 text-center align-middle">{formatNumber(t.amount)}</td>
                            </tr>
                        )) : <tr><td colSpan="3" className="text-center py-4">No revenue transactions found</td></tr>}
                        <tr className="font-bold text-xl bg-[#DCECF2] border-none">
                            <td className="py-3 pl-10 w-1/4 rounded-tl-2xl rounded-bl-2xl text-center">Sub Total</td>
                            <td className="w-1/2"></td>
                            <td className="py-3 pr-16 w-1/4 rounded-tr-2xl rounded-br-2xl text-center">{formatNumber(revenueBreakdown.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0))}</td>
                        </tr>
                    </tbody>
                </table>
                )}
            </div>

            {/* Expenses Breakdown Table */}
            <div className="my-8 overflow-x-auto">
                <h3
                    className="text-xl font-semibold text-[#2C323C] mb-4 cursor-pointer select-none flex items-center"
                    onClick={() => setShowExpenses((prev) => !prev)}
                >
                    <button
                        className="text-[#009FDC] hover:text-[#0077B6] transition-colors focus:outline-none mr-2"
                        tabIndex={-1}
                        type="button"
                        style={{ background: 'none', border: 'none', padding: 0 }}
                    >
                        <FontAwesomeIcon
                            icon={showExpenses ? faChevronDown : faChevronRight}
                            className="text-lg transition-transform"
                        />
                    </button>
                    Expenses Summary
                </h3>
                {showExpenses && (
                <table className="w-full table-fixed border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium">
                        <tr>
                            <th className="py-3 pl-10 w-1/4 rounded-tl-2xl rounded-bl-2xl text-center">Reference</th>
                            <th className="py-3 w-1/2 text-center">Account Name</th>
                            <th className="py-3 pr-16 w-1/4 rounded-tr-2xl rounded-br-2xl text-center">Total Amount</th>
                                </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                        {expensesBreakdown.length > 0 ? expensesBreakdown.map((t, i) => (
                            <tr key={i}>
                                <td className="py-3 pl-10 w-1/4 text-center align-middle">{getReferenceOrDescription(t)}</td>
                                <td className="py-3 w-1/2 text-center align-middle">{t.account_name}</td>
                                <td className="py-3 pr-16 w-1/4 text-center align-middle">{formatNumber(t.amount)}</td>
                            </tr>
                        )) : <tr><td colSpan="3" className="text-center py-4">No expense transactions found</td></tr>}
                        <tr className="font-bold text-xl bg-[#DCECF2] border-none">
                            <td className="py-3 pl-10 w-1/4 rounded-tl-2xl rounded-bl-2xl text-center">Sub Total</td>
                            <td className="w-1/2"></td>
                            <td className="py-3 pr-16 w-1/4 rounded-tr-2xl rounded-br-2xl text-center">{formatNumber(expensesBreakdown.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0))}</td>
                        </tr>
                    </tbody>
                </table>
                )}
            </div>

            {/* Assets Breakdown Table */}
            <div className="my-8 overflow-x-auto">
                <h3
                    className="text-xl font-semibold text-[#2C323C] mb-4 cursor-pointer select-none flex items-center"
                    onClick={() => setShowAssets((prev) => !prev)}
                >
                    <button
                        className="text-[#009FDC] hover:text-[#0077B6] transition-colors focus:outline-none mr-2"
                        tabIndex={-1}
                        type="button"
                        style={{ background: 'none', border: 'none', padding: 0 }}
                    >
                        <FontAwesomeIcon
                            icon={showAssets ? faChevronDown : faChevronRight}
                            className="text-lg transition-transform"
                        />
                    </button>
                    Assets Summary
                </h3>
                {showAssets && (
                <table className="w-full table-fixed border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium">
                        <tr>
                            <th className="py-3 pl-10 w-1/4 rounded-tl-2xl rounded-bl-2xl text-center">Reference</th>
                            <th className="py-3 w-1/2 text-center">Account Name</th>
                            <th className="py-3 pr-16 w-1/4 rounded-tr-2xl rounded-br-2xl text-center">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                        {assetsBreakdown.length > 0 ? assetsBreakdown.map((t, i) => (
                            <tr key={i}>
                                <td className="py-3 pl-10 w-1/4 text-center align-middle">{getReferenceOrDescription(t)}</td>
                                <td className="py-3 w-1/2 text-center align-middle">{t.account_name}</td>
                                <td className="py-3 pr-16 w-1/4 text-center align-middle">{formatNumber(t.amount)}</td>
                            </tr>
                        )) : <tr><td colSpan="3" className="text-center py-4">No asset transactions found</td></tr>}
                        <tr className="font-bold text-xl bg-[#DCECF2] border-none">
                            <td className="py-3 pl-10 w-1/4 rounded-tl-2xl rounded-bl-2xl text-center">Sub Total</td>
                            <td className="w-1/2"></td>
                            <td className="py-3 pr-16 w-1/4 rounded-tr-2xl rounded-br-2xl text-center">{formatNumber(assetsBreakdown.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0))}</td>
                        </tr>
                    </tbody>
                </table>
                )}
            </div>

            {/* VAT Paid Summary Table */}
            <div className="my-8 overflow-x-auto">
                <h3
                    className="text-xl font-semibold text-[#2C323C] mb-4 cursor-pointer select-none flex items-center"
                    onClick={() => setShowVatPaid((prev) => !prev)}
                >
                    <button
                        className="text-[#009FDC] hover:text-[#0077B6] transition-colors focus:outline-none mr-2"
                        tabIndex={-1}
                        type="button"
                        style={{ background: 'none', border: 'none', padding: 0 }}
                    >
                        <FontAwesomeIcon
                            icon={showVatPaid ? faChevronDown : faChevronRight}
                            className="text-lg transition-transform"
                        />
                    </button>
                    VAT Paid Summary
                </h3>
                {showVatPaid && (
                <table className="w-full table-fixed border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium">
                        <tr>
                            <th className="py-3 pl-10 w-1/4 rounded-tl-2xl rounded-bl-2xl text-center">Reference</th>
                            <th className="py-3 w-1/2 text-center">Account Name</th>
                            <th className="py-3 pr-16 w-1/4 rounded-tr-2xl rounded-br-2xl text-center">Total Amount</th>
                                </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                        {vatPaidBreakdown.length > 0 ? vatPaidBreakdown.map((t, i) => (
                            <tr key={i}>
                                <td className="py-3 pl-10 w-1/4 text-center align-middle">{getReferenceOrDescription(t)}</td>
                                <td className="py-3 w-1/2 text-center align-middle">{t.account_name}</td>
                                <td className="py-3 pr-16 w-1/4 text-center align-middle">{formatNumber(t.amount)}</td>
                            </tr>
                        )) : <tr><td colSpan="3" className="text-center py-4">No VAT paid transactions found</td></tr>}
                        <tr className="font-bold text-xl bg-[#DCECF2] border-none">
                            <td className="py-3 pl-10 w-1/4 rounded-tl-2xl rounded-bl-2xl text-center">Sub Total</td>
                            <td className="w-1/2"></td>
                            <td className="py-3 pr-16 w-1/4 rounded-tr-2xl rounded-br-2xl text-center">{formatNumber(vatPaidBreakdown.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0))}</td>
                        </tr>
                    </tbody>
                </table>
                )}
            </div>

            {/* Net Assets Summary Table */}
            <div className="my-8 overflow-x-auto">
                <h3
                    className="text-xl font-semibold text-[#2C323C] mb-4 cursor-pointer select-none flex items-center"
                    onClick={() => setShowNetAssetsSummary((prev) => !prev)}
                >
                    <button
                        className="text-[#009FDC] hover:text-[#0077B6] transition-colors focus:outline-none mr-2"
                        tabIndex={-1}
                        type="button"
                        style={{ background: 'none', border: 'none', padding: 0 }}
                    >
                        <FontAwesomeIcon
                            icon={showNetAssetsSummary ? faChevronDown : faChevronRight}
                            className="text-lg transition-transform"
                        />
                    </button>
                    Net Assets Summary
                </h3>
                {showNetAssetsSummary && (
                    <>
                <table className="w-full border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium">
                        <tr>
                                    <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl w-[30%] text-center">
                                Net Assets Summary
                            </th>
                            <th className="py-3 px-4 w-[20%]">Regular Funds</th>
                                    <th className="py-3 px-4 w-[20%]">Restricted Funds</th>
                                    <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl w-[30%]">Total</th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                        <tr className="border-none">
                                    <td className="py-3 px-4 text-center align-middle">
                                Change in Net Assets
                            </td>
                            <td className="py-3 px-4 text-center">
                                        {formatNumber(netAssets.changeInNetAssets.unrestricted)}
                            </td>
                            <td className="py-3 px-4 text-center">
                                        {formatNumber(netAssets.changeInNetAssets.restricted)}
                            </td>
                            <td className="py-3 px-4 text-center">
                                {formatNumber(
                                    netAssets.changeInNetAssets.unrestricted +
                                        netAssets.changeInNetAssets.restricted
                                )}
                            </td>
                        </tr>
                        <tr>
                                    <td className="py-3 px-4 text-center align-middle">
                                Net Assets, Beginning of Year
                            </td>
                            <td className="py-3 px-4 text-center">
                                        {formatNumber(netAssets.beginningOfYear.unrestricted)}
                            </td>
                            <td className="py-3 px-4 text-center">
                                        {formatNumber(netAssets.beginningOfYear.restricted)}
                            </td>
                            <td className="py-3 px-4 text-center">
                                {formatNumber(
                                    netAssets.beginningOfYear.unrestricted +
                                        netAssets.beginningOfYear.restricted
                                )}
                            </td>
                        </tr>
                        <tr className="font-bold text-xl bg-[#DCECF2] border-none">
                                    <td className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center align-middle">
                                Net Assets, End of Period
                            </td>
                            <td className="py-3 px-4 text-center">
                                {formatNumber(netAssets.endOfYear.unrestricted)}
                            </td>
                            <td className="py-3 px-4 text-center">
                                {formatNumber(netAssets.endOfYear.restricted)}
                            </td>
                            <td className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                                {netAssets.endOfYear.total !== undefined
                                    ? formatNumber(netAssets.endOfYear.total)
                                    : formatNumber(
                                          netAssets.endOfYear.unrestricted +
                                              netAssets.endOfYear.restricted
                                      )}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="mt-3 text-sm text-gray-600">
                            <p><strong>Note:</strong></p>
                            <ul className="list-disc ml-6">
                                <li><strong>Regular Funds</strong> reflects <em>paid revenue (sum of debit for Account Receivable minus expenses)</em>.</li>
                                <li><strong>Restricted Funds</strong> reflect <em>unpaid revenue (sum of credit for Revenue/Income minus paid revenue)</em>.</li>
                            </ul>
                </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default IncomeStatementTable;
