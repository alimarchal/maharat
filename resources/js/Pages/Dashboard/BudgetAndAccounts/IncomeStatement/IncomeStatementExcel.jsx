import React, { useEffect, useState } from "react";
import axios from "axios";
import ExcelJS from "exceljs";

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
                const revenueTotal = parseFloat(revenueResponse.data.data.total_revenue) || 0;
                const expensesTotal = parseFloat(expensesResponse.data.data.total_expenses) || 0;
                const transactionsTotal = parseFloat(transactionsResponse.data.data.total_amount) || 0;
                
                console.log('Income Statement Data:', {
                    revenueTotal: revenueTotal,
                    expensesTotal: expensesTotal,
                    transactionsTotal: transactionsTotal,
                    revenueResponse: revenueResponse.data.data,
                    expensesResponse: expensesResponse.data.data,
                    transactionsResponse: transactionsResponse.data.data
                });
                
                setData({
                    expenses: expenseCategories,
                    invoices: revenueCategories,
                    totals: {
                        revenue: revenueTotal,
                        expenses: expensesTotal,
                        transactions: transactionsTotal,
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
        const profitMargin = (netIncome / revenue) * 100;
        
        // Add debugging
        console.log('Profit Margin Calculation:', {
            revenue: revenue,
            expenses: data.totals.expenses,
            netIncome: netIncome,
            profitMargin: profitMargin
        });
        
        return profitMargin;
    };

    // Calculate revenue to expense ratio
    const calculateRevToExpRatio = () => {
        const revenue = data.totals.revenue;
        const expenses = data.totals.expenses;
        
        // Handle edge cases
        if (expenses === 0) {
            console.log('Revenue to Expense Ratio: Expenses is 0, returning revenue value');
            return revenue; // If no expenses, ratio is just the revenue amount
        }
        
        const ratio = revenue / expenses;
        
        // Add debugging
        console.log('Revenue to Expense Ratio Calculation:', {
            revenue: revenue,
            expenses: expenses,
            ratio: ratio
        });
        
        return ratio;
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
            // Create workbook
            const workbook = new ExcelJS.Workbook();

            // Add document properties
            workbook.creator = "Maharat MCTC";
            workbook.lastModifiedBy = "Maharat MCTC";
            workbook.created = new Date();
            workbook.modified = new Date();
            workbook.title = `Income Statement ${formatDateForDisplay(
                startDate
            )} to ${formatDateForDisplay(endDate)}`;
            workbook.subject = "Income Statement";
            workbook.category = "Financial Documents";

            // Create summary worksheet
            const summaryWorksheet = workbook.addWorksheet("Summary");

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

            // Add rows to the worksheet
            summaryData.forEach(row => {
                summaryWorksheet.addRow(row);
            });

            // Set column widths
            summaryWorksheet.getColumn(1).width = 25;
            summaryWorksheet.getColumn(2).width = 25;
            summaryWorksheet.getColumn(3).width = 20;

            // Merge cells
            summaryWorksheet.mergeCells('A1:C1'); // Title
            summaryWorksheet.mergeCells('A3:C3'); // Period
            summaryWorksheet.mergeCells('A5:C5'); // Summary heading
            summaryWorksheet.mergeCells('A12:C12'); // Analysis heading

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

            // Create revenue worksheet
            const revenueWorksheet = workbook.addWorksheet("Revenue Details");

            // Add rows to the worksheet
            revenueSheetData.forEach(row => {
                revenueWorksheet.addRow(row);
            });

            // Set column widths
            revenueWorksheet.getColumn(1).width = 30; // Category column
            revenueWorksheet.getColumn(2).width = 20; // Amount column
            revenueWorksheet.getColumn(3).width = 15; // Percentage column

            // Merge cells for the title
            revenueWorksheet.mergeCells('A1:C1');

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

            // Create expenses worksheet
            const expensesWorksheet = workbook.addWorksheet("Expense Details");

            // Add rows to the worksheet
            expenseSheetData.forEach(row => {
                expensesWorksheet.addRow(row);
            });

            // Set column widths
            expensesWorksheet.getColumn(1).width = 30; // Account column
            expensesWorksheet.getColumn(2).width = 20; // Amount column
            expensesWorksheet.getColumn(3).width = 15; // Percentage column

            // Merge cells for the title
            expensesWorksheet.mergeCells('A1:C1');

            // Generate Excel file
            const excelBuffer = await workbook.xlsx.writeBuffer();
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
