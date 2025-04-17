import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

export default function IncomeStatementExcel({
    startDate,
    endDate,
    onGenerated,
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        expenses: [],
        invoices: [],
        totals: {
            revenue: 0,
            expenses: 0,
            transactions: 0,
        },
    });

    useEffect(() => {
        const fetchIncomeStatementData = async () => {
            try {
                setLoading(true);

                // Use the same API endpoints as the PDF component
                const [
                    revenueResponse,
                    expensesResponse,
                    transactionsResponse,
                ] = await Promise.all([
                    axios.get("/api/v1/income-statement/revenue", {
                        params: {
                            from_date: startDate,
                            to_date: endDate,
                        },
                    }),
                    axios.get("/api/v1/income-statement/expenses", {
                        params: {
                            from_date: startDate,
                            to_date: endDate,
                        },
                    }),
                    axios.get("/api/v1/income-statement/transactions", {
                        params: {
                            from_date: startDate,
                            to_date: endDate,
                        },
                    }),
                ]);

                // Get expense details by category
                const expenseCategories =
                    expensesResponse.data.data.categories || [];

                // Get revenue details by category
                const revenueCategories =
                    revenueResponse.data.data.categories || [];

                // Set all data in state
                setData({
                    expenses: expenseCategories,
                    invoices: revenueCategories,
                    totals: {
                        revenue:
                            parseFloat(
                                revenueResponse.data.data.total_revenue
                            ) || 0,
                        expenses:
                            parseFloat(
                                expensesResponse.data.data.total_expenses
                            ) || 0,
                        transactions:
                            parseFloat(
                                transactionsResponse.data.data.total_amount
                            ) || 0,
                    },
                });
            } catch (error) {
                setError(
                    "Failed to load income statement data: " +
                        (error.message || "Unknown error")
                );
            } finally {
                setLoading(false);
            }
        };

        if (startDate && endDate) {
            fetchIncomeStatementData();
        } else {
            setError("No date range provided");
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        if (!loading && !error && data) {
            generateExcel();
        }
    }, [data, loading, error]);

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };

    // Format currency values for display
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return "SAR 0.00";
        return `SAR ${parseFloat(amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    // Aggregate revenue data by category
    const aggregateRevenueByCategory = () => {
        // If we have actual categories from API response, use them
        if (Array.isArray(data.invoices) && data.invoices.length > 0) {
            return data.invoices.map((item) => ({
                category: item.name || item.category || "Revenue",
                amount: parseFloat(item.amount || item.value || 0),
                percentage: (
                    (parseFloat(item.amount || item.value || 0) /
                        data.totals.revenue) *
                    100
                ).toFixed(2),
            }));
        }

        // Fallback to simplified data
        return [
            {
                category: "Total Revenue",
                amount: data.totals.revenue,
                percentage: "100.00",
            },
        ];
    };

    // Aggregate expense data by account
    const aggregateExpensesByAccount = () => {
        // If we have actual expense categories from API response, use them
        if (Array.isArray(data.expenses) && data.expenses.length > 0) {
            return data.expenses.map((item) => ({
                account: item.name || item.category || "Expense",
                amount: parseFloat(item.amount || item.value || 0),
                percentage: (
                    (parseFloat(item.amount || item.value || 0) /
                        data.totals.expenses) *
                    100
                ).toFixed(2),
            }));
        }

        // Fallback to simplified data
        return [
            {
                account: "Total Expenses",
                amount: data.totals.expenses,
                percentage: "100.00",
            },
        ];
    };

    // Calculate net income
    const calculateNetIncome = () => {
        return data.totals.revenue - data.totals.expenses;
    };

    // Calculate profit margin
    const calculateProfitMargin = () => {
        const revenue = data.totals.revenue;
        if (revenue === 0) return 0;

        const netIncome = calculateNetIncome();
        return (netIncome / revenue) * 100;
    };

    // Calculate revenue to expense ratio
    const calculateRevToExpRatio = () => {
        return data.totals.revenue / (data.totals.expenses || 1);
    };

    // Generate performance rating based on profit margin
    const getProfitMarginRating = (margin) => {
        if (margin >= 15) return "Excellent";
        if (margin >= 5) return "Good";
        if (margin >= 0) return "Fair";
        return "Needs Improvement";
    };

    // Generate performance rating based on revenue to expense ratio
    const getRevToExpRatioRating = (ratio) => {
        if (ratio >= 1.2) return "Excellent";
        if (ratio >= 1) return "Good";
        if (ratio >= 0.9) return "Fair";
        return "Needs Improvement";
    };

    const generateExcel = async () => {
        try {
            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();

            // Add document properties
            wb.Props = {
                Title: `Income Statement ${formatDateForDisplay(
                    startDate
                )} to ${formatDateForDisplay(endDate)}`,
                Subject: "Income Statement",
                Author: "Maharat MCTC",
                CreatedDate: new Date(),
                Company: "Maharat MCTC",
                Category: "Financial Documents",
            };

            // Summary sheet
            const summaryData = [
                ["INCOME STATEMENT"],
                [""], // Empty row for spacing
                [
                    `For the period ${formatDateForDisplay(
                        startDate
                    )} to ${formatDateForDisplay(endDate)}`,
                ],
                [""], // Empty row for spacing
                ["Income Statement Summary"],
                [""], // Empty row for spacing
                ["Total Revenue:", `${formatCurrency(data.totals.revenue)}`],
                ["Total Expenses:", `${formatCurrency(data.totals.expenses)}`],
                ["Net Income:", `${formatCurrency(calculateNetIncome())}`],
                ["Profit Margin:", `${calculateProfitMargin().toFixed(2)}%`],
                [""], // Empty row for spacing
                ["Performance Analysis"],
                [""], // Empty row for spacing
                [
                    "Profit Margin:",
                    `${calculateProfitMargin().toFixed(2)}%`,
                    getProfitMarginRating(calculateProfitMargin()),
                ],
                [
                    "Revenue to Expense Ratio:",
                    `${calculateRevToExpRatio().toFixed(2)}`,
                    getRevToExpRatioRating(calculateRevToExpRatio()),
                ],
                [""], // Empty row for spacing
                [
                    "Generated:",
                    `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
                ],
                ["Generated By:", "Maharat MCTC Financial System"],
            ];

            const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

            // Set column widths
            wsSummary["!cols"] = [
                { wch: 25 }, // Column A width
                { wch: 25 }, // Column B width
                { wch: 20 }, // Column C width
            ];

            // Apply some styling (merging cells for the title)
            wsSummary["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Merge title cells
                { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } }, // Merge period cells
                { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } }, // Merge summary heading
                { s: { r: 11, c: 0 }, e: { r: 11, c: 2 } }, // Merge analysis heading
            ];

            // Add summary worksheet to workbook
            XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

            // Revenue Details Sheet
            const revenueData = aggregateRevenueByCategory();

            // Create header row for revenue
            const revenueHeader = [
                ["REVENUE DETAILS"],
                [""], // Empty row for spacing
                ["Category", "Amount", "% of Total"],
            ];

            // Format revenue data rows
            const revenueRows = revenueData.map((item) => [
                item.category,
                formatCurrency(item.amount),
                `${item.percentage}%`,
            ]);

            // Add total row if needed
            if (
                !revenueData.some((item) => item.category === "Total Revenue")
            ) {
                revenueRows.push([
                    "Total Revenue",
                    formatCurrency(data.totals.revenue),
                    "100.00%",
                ]);
            }

            // Combine headers and rows
            const revenueSheetData = [...revenueHeader, ...revenueRows];

            // Create worksheet
            const wsRevenue = XLSX.utils.aoa_to_sheet(revenueSheetData);

            // Set column widths
            wsRevenue["!cols"] = [
                { wch: 30 }, // Category column
                { wch: 20 }, // Amount column
                { wch: 15 }, // Percentage column
            ];

            // Apply cell merges
            wsRevenue["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Merge title cells
            ];

            // Add revenue worksheet to workbook
            XLSX.utils.book_append_sheet(wb, wsRevenue, "Revenue Details");

            // Expense Details Sheet
            const expenseData = aggregateExpensesByAccount();

            // Create header row for expenses
            const expenseHeader = [
                ["EXPENSE DETAILS"],
                [""], // Empty row for spacing
                ["Account", "Amount", "% of Total"],
            ];

            // Format expense data rows
            const expenseRows = expenseData.map((item) => [
                item.account,
                formatCurrency(item.amount),
                `${item.percentage}%`,
            ]);

            // Add total row if needed
            if (
                !expenseData.some((item) => item.account === "Total Expenses")
            ) {
                expenseRows.push([
                    "Total Expenses",
                    formatCurrency(data.totals.expenses),
                    "100.00%",
                ]);
            }

            // Combine headers and rows
            const expenseSheetData = [...expenseHeader, ...expenseRows];

            // Create worksheet
            const wsExpenses = XLSX.utils.aoa_to_sheet(expenseSheetData);

            // Set column widths
            wsExpenses["!cols"] = [
                { wch: 30 }, // Account column
                { wch: 20 }, // Amount column
                { wch: 15 }, // Percentage column
            ];

            // Apply cell merges
            wsExpenses["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Merge title cells
            ];

            // Add expenses worksheet to workbook
            XLSX.utils.book_append_sheet(wb, wsExpenses, "Expense Details");

            // Generate Excel file
            const excelBuffer = XLSX.write(wb, {
                bookType: "xlsx",
                type: "array",
            });
            const excelBlob = new Blob([excelBuffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const excelFile = new File(
                [excelBlob],
                `income_statement_${formatDateForDisplay(
                    startDate
                )}_to_${formatDateForDisplay(endDate)}.xlsx`,
                {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                }
            );

            // Create download link and trigger click
            const url = URL.createObjectURL(excelBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `income_statement_${formatDateForDisplay(
                startDate
            )}_to_${formatDateForDisplay(endDate)}.xlsx`;
            document.body.appendChild(link);
            link.click();

            // Clean up
            URL.revokeObjectURL(url);
            document.body.removeChild(link);

            // Notify parent component that Excel has been generated
            if (onGenerated && typeof onGenerated === "function") {
                onGenerated(url);
            }
        } catch (error) {
            console.error("Error generating Excel:", error);
            alert("Failed to generate Excel file. Please try again.");

            // Notify parent component about the error
            if (onGenerated && typeof onGenerated === "function") {
                onGenerated(null, error);
            }
        }
    };

    if (loading) {
        return <div>Generating Excel, please wait...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return null; // This component doesn't render anything visible
}
