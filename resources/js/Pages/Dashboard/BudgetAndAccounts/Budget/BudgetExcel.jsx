import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

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
            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();

            // Add document properties
            wb.Props = {
                Title: `Budget Report - ID: ${budget.id}`,
                Subject: "Budget Report",
                Author: "Maharat MCTC",
                CreatedDate: new Date(),
                Company: "Maharat MCTC",
                Category: "Financial Documents",
            };

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

            // Create worksheet
            const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

            // Set column widths
            wsSummary["!cols"] = [
                { wch: 20 }, // Column A width
                { wch: 25 }, // Column B width
                { wch: 25 }, // Column C width
                { wch: 20 }, // Column D width
                { wch: 15 }, // Column E width
            ];

            // Apply cell merges for headers
            wsSummary["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Merge title cells
                { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }, // Merge Budget ID cells
                { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } }, // Merge Description cells
                { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } }, // Merge Status cells
                { s: { r: 6, c: 0 }, e: { r: 6, c: 4 } }, // Merge Budget Details heading
                { s: { r: 18, c: 0 }, e: { r: 18, c: 4 } }, // Merge Budget Summary heading
                {
                    s: { r: summaryData.length - 10, c: 0 },
                    e: { r: summaryData.length - 10, c: 4 },
                }, // Merge Performance Analysis heading
            ];

            // Add summary worksheet to workbook
            XLSX.utils.book_append_sheet(wb, wsSummary, "Budget Summary");

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

            // Create worksheet
            const wsPerformance = XLSX.utils.aoa_to_sheet(performanceData);

            // Set column widths
            wsPerformance["!cols"] = [
                { wch: 20 }, // Indicator column
                { wch: 15 }, // Value column
                { wch: 15 }, // Target column
                { wch: 20 }, // Performance column
                { wch: 15 }, // Status column
            ];

            // Apply cell merges
            wsPerformance["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Merge title cells
                { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }, // Merge Budget ID cells
                { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } }, // Merge Performance Indicators heading
            ];

            // Add performance worksheet to workbook
            XLSX.utils.book_append_sheet(
                wb,
                wsPerformance,
                "Performance Metrics"
            );

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

            // Create worksheet
            const wsDetails = XLSX.utils.aoa_to_sheet(detailData);

            // Set column widths
            wsDetails["!cols"] = [
                { wch: 20 }, // Category column
                { wch: 15 }, // Type column
                { wch: 15 }, // Planned column
                { wch: 15 }, // Actual column
                { wch: 15 }, // Variance column
                { wch: 15 }, // Variance % column
            ];

            // Apply cell merges
            wsDetails["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Merge title cells
                { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }, // Merge Budget ID cells
            ];

            // Add details worksheet to workbook
            XLSX.utils.book_append_sheet(wb, wsDetails, "Detailed Figures");

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
