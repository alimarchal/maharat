import React, { useEffect, useState } from "react";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons";

const IncomeStatementTable = (props) => {
    const { props: pageProps } = usePage();

    const [incomeData, setIncomeData] = useState({
        revenues: [],
        expenses: [],
        netAssets: {
            changeInNetAssets: { unrestricted: 0, restricted: 0 },
            beginningOfYear: { unrestricted: 0, restricted: 0 },
            endOfYear: { unrestricted: 0, restricted: 0 },
        },
        invoiceItems: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [dateRange, setDateRange] = useState("");
    const [expenseTransactions, setExpenseTransactions] = useState([]);
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

                // First check direct props
                if (props.from_date && props.to_date) {
                    fromDate = props.from_date;
                    toDate = props.to_date;
                }
                // Then check if passed as statement object
                else if (
                    props.statement &&
                    props.statement.from_date &&
                    props.statement.to_date
                ) {
                    fromDate = props.statement.from_date;
                    toDate = props.statement.to_date;
                }
                // Then check Inertia page props
                else if (pageProps.from_date && pageProps.to_date) {
                    fromDate = pageProps.from_date;
                    toDate = pageProps.to_date;
                }
                // Then check for data property in Inertia
                else if (
                    pageProps.data &&
                    pageProps.data.from_date &&
                    pageProps.data.to_date
                ) {
                    fromDate = pageProps.data.from_date;
                    toDate = pageProps.data.to_date;
                }
                // Last resort, check URL parameters
                else {
                    const urlParams = new URL(window.location.href)
                        .searchParams;
                    fromDate = urlParams.get("from_date");
                    toDate = urlParams.get("to_date");
                }

                if (!fromDate || !toDate) {
                    // If still no dates, try to use default month range (current month)
                    const today = new Date();
                    const firstDay = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        1
                    );
                    const lastDay = new Date(
                        today.getFullYear(),
                        today.getMonth() + 1,
                        0
                    );

                    fromDate = firstDay.toISOString().split("T")[0];
                    toDate = lastDay.toISOString().split("T")[0];
                }

                if (!fromDate || !toDate) {
                    throw new Error("Date range is required");
                }

                // Format date range for display
                const fromDateObj = new Date(fromDate);
                const toDateObj = new Date(toDate);
                const formattedDateRange = `${fromDateObj.toLocaleDateString(
                    "en-US",
                    {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                    }
                )} - ${toDateObj.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                })}`;
                setDateRange(formattedDateRange);

                // Fetch opening net assets as of the day before fromDate
                const openingNetAssetsRes = await axios.get("/api/v1/income-statement/opening-net-assets", {
                    params: { from_date: fromDate }
                });
                const openingNetAssets = parseFloat(openingNetAssetsRes.data.data.opening_net_assets) || 0;

                // Fetch paid revenue, total revenue, and expenses
                const [
                    paidRevenueRes,
                    totalRevenueRes,
                    expensesResApi
                ] = await Promise.all([
                    axios.get("/api/v1/income-statement/paid-revenue", {
                        params: { from_date: fromDate, to_date: toDate }
                    }),
                    axios.get("/api/v1/income-statement/total-revenue", {
                        params: { from_date: fromDate, to_date: toDate }
                    }),
                    axios.get("/api/v1/income-statement/expenses", {
                        params: { from_date: fromDate, to_date: toDate }
                    })
                ]);
                const paidRevenue = parseFloat(paidRevenueRes.data.data.paid_revenue) || 0;
                const totalRevenue = parseFloat(totalRevenueRes.data.data.total_revenue) || 0;
                const totalExpenses = parseFloat(expensesResApi.data.data.total_expenses) || 0;

                // Calculate unpaid revenue and changes
                const unpaidRevenue = totalRevenue - paidRevenue;
                const changeRegular = paidRevenue - totalExpenses;
                const changeRestricted = unpaidRevenue;
                const endRegular = openingNetAssets + changeRegular;
                const endRestricted = changeRestricted; // Opening is 0
                const endTotal = endRegular + endRestricted;

                // Set the income data state
                setIncomeData((prev) => ({
                    ...prev,
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
                }));

                // Fetch expense transactions from cash_flow_transactions table
                try {
                    const expenseTransactionsResponse = await axios.get(
                        "/api/v1/expense-transactions",
                        {
                            params: {
                                from_date: fromDate,
                                to_date: toDate,
                            },
                        }
                    );

                    if (
                        expenseTransactionsResponse.data &&
                        expenseTransactionsResponse.data.data
                    ) {
                        setExpenseTransactions(
                            expenseTransactionsResponse.data.data
                        );
                    } else {
                        // If no data or API doesn't exist yet, set empty array
                        setExpenseTransactions([]);
                    }
                } catch (expenseError) {
                    console.error(
                        "Error fetching expense transactions:",
                        expenseError
                    );

                    // If API endpoint doesn't exist yet or returns an error, we'll use fallback/mock data
                    setExpenseTransactions([
                        {
                            id: 1,
                            chart_of_account: {
                                account_name: "Salaries and Wages",
                                description: "Staff salaries and wages",
                            },
                            amount: 5000.0,
                            balance_amount: 5000.0,
                            transaction_date: "2025-03-15",
                        },
                        {
                            id: 2,
                            chart_of_account: {
                                account_name: "Rent",
                                description: "Office space rental",
                            },
                            amount: 2000.0,
                            balance_amount: 7000.0,
                            transaction_date: "2025-03-20",
                        },
                        {
                            id: 3,
                            chart_of_account: {
                                account_name: "Utilities",
                                description: "Electricity, water, internet",
                            },
                            amount: 750.0,
                            balance_amount: 7750.0,
                            transaction_date: "2025-03-25",
                        },
                        {
                            id: 4,
                            chart_of_account: {
                                account_name: "Office Supplies",
                                description: "Stationery and consumables",
                            },
                            amount: 350.0,
                            balance_amount: 8100.0,
                            transaction_date: "2025-03-28",
                        },
                    ]);
                }

                // Process invoice items to extract relevant data
                let invoiceItems = [];
                let revenuesByCategory = {
                    "Individual Donations": { unrestricted: 0, restricted: 0 },
                    Grants: { unrestricted: 0, restricted: 0 },
                    "Investment Income": { unrestricted: 0, restricted: 0 },
                    Other: { unrestricted: 0, restricted: 0 },
                };

                // Calculate change in net assets for summary
                const changeInNetAssets = {
                    unrestricted: changeRegular,
                    restricted: changeRestricted,
                };

                // Net assets at beginning of year (period)
                const beginningOfYear = {
                    unrestricted: openingNetAssets,
                    restricted: 0,
                };

                // Calculate end of year to exactly match the Final Net Assets in the main table
                const endOfYear = {
                    unrestricted: endRegular,
                    restricted: endRestricted,
                    total: endTotal,
                };

                // Still process invoice items for detailed breakdown
                if (invoiceItems && invoiceItems.length > 0) {
                    const invoices = invoiceItems;

                    // Process each invoice to extract items
                    invoices.forEach((invoice) => {
                        // Check if invoice falls within date range
                        const invoiceDate = new Date(invoice.issue_date);
                        if (
                            invoiceDate >= fromDateObj &&
                            invoiceDate <= toDateObj
                        ) {
                            // Determine if invoice is restricted or unrestricted
                            // Consider 'Paid' status as unrestricted, other statuses as restricted
                            const isUnrestricted = invoice.status === "Paid";
                            const fundType = isUnrestricted
                                ? "Regular"
                                : "Restricted";

                            // Process invoice items
                            if (invoice.items && invoice.items.length > 0) {
                                invoice.items.forEach((item) => {
                                    // Add item to the flat list for display
                                    invoiceItems.push({
                                        id: item.id,
                                        name: item.name || "Unnamed Item",
                                        subtotal: parseFloat(
                                            item.subtotal || 0
                                        ),
                                        tax_amount: parseFloat(
                                            item.tax_amount || 0
                                        ),
                                        total: parseFloat(item.total || 0),
                                        restricted: !isUnrestricted,
                                        fundType: fundType,
                                        invoiceStatus: invoice.status,
                                    });

                                    // Categorize for revenue calculation
                                    let category = "Other";
                                    if (item.name) {
                                        const itemName =
                                            item.name.toLowerCase();
                                        if (
                                            itemName.includes("donation") ||
                                            itemName.includes("donate")
                                        ) {
                                            category = "Individual Donations";
                                        } else if (itemName.includes("grant")) {
                                            category = "Grants";
                                        } else if (
                                            itemName.includes("investment") ||
                                            itemName.includes("interest")
                                        ) {
                                            category = "Investment Income";
                                        }
                                    }

                                    // Add to the appropriate category
                                    if (isUnrestricted) {
                                        revenuesByCategory[
                                            category
                                        ].unrestricted += parseFloat(
                                            item.total || 0
                                        );
                                    } else {
                                        revenuesByCategory[
                                            category
                                        ].restricted += parseFloat(
                                            item.total || 0
                                        );
                                    }
                                });
                            }
                        }
                    });
                }

                // For backwards compatibility, calculate these sums even though we'll use official numbers
                let unrestrictedRevenueTotal = 0;
                let restrictedRevenueTotal = 0;

                Object.values(revenuesByCategory).forEach((value) => {
                    unrestrictedRevenueTotal += value.unrestricted;
                    restrictedRevenueTotal += value.restricted;
                });

                // Calculate total revenue from invoice items directly
                const detailedTotalRevenue = invoiceItems.reduce(
                    (sum, item) => sum + parseFloat(item.total || 0),
                    0
                );

                // Convert to array format for rendering
                const revenuesArray = Object.entries(revenuesByCategory).map(
                    ([category, values]) => ({
                        category,
                        unrestricted: values.unrestricted,
                        restricted: values.restricted,
                    })
                );

                // For expenses, use the data from expense transactions
                // Calculate totals from the transactions
                let detailedTotalExpenses = 0;

                if (expenseTransactions && expenseTransactions.length > 0) {
                    detailedTotalExpenses = expenseTransactions.reduce(
                        (sum, transaction) => {
                            return sum + parseFloat(transaction.amount || 0);
                        },
                        0
                    );
                }

                // Use the official totals, not the detailed ones for consistency
                // (Removed redeclaration of totalRevenue and totalExpenses to fix linter errors)

                // Set the income data state using the official numbers
                setIncomeData({
                    revenues: revenuesArray,
                    expenses: [], // No need for expense categories since we use transactions
                    netAssets: {
                        changeInNetAssets,
                        beginningOfYear,
                        endOfYear,
                    },
                    totals: {
                        revenue: {
                            unrestricted: 0, // All revenue is considered restricted per our visual approach
                            restricted: totalRevenue,
                            total: totalRevenue,
                        },
                        expenses: {
                            unrestricted: totalExpenses, // All expenses are from unrestricted funds
                            restricted: 0,
                            total: totalExpenses,
                        },
                    },
                    invoiceItems: invoiceItems,
                });

                // Fetch breakdowns
                const [
                    revenueRes,
                    expensesBreakdownRes,
                    vatPaidRes,
                    assetsRes
                ] = await Promise.all([
                    axios.get("/api/v1/income-statement/revenue-breakdown", { params: { from_date: fromDate, to_date: toDate } }),
                    axios.get("/api/v1/income-statement/expenses-breakdown", { params: { from_date: fromDate, to_date: toDate } }),
                    axios.get("/api/v1/income-statement/vat-paid-breakdown", { params: { from_date: fromDate, to_date: toDate } }),
                    axios.get("/api/v1/income-statement/assets-breakdown", { params: { from_date: fromDate, to_date: toDate } }),
                ]);
                setRevenueBreakdown(revenueRes.data.data || []);
                setExpensesBreakdown(expensesBreakdownRes.data.data || []);
                setVatPaidBreakdown(vatPaidRes.data.data || []);
                setAssetsBreakdown(assetsRes.data.data || []);

                setError("");
            } catch (err) {
                console.error("Error fetching income statement data:", err);
                setError(
                    `Failed to load income statement data: ${err.message}`
                );

                // Calculate fallback values for net assets that will be somewhat consistent
                // with IncomeStatementTable.jsx even without API access
                let fallbackRevenue = 0;
                let fallbackExpenses = 0;
                let fallbackPrevious = 4300; // Default value if we can't get previous transactions

                // Try to get totals from UI components if possible
                if (invoiceItems && invoiceItems.length > 0) {
                    fallbackRevenue = invoiceItems.reduce(
                        (sum, item) => sum + parseFloat(item.total || 0),
                        0
                    );
                }

                if (expenseTransactions && expenseTransactions.length > 0) {
                    fallbackExpenses = expenseTransactions.reduce(
                        (sum, transaction) =>
                            sum + parseFloat(transaction.amount || 0),
                        0
                    );
                }

                // Calculate changes using the same logic as IncomeStatementTable.jsx
                const fallbackChange = fallbackExpenses - fallbackRevenue;
                const fallbackFinalNet = fallbackChange + fallbackPrevious;

                // Set default values for all metrics
                setIncomeData({
                    revenues: [
                        {
                            category: "Individual Donations",
                            unrestricted: 0,
                            restricted: 0,
                        },
                        { category: "Grants", unrestricted: 0, restricted: 0 },
                        {
                            category: "Investment Income",
                            unrestricted: 0,
                            restricted: 0,
                        },
                        {
                            category: "Other",
                            unrestricted: 0,
                            restricted: fallbackRevenue,
                        },
                    ],
                    expenses: [],
                    netAssets: {
                        changeInNetAssets: {
                            unrestricted: -fallbackChange,
                            restricted: fallbackRevenue,
                        },
                        beginningOfYear: {
                            unrestricted: fallbackPrevious,
                            restricted: 0,
                        },
                        endOfYear: {
                            unrestricted: fallbackPrevious - fallbackChange,
                            restricted: fallbackRevenue,
                            total: fallbackFinalNet,
                        },
                    },
                    totals: {
                        revenue: {
                            unrestricted: 0,
                            restricted: fallbackRevenue,
                            total: fallbackRevenue,
                        },
                        expenses: {
                            unrestricted: fallbackExpenses,
                            restricted: 0,
                            total: fallbackExpenses,
                        },
                    },
                    invoiceItems: invoiceItems || [
                        {
                            id: 1,
                            name: "Sample Item 1",
                            subtotal: 5000,
                            tax_amount: 250,
                            total: 5250,
                            restricted: true,
                        },
                        {
                            id: 2,
                            name: "Sample Item 2",
                            subtotal: 6000,
                            tax_amount: 300,
                            total: 6300,
                            restricted: true,
                        },
                        {
                            id: 3,
                            name: "Sample Item 3",
                            subtotal: 25000,
                            tax_amount: 1250,
                            total: 26250,
                            restricted: true,
                        },
                        {
                            id: 4,
                            name: "Sample Item 4",
                            subtotal: 2356,
                            tax_amount: 115,
                            total: 2471,
                            restricted: true,
                        },
                    ],
                });

                // Fallback expense transaction data
                setExpenseTransactions([
                    {
                        id: 1,
                        chart_of_account: {
                            account_name: "Salaries and Wages",
                            description: "Staff salaries and wages",
                        },
                        amount: 5000.0,
                        balance_amount: 5000.0,
                        transaction_date: "2025-03-15",
                    },
                    {
                        id: 2,
                        chart_of_account: {
                            account_name: "Rent",
                            description: "Office space rental",
                        },
                        amount: 2000.0,
                        balance_amount: 7000.0,
                        transaction_date: "2025-03-20",
                    },
                    {
                        id: 3,
                        chart_of_account: {
                            account_name: "Utilities",
                            description: "Electricity, water, internet",
                        },
                        amount: 750.0,
                        balance_amount: 7750.0,
                        transaction_date: "2025-03-25",
                    },
                    {
                        id: 4,
                        chart_of_account: {
                            account_name: "Office Supplies",
                            description: "Stationery and consumables",
                        },
                        amount: 350.0,
                        balance_amount: 8100.0,
                        transaction_date: "2025-03-28",
                    },
                ]);

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

    // Use the calculated totals
    const revenueTotals = incomeData.totals?.revenue || {
        unrestricted: 0,
        restricted: 0,
        total: 0,
    };

    const expenseTotals = incomeData.totals?.expenses || {
        unrestricted: 0,
        restricted: 0,
        total: 0,
    };

    const netAssets = incomeData.netAssets;
    const invoiceItems = incomeData.invoiceItems || [];

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
                        background:
                            "linear-gradient(to right, #9B9DA200, #9B9DA2)",
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
                                <li><strong>Regular Funds</strong> reflects <em>paid revenue (sum of debit for Account Receivable  minus expenses)</em>.</li>
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
