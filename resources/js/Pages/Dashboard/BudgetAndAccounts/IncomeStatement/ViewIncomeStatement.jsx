import React, { useEffect, useState } from "react";
import axios from "axios";
import { usePage } from "@inertiajs/react";

const IncomeStatementTable = (props) => {
    // Get the page props from Inertia
    const { props: pageProps } = usePage();
    
    // Log props to debug what's being received
    console.log("Component props:", props);
    console.log("Page props:", pageProps);
    
    const [incomeData, setIncomeData] = useState({
        revenues: [],
        expenses: [],
        netAssets: {
            changeInNetAssets: { unrestricted: 0, restricted: 0 },
            beginningOfYear: { unrestricted: 0, restricted: 0 },
            endOfYear: { unrestricted: 0, restricted: 0 },
        },
        invoiceItems: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [dateRange, setDateRange] = useState("");

    // Helper function to format numbers
    const formatNumber = (num) => {
        return parseFloat(num || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    useEffect(() => {
        const fetchIncomeStatementData = async () => {
            setLoading(true);
            try {
                // Get from_date and to_date from various possible sources
                let fromDate, toDate;
                
                // First check direct props
                if (props.from_date && props.to_date) {
                    fromDate = props.from_date;
                    toDate = props.to_date;
                } 
                // Then check if passed as statement object
                else if (props.statement && props.statement.from_date && props.statement.to_date) {
                    fromDate = props.statement.from_date;
                    toDate = props.statement.to_date;
                }
                // Then check Inertia page props
                else if (pageProps.from_date && pageProps.to_date) {
                    fromDate = pageProps.from_date;
                    toDate = pageProps.to_date;
                }
                // Then check for data property in Inertia
                else if (pageProps.data && pageProps.data.from_date && pageProps.data.to_date) {
                    fromDate = pageProps.data.from_date;
                    toDate = pageProps.data.to_date;
                }
                // Last resort, check URL parameters
                else {
                    const urlParams = new URL(window.location.href).searchParams;
                    fromDate = urlParams.get('from_date');
                    toDate = urlParams.get('to_date');
                }
                
                console.log("Date range found:", { fromDate, toDate });
                
                if (!fromDate || !toDate) {
                    // If still no dates, try to use default month range (current month)
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    
                    fromDate = firstDay.toISOString().split('T')[0];
                    toDate = lastDay.toISOString().split('T')[0];
                    
                    console.log("Using default date range:", { fromDate, toDate });
                }
                
                if (!fromDate || !toDate) {
                    throw new Error('Date range is required');
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
                
                // Fetch invoices with items for the date range
                const invoicesResponse = await axios.get("/api/v1/invoices", {
                    params: {
                        from_date: fromDate,
                        to_date: toDate,
                        include: 'items'
                    }
                });
                console.log('Invoices API response:', invoicesResponse.data);
                
                // Process invoice items to extract relevant data
                let invoiceItems = [];
                let revenuesByCategory = {
                    "Individual Donations": { unrestricted: 0, restricted: 0 },
                    "Grants": { unrestricted: 0, restricted: 0 },
                    "Investment Income": { unrestricted: 0, restricted: 0 },
                    "Other": { unrestricted: 0, restricted: 0 }
                };
                
                if (invoicesResponse.data && invoicesResponse.data.data) {
                    const invoices = invoicesResponse.data.data;
                    
                    // Process each invoice to extract items
                    invoices.forEach(invoice => {
                        // Check if invoice falls within date range
                        const invoiceDate = new Date(invoice.issue_date);
                        if (invoiceDate >= fromDateObj && invoiceDate <= toDateObj) {
                            
                            // Determine if invoice is restricted or unrestricted
                            // For example, we'll consider "paid" invoices as unrestricted
                            const isUnrestricted = invoice.status?.toLowerCase() === 'paid';
                            
                            // Process invoice items
                            if (invoice.items && invoice.items.length > 0) {
                                invoice.items.forEach(item => {
                                    // Add item to the flat list for display
                                    invoiceItems.push({
                                        id: item.id,
                                        name: item.name || 'Unnamed Item',
                                        subtotal: parseFloat(item.subtotal || 0),
                                        tax_amount: parseFloat(item.tax_amount || 0),
                                        total: parseFloat(item.total || 0),
                                        restricted: !isUnrestricted
                                    });
                                    
                                    // Categorize for revenue calculation
                                    let category = "Other";
                                    if (item.name) {
                                        const itemName = item.name.toLowerCase();
                                        if (itemName.includes('donation') || itemName.includes('donate')) {
                                            category = "Individual Donations";
                                        } else if (itemName.includes('grant')) {
                                            category = "Grants";
                                        } else if (itemName.includes('investment') || itemName.includes('interest')) {
                                            category = "Investment Income";
                                        }
                                    }
                                    
                                    // Add to the appropriate category
                                    if (isUnrestricted) {
                                        revenuesByCategory[category].unrestricted += parseFloat(item.total || 0);
                                    } else {
                                        revenuesByCategory[category].restricted += parseFloat(item.total || 0);
                                    }
                                });
                            }
                        }
                    });
                }
                
                // Calculate revenue totals
                let unrestrictedRevenueTotal = 0;
                let restrictedRevenueTotal = 0;
                
                Object.values(revenuesByCategory).forEach(value => {
                    unrestrictedRevenueTotal += value.unrestricted;
                    restrictedRevenueTotal += value.restricted;
                });
                
                const totalRevenue = unrestrictedRevenueTotal + restrictedRevenueTotal;
                
                // Convert to array format for rendering
                const revenuesArray = Object.entries(revenuesByCategory).map(([category, values]) => ({
                    category,
                    unrestricted: values.unrestricted,
                    restricted: values.restricted
                }));
                
                // For expenses, we'll use default allocation based on revenue
                const unrestrictedExpensesTotal = unrestrictedRevenueTotal * 0.7; // 70% of revenue
                const restrictedExpensesTotal = 0; // Assuming all expenses are unrestricted
                const totalExpenses = unrestrictedExpensesTotal + restrictedExpensesTotal;
                
                // Map expenses to categories (using default allocation)
                const expensesArray = [
                    { 
                        category: "Program Services", 
                        unrestricted: unrestrictedExpensesTotal * 0.7, 
                        restricted: 0 
                    },
                    { 
                        category: "General and Administrative", 
                        unrestricted: unrestrictedExpensesTotal * 0.2, 
                        restricted: 0 
                    },
                    { 
                        category: "Fundraising", 
                        unrestricted: unrestrictedExpensesTotal * 0.1, 
                        restricted: 0 
                    }
                ];
                
                // Calculate net assets
                const previousNetAssets = 4300; // Default value, replace with actual previous net assets if available
                
                const changeInNetAssets = {
                    unrestricted: unrestrictedRevenueTotal - unrestrictedExpensesTotal,
                    restricted: restrictedRevenueTotal - restrictedExpensesTotal
                };
                
                const beginningOfYear = { 
                    unrestricted: previousNetAssets,
                    restricted: 0
                };
                
                const endOfYear = {
                    unrestricted: beginningOfYear.unrestricted + changeInNetAssets.unrestricted,
                    restricted: beginningOfYear.restricted + changeInNetAssets.restricted
                };
                
                // Set the income data state
                setIncomeData({
                    revenues: revenuesArray,
                    expenses: expensesArray,
                    netAssets: {
                        changeInNetAssets,
                        beginningOfYear,
                        endOfYear
                    },
                    totals: {
                        revenue: {
                            unrestricted: unrestrictedRevenueTotal,
                            restricted: restrictedRevenueTotal,
                            total: totalRevenue
                        },
                        expenses: {
                            unrestricted: unrestrictedExpensesTotal,
                            restricted: restrictedExpensesTotal,
                            total: totalExpenses
                        }
                    },
                    invoiceItems: invoiceItems
                });
                
                setError("");
            } catch (err) {
                console.error("Error fetching income statement data:", err);
                setError(`Failed to load income statement data: ${err.message}`);
                
                // Fallback data
                setIncomeData({
                    revenues: [
                        { category: "Individual Donations", unrestricted: 0, restricted: 0 },
                        { category: "Grants", unrestricted: 0, restricted: 0 },
                        { category: "Investment Income", unrestricted: 0, restricted: 0 },
                        { category: "Other", unrestricted: 11500, restricted: 28721 }
                    ],
                    expenses: [
                        { category: "Program Services", unrestricted: 8050, restricted: 0 },
                        { category: "General and Administrative", unrestricted: 2300, restricted: 0 },
                        { category: "Fundraising", unrestricted: 1150, restricted: 0 }
                    ],
                    netAssets: {
                        changeInNetAssets: { unrestricted: 0, restricted: 28721 },
                        beginningOfYear: { unrestricted: 4300, restricted: 0 },
                        endOfYear: { unrestricted: 4300, restricted: 28721 }
                    },
                    totals: {
                        revenue: {
                            unrestricted: 11500,
                            restricted: 28721,
                            total: 40221
                        },
                        expenses: {
                            unrestricted: 11500,
                            restricted: 0,
                            total: 11500
                        }
                    },
                    invoiceItems: [
                        { id: 1, name: "Sample Item 1", subtotal: 5000, tax_amount: 250, total: 5250, restricted: false },
                        { id: 2, name: "Sample Item 2", subtotal: 6000, tax_amount: 300, total: 6300, restricted: false },
                        { id: 3, name: "Sample Item 3", subtotal: 25000, tax_amount: 1250, total: 26250, restricted: true },
                        { id: 4, name: "Sample Item 4", subtotal: 2356, tax_amount: 115, total: 2471, restricted: true }
                    ]
                });
                
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
        total: 0
    };
    
    const expenseTotals = incomeData.totals?.expenses || {
        unrestricted: 0,
        restricted: 0,
        total: 0
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

            {/* Invoice Items Table */}
            <div className="my-8 overflow-x-auto">
                <h3 className="text-xl font-semibold text-[#2C323C] mb-4">Revenue Summary</h3>
                <table className="w-full border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl w-[40%] text-left">
                                Revenues
                            </th>
                            <th className="py-3 px-4 w-[20%]">Subtotal</th>
                            <th className="py-3 px-4 w-[20%]">Tax Amount</th>
                            <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl w-[20%]">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                        {invoiceItems.length > 0 ? (
                            invoiceItems.map((item, index) => (
                                <tr key={index} className={item.restricted ? "bg-gray-50" : ""}>
                                    <td className="py-3 px-4 text-left">{item.name}</td>
                                    <td className="py-3 px-4 text-center">
                                        {formatNumber(item.subtotal)}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {formatNumber(item.tax_amount)}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {formatNumber(item.total)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="py-3 px-4 text-center">
                                    No invoice items found for this date range
                                </td>
                            </tr>
                        )}
                        <tr className="font-bold text-xl bg-[#DCECF2] border-none">
                            <td className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-left">
                                Total
                            </td>
                            <td className="py-3 px-4 text-center">
                                {formatNumber(
                                    invoiceItems.reduce((sum, item) => sum + item.subtotal, 0)
                                )}
                            </td>
                            <td className="py-3 px-4 text-center">
                                {formatNumber(
                                    invoiceItems.reduce((sum, item) => sum + item.tax_amount, 0)
                                )}
                            </td>
                            <td className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                                {formatNumber(
                                    invoiceItems.reduce((sum, item) => sum + item.total, 0)
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Expenses Table */}
            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl w-[30%] text-left">
                            Expenses
                        </th>
                        <th className="py-3 px-4 w-[20%]">Unrestricted</th>
                        <th className="py-3 px-4 w-[20%]">
                            Temporarily Restricted
                        </th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl w-[30%]">
                            Total
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {incomeData.expenses?.map((item, index) => (
                        <tr key={index}>
                            <td className="py-3 px-4 text-left">{item.category}</td>
                            <td className="py-3 px-4 text-center">
                                {formatNumber(item.unrestricted)}
                            </td>
                            <td className="py-3 px-4 text-center">
                                {formatNumber(item.restricted)}
                            </td>
                            <td className="py-3 px-4 text-center">
                                {formatNumber(item.unrestricted + item.restricted)}
                            </td>
                        </tr>
                    ))}
                    <tr className="font-bold text-xl bg-[#DCECF2] border-none">
                        <td className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-left">
                            Total Expenses
                        </td>
                        <td className="py-3 px-4 text-center">{formatNumber(expenseTotals.unrestricted)}</td>
                        <td className="py-3 px-4 text-center">{formatNumber(expenseTotals.restricted)}</td>
                        <td className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                            {formatNumber(expenseTotals.total)}
                        </td>
                    </tr>
                    <tr className="border-none">
                        <td className="py-3 px-4 text-left">Change in Net Assets</td>
                        <td className="py-3 px-4 text-center">{formatNumber(netAssets.changeInNetAssets.unrestricted)}</td>
                        <td className="py-3 px-4 text-center">{formatNumber(netAssets.changeInNetAssets.restricted)}</td>
                        <td className="py-3 px-4 text-center">
                            {formatNumber(netAssets.changeInNetAssets.unrestricted + netAssets.changeInNetAssets.restricted)}
                        </td>
                    </tr>
                    <tr>
                        <td className="py-3 px-4 text-left">
                            Net Assets, Beginning of Year
                        </td>
                        <td className="py-3 px-4 text-center">{formatNumber(netAssets.beginningOfYear.unrestricted)}</td>
                        <td className="py-3 px-4 text-center">{formatNumber(netAssets.beginningOfYear.restricted)}</td>
                        <td className="py-3 px-4 text-center">
                            {formatNumber(netAssets.beginningOfYear.unrestricted + netAssets.beginningOfYear.restricted)}
                        </td>
                    </tr>
                    <tr className="font-bold text-xl bg-[#DCECF2] border-none">
                        <td className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-left">
                            Net Assets, End of Period
                        </td>
                        <td className="py-3 px-4 text-center">{formatNumber(netAssets.endOfYear.unrestricted)}</td>
                        <td className="py-3 px-4 text-center">{formatNumber(netAssets.endOfYear.restricted)}</td>
                        <td className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                            {formatNumber(netAssets.endOfYear.unrestricted + netAssets.endOfYear.restricted)}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default IncomeStatementTable;
