import React, { useEffect, useState } from "react";
import axios from "axios";
import ExcelJS from "exceljs";

export default function BudgetExcel({ budgetId, onGenerated }) {
    const [budget, setBudget] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBudget = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `/api/v1/budgets/${budgetId}?include=fiscalPeriod,department,costCenter,subCostCenter,creator,updater`
                );
                if (response.data?.data) {
                    const data = response.data.data;
                    setBudget(data);
                } else {
                    throw new Error("Invalid budget data format");
                }
            } catch (error) {
                console.error("Error fetching budget data:", error);
                setError(
                    "Failed to load budget: " +
                        (error.message || "Unknown error")
                );
            } finally {
                setLoading(false);
            }
        };

        if (budgetId) {
            fetchBudget();
        } else {
            setError("No budget ID provided");
            setLoading(false);
        }
    }, [budgetId]);

    useEffect(() => {
        if (!loading && !error && budget) {
            generateExcel();
        }
    }, [budget, loading, error]);

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return "SAR 0.00";
        return `SAR ${parseFloat(amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    // For Excel, strip the currency symbol and formatting to get just the numeric value
    const getNumericValue = (amount) => {
        if (amount === null || amount === undefined) return 0;
        return parseFloat(amount) || 0;
    };

    const calculateVariance = (planned, actual) => {
        const plannedValue = parseFloat(planned) || 0;
        const actualValue = parseFloat(actual) || 0;
        const variance = actualValue - plannedValue;
        const percentage =
            plannedValue !== 0 ? (variance / plannedValue) * 100 : 0;

        return {
            value: variance,
            percentage: percentage,
            formatted: `${formatCurrency(variance)} (${percentage.toFixed(
                2
            )}%)`,
            numericValue: variance,
            numericPercentage: percentage,
        };
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
            workbook.title = `Budget Report - ID: ${budget.id}`;
            workbook.subject = "Budget Report";
            workbook.category = "Financial Documents";

            // Summary Sheet
            const summaryData = [
                ["BUDGET REPORT"],
                [""], // Empty row for spacing
                [`Budget ID: ${budget.id}`],
                [`Description: ${budget.description || "N/A"}`],
                [`Status: ${budget.status || "N/A"}`],
                [""], // Empty row for spacing
                ["Budget Details"],
                [""], // Empty row for spacing
                ["Fiscal Period:", budget.fiscal_period?.period_name || "N/A"],
                [
                    "Period Range:",
                    `${formatDateForDisplay(
                        budget.fiscal_period?.start_date
                    )} - ${formatDateForDisplay(
                        budget.fiscal_period?.end_date
                    )}`,
                ],
                ["Department:", budget.department?.name || "N/A"],
                ["Department Code:", budget.department?.code || "N/A"],
                ["Cost Center:", budget.cost_center?.name || "N/A"],
                ["Cost Center Code:", budget.cost_center?.code || "N/A"],
                [
                    "Cost Center Type:",
                    budget.cost_center?.cost_center_type || "N/A",
                ],
                ["Created By:", budget.creator?.name || "N/A"],
                ["Created At:", formatDateForDisplay(budget.created_at)],
                [""], // Empty row for spacing
                ["Budget Summary"],
                [""], // Empty row for spacing
                ["Category", "Planned", "Actual", "Variance", "Variance %"],
            ];

            // Calculate variances - safely handle null/undefined values
            const revenueVariance = calculateVariance(
                budget.total_revenue_planned,
                budget.total_revenue_actual
            );
            const expenseVariance = calculateVariance(
                budget.total_expense_planned,
                budget.total_expense_actual
            );

            // Calculate profit/loss
            const plannedProfit =
                (parseFloat(budget.total_revenue_planned) || 0) -
                (parseFloat(budget.total_expense_planned) || 0);
            const actualProfit =
                (parseFloat(budget.total_revenue_actual) || 0) -
                (parseFloat(budget.total_expense_actual) || 0);
            const profitVariance = calculateVariance(
                plannedProfit,
                actualProfit
            );

            // Add budget summary rows
            summaryData.push([
                "Revenue",
                getNumericValue(budget.total_revenue_planned),
                getNumericValue(budget.total_revenue_actual),
                revenueVariance.numericValue,
                revenueVariance.numericPercentage,
            ]);
            summaryData.push([
                "Expenses",
                getNumericValue(budget.total_expense_planned),
                getNumericValue(budget.total_expense_actual),
                expenseVariance.numericValue,
                expenseVariance.numericPercentage,
            ]);
            summaryData.push([
                "Profit/Loss",
                plannedProfit,
                actualProfit,
                profitVariance.numericValue,
                profitVariance.numericPercentage,
            ]);

            summaryData.push([""], [""], ["Budget Performance Analysis"], [""]);

            // Add performance summary based on data
            const revPercent =
                (getNumericValue(budget.total_revenue_actual) /
                    (getNumericValue(budget.total_revenue_planned) || 0.01)) *
                100;

            const expPercent =
                (getNumericValue(budget.total_expense_actual) /
                    (getNumericValue(budget.total_expense_planned) || 0.01)) *
                100;

            // Revenue analysis
            if (revPercent >= 100) {
                summaryData.push([
                    "Revenue Performance:",
                    "✓ Revenue target achieved successfully.",
                ]);
            } else if (revPercent >= 90) {
                summaryData.push([
                    "Revenue Performance:",
                    "! Revenue slightly below target.",
                ]);
            } else {
                summaryData.push([
                    "Revenue Performance:",
                    "✗ Revenue significantly below target. Requires attention.",
                ]);
            }

            // Expense analysis
            if (expPercent <= 95) {
                summaryData.push([
                    "Expense Performance:",
                    "✓ Expenses well controlled below budget.",
                ]);
            } else if (expPercent <= 105) {
                summaryData.push([
                    "Expense Performance:",
                    "! Expenses approximately at budgeted level.",
                ]);
            } else {
                summaryData.push([
                    "Expense Performance:",
                    "✗ Expenses exceed budget. Requires review.",
                ]);
            }

            // Profit analysis - safely handle possible zero or negative values
            if (plannedProfit === 0) {
                summaryData.push([
                    "Profit Performance:",
                    "! No profit was planned.",
                ]);
            } else {
                const profitPercent =
                    (actualProfit / Math.abs(plannedProfit)) * 100;
                if (plannedProfit > 0) {
                    // Normal case - profit was expected
                    if (profitPercent >= 100) {
                        summaryData.push([
                            "Profit Performance:",
                            "✓ Profit target achieved.",
                        ]);
                    } else if (profitPercent >= 90) {
                        summaryData.push([
                            "Profit Performance:",
                            "! Profit slightly below target.",
                        ]);
                    } else {
                        summaryData.push([
                            "Profit Performance:",
                            "✗ Profit significantly below target.",
                        ]);
                    }
                } else {
                    // Special case - loss was expected
                    if (actualProfit > 0) {
                        summaryData.push([
                            "Profit Performance:",
                            "✓ Exceeded expectations - profit achieved instead of projected loss.",
                        ]);
                    } else if (actualProfit > plannedProfit) {
                        summaryData.push([
                            "Profit Performance:",
                            "✓ Loss less than projected.",
                        ]);
                    } else {
                        summaryData.push([
                            "Profit Performance:",
                            "✗ Loss greater than projected.",
                        ]);
                    }
                }
            }

            // Add generation timestamp
            summaryData.push([""]);
            summaryData.push([
                "Generated:",
                `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
            ]);
            summaryData.push([
                "Generated By:",
                "Maharat MCTC Financial System",
            ]);

            // Create summary worksheet
            const summaryWorksheet = workbook.addWorksheet("Budget Summary");

            // Add rows to the worksheet
            summaryData.forEach(row => {
                summaryWorksheet.addRow(row);
            });

            // Set column widths
            summaryWorksheet.getColumn(1).width = 20;
            summaryWorksheet.getColumn(2).width = 25;
            summaryWorksheet.getColumn(3).width = 25;
            summaryWorksheet.getColumn(4).width = 20;
            summaryWorksheet.getColumn(5).width = 15;

            // Merge cells for headers
            summaryWorksheet.mergeCells('A1:E1'); // Title
            summaryWorksheet.mergeCells('A3:E3'); // Budget ID
            summaryWorksheet.mergeCells('A4:E4'); // Description
            summaryWorksheet.mergeCells('A5:E5'); // Status
            summaryWorksheet.mergeCells('A7:E7'); // Budget Details heading
            summaryWorksheet.mergeCells('A19:E19'); // Budget Summary heading
            summaryWorksheet.mergeCells(`A${summaryData.length - 9}:E${summaryData.length - 9}`); // Performance Analysis heading

            // Performance Metrics Sheet
            const performanceData = [
                ["BUDGET PERFORMANCE METRICS"],
                [""], // Empty row for spacing
                [`Budget ID: ${budget.id}`],
                [""], // Empty row for spacing
                ["Performance Indicators"],
                [""], // Empty row for spacing
                ["Indicator", "Value", "Target", "Performance", "Status"],
            ];

            // Revenue achievement percentage
            const revenueAchievement = revPercent;
            let revenueStatus = "✓ Good";
            if (revenueAchievement < 90) revenueStatus = "✗ Poor";
            else if (revenueAchievement < 100) revenueStatus = "! Fair";

            performanceData.push([
                "Revenue Achievement",
                `${revenueAchievement.toFixed(2)}%`,
                "100%",
                revenueAchievement >= 100 ? "On Target" : "Below Target",
                revenueStatus,
            ]);

            // Expense control percentage
            const expenseControl = expPercent;
            let expenseStatus = "✓ Good";
            if (expenseControl > 105) expenseStatus = "✗ Poor";
            else if (expenseControl > 100) expenseStatus = "! Fair";

            performanceData.push([
                "Expense Control",
                `${expenseControl.toFixed(2)}%`,
                "100%",
                expenseControl <= 100 ? "On Target" : "Above Target",
                expenseStatus,
            ]);

            // Profit margin - if there was planned profit
            if (plannedProfit !== 0) {
                const profitAchievement = (actualProfit / plannedProfit) * 100;
                let profitStatus = "✓ Good";
                if (profitAchievement < 90) profitStatus = "✗ Poor";
                else if (profitAchievement < 100) profitStatus = "! Fair";

                performanceData.push([
                    "Profit Achievement",
                    `${profitAchievement.toFixed(2)}%`,
                    "100%",
                    profitAchievement >= 100 ? "On Target" : "Below Target",
                    profitStatus,
                ]);
            }

            // Create performance worksheet
            const performanceWorksheet = workbook.addWorksheet("Performance Metrics");

            // Add rows to the worksheet
            performanceData.forEach(row => {
                performanceWorksheet.addRow(row);
            });

            // Set column widths
            performanceWorksheet.getColumn(1).width = 20; // Indicator column
            performanceWorksheet.getColumn(2).width = 15; // Value column
            performanceWorksheet.getColumn(3).width = 15; // Target column
            performanceWorksheet.getColumn(4).width = 20; // Performance column
            performanceWorksheet.getColumn(5).width = 15; // Status column

            // Merge cells
            performanceWorksheet.mergeCells('A1:E1'); // Title
            performanceWorksheet.mergeCells('A3:E3'); // Budget ID
            performanceWorksheet.mergeCells('A5:E5'); // Performance Indicators heading

            // Detailed Figures Sheet
            const detailData = [
                ["BUDGET DETAILED FIGURES"],
                [""], // Empty row for spacing
                [`Budget ID: ${budget.id}`],
                [""], // Empty row for spacing
                [
                    "Category",
                    "Type",
                    "Planned",
                    "Actual",
                    "Variance",
                    "Variance %",
                ],
            ];

            // Add detailed revenue and expense figures
            detailData.push([
                "Revenue",
                "Total",
                getNumericValue(budget.total_revenue_planned),
                getNumericValue(budget.total_revenue_actual),
                revenueVariance.numericValue,
                revenueVariance.numericPercentage,
            ]);

            detailData.push([
                "Expenses",
                "Total",
                getNumericValue(budget.total_expense_planned),
                getNumericValue(budget.total_expense_actual),
                expenseVariance.numericValue,
                expenseVariance.numericPercentage,
            ]);

            detailData.push([
                "Profit/Loss",
                "Net",
                plannedProfit,
                actualProfit,
                profitVariance.numericValue,
                profitVariance.numericPercentage,
            ]);

            // Create detailed figures worksheet
            const detailsWorksheet = workbook.addWorksheet("Detailed Figures");

            // Add rows to the worksheet
            detailData.forEach(row => {
                detailsWorksheet.addRow(row);
            });

            // Set column widths
            detailsWorksheet.getColumn(1).width = 20; // Category column
            detailsWorksheet.getColumn(2).width = 15; // Type column
            detailsWorksheet.getColumn(3).width = 15; // Planned column
            detailsWorksheet.getColumn(4).width = 15; // Actual column
            detailsWorksheet.getColumn(5).width = 15; // Variance column
            detailsWorksheet.getColumn(6).width = 15; // Variance % column

            // Merge cells
            detailsWorksheet.mergeCells('A1:F1'); // Title
            detailsWorksheet.mergeCells('A3:F3'); // Budget ID

            // Generate Excel file
            const excelBuffer = await workbook.xlsx.writeBuffer();
            const excelBlob = new Blob([excelBuffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const excelFile = new File(
                [excelBlob],
                `budget_report_${budget.id}.xlsx`,
                {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                }
            );

            // Create download link and trigger click
            const url = URL.createObjectURL(excelBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `budget_report_${budget.id}.xlsx`;
            document.body.appendChild(link);
            link.click();

            // Clean up
            URL.revokeObjectURL(url);
            document.body.removeChild(link);

            // Notify parent component that Excel has been generated
            if (onGenerated && typeof onGenerated === "function") {
                onGenerated(excelFile);
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
        return <div>Generating Budget Excel, please wait...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return null; // This component doesn't render anything visible
}
