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
            numericValue: variance,
            numericPercentage: percentage,
        };
    };

    const generateExcel = async () => {
        try {
            const workbook = new ExcelJS.Workbook();

            workbook.creator = "Maharat MCTC";
            workbook.lastModifiedBy = "Maharat MCTC";
            workbook.created = new Date();
            workbook.modified = new Date();
            workbook.title = `Budget Report - ID: ${budget.id}`;
            workbook.subject = "Budget Report";
            workbook.category = "Financial Documents";

            // Summary Sheet
            const summaryWorksheet = workbook.addWorksheet("Budget Summary");

            // Add title
            summaryWorksheet.mergeCells('A1:E1');
            const titleCell = summaryWorksheet.getCell('A1');
            titleCell.value = 'BUDGET REPORT';
            titleCell.font = { size: 16, bold: true };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            titleCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFC7E7DE' }
            };

            summaryWorksheet.addRow([]);

            // Budget Information Section
            summaryWorksheet.addRow(['Budget ID:', budget.id]);
            summaryWorksheet.addRow(['Status:', budget.status || 'N/A']);
            summaryWorksheet.addRow(['Description:', budget.description || 'N/A']);
            summaryWorksheet.addRow([]);

            // Budget Details Header
            summaryWorksheet.mergeCells(`A${summaryWorksheet.lastRow.number + 1}:E${summaryWorksheet.lastRow.number + 1}`);
            const detailsHeaderCell = summaryWorksheet.getCell(`A${summaryWorksheet.lastRow.number + 1}`);
            detailsHeaderCell.value = 'Budget Details';
            detailsHeaderCell.font = { size: 14, bold: true };
            detailsHeaderCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF0F0F0' }
            };

            summaryWorksheet.addRow([]);

            // Budget Details
            summaryWorksheet.addRow(['Fiscal Period:', budget.fiscal_period?.period_name || 'N/A']);
            summaryWorksheet.addRow(['Period Range:', `${formatDateForDisplay(budget.fiscal_period?.start_date)} - ${formatDateForDisplay(budget.fiscal_period?.end_date)}`]);
            summaryWorksheet.addRow(['Department:', budget.department?.name || 'N/A']);
            summaryWorksheet.addRow(['Department Code:', budget.department?.code || 'N/A']);
            summaryWorksheet.addRow(['Cost Center:', budget.cost_center?.name || 'N/A']);
            summaryWorksheet.addRow(['Cost Center Code:', budget.cost_center?.code || 'N/A']);
            summaryWorksheet.addRow(['Cost Center Type:', budget.cost_center?.cost_center_type || 'N/A']);
            summaryWorksheet.addRow(['Created By:', budget.creator?.name || 'N/A']);
            summaryWorksheet.addRow(['Created At:', formatDateForDisplay(budget.created_at)]);
            summaryWorksheet.addRow([]);

            // Financial Summary Header
            summaryWorksheet.mergeCells(`A${summaryWorksheet.lastRow.number + 1}:E${summaryWorksheet.lastRow.number + 1}`);
            const summaryHeaderCell = summaryWorksheet.getCell(`A${summaryWorksheet.lastRow.number + 1}`);
            summaryHeaderCell.value = 'Financial Summary';
            summaryHeaderCell.font = { size: 14, bold: true };
            summaryHeaderCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF0F0F0' }
            };

            summaryWorksheet.addRow([]);

            // Financial Summary Table Headers
            const headerRow = summaryWorksheet.addRow(['Category', 'Planned', 'Actual', 'Variance', 'Variance %']);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFC7E7DE' }
            };
            headerRow.alignment = { horizontal: 'center' };

            // Calculate values
            const revenuePlanned = getNumericValue(budget.total_revenue_planned);
            const revenueActual = getNumericValue(budget.total_revenue_actual);
            const revenueVariance = calculateVariance(revenuePlanned, revenueActual);

            const expensePlanned = getNumericValue(budget.total_expense_planned);
            const expenseActual = getNumericValue(budget.total_expense_actual);
            const expenseVariance = calculateVariance(expensePlanned, expenseActual);

            const profitPlanned = revenuePlanned - expensePlanned;
            const profitActual = revenueActual - expenseActual;
            const profitVariance = calculateVariance(profitPlanned, profitActual);

            // Add data rows
            const revenueRow = summaryWorksheet.addRow([
                'Revenue',
                revenuePlanned,
                revenueActual,
                revenueVariance.numericValue,
                revenueVariance.numericPercentage / 100
            ]);
            revenueRow.getCell(2).numFmt = '#,##0.00';
            revenueRow.getCell(3).numFmt = '#,##0.00';
            revenueRow.getCell(4).numFmt = '#,##0.00';
            revenueRow.getCell(5).numFmt = '0.00%';

            const expenseRow = summaryWorksheet.addRow([
                'Expenses',
                expensePlanned,
                expenseActual,
                expenseVariance.numericValue,
                expenseVariance.numericPercentage / 100
            ]);
            expenseRow.getCell(2).numFmt = '#,##0.00';
            expenseRow.getCell(3).numFmt = '#,##0.00';
            expenseRow.getCell(4).numFmt = '#,##0.00';
            expenseRow.getCell(5).numFmt = '0.00%';

            const profitRow = summaryWorksheet.addRow([
                'Net Profit',
                profitPlanned,
                profitActual,
                profitVariance.numericValue,
                profitVariance.numericPercentage / 100
            ]);
            profitRow.font = { bold: true };
            profitRow.getCell(2).numFmt = '#,##0.00';
            profitRow.getCell(3).numFmt = '#,##0.00';
            profitRow.getCell(4).numFmt = '#,##0.00';
            profitRow.getCell(5).numFmt = '0.00%';

            // Set column widths
            summaryWorksheet.getColumn(1).width = 25;
            summaryWorksheet.getColumn(2).width = 20;
            summaryWorksheet.getColumn(3).width = 20;
            summaryWorksheet.getColumn(4).width = 20;
            summaryWorksheet.getColumn(5).width = 15;

            // Performance Analysis Sheet
            const performanceWorksheet = workbook.addWorksheet("Performance Analysis");

            // Title
            performanceWorksheet.mergeCells('A1:E1');
            const perfTitleCell = performanceWorksheet.getCell('A1');
            perfTitleCell.value = 'PERFORMANCE ANALYSIS';
            perfTitleCell.font = { size: 16, bold: true };
            perfTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            perfTitleCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFC7E7DE' }
            };

            performanceWorksheet.addRow([]);
            performanceWorksheet.addRow(['Budget ID:', budget.id]);
            performanceWorksheet.addRow([]);

            // Performance Indicators Header
            performanceWorksheet.mergeCells(`A${performanceWorksheet.lastRow.number + 1}:E${performanceWorksheet.lastRow.number + 1}`);
            const perfHeaderCell = performanceWorksheet.getCell(`A${performanceWorksheet.lastRow.number + 1}`);
            perfHeaderCell.value = 'Performance Indicators';
            perfHeaderCell.font = { size: 14, bold: true };
            perfHeaderCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF0F0F0' }
            };

            performanceWorksheet.addRow([]);

            // Performance table headers
            const perfHeaderRow = performanceWorksheet.addRow(['Indicator', 'Achievement', 'Target', 'Status', 'Performance']);
            perfHeaderRow.font = { bold: true };
            perfHeaderRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFC7E7DE' }
            };
            perfHeaderRow.alignment = { horizontal: 'center' };

            // Revenue Achievement
            const revPercentage = revenuePlanned !== 0 ? (revenueActual / revenuePlanned) * 100 : 0;
            const revStatus = revPercentage >= 100 ? '✓ Good' : revPercentage >= 90 ? '◐ Fair' : '✗ Poor';
            const revPerf = revPercentage >= 100 ? 'On Target' : 'Below Target';
            
            const revRow = performanceWorksheet.addRow([
                'Revenue Achievement',
                revPercentage / 100,
                1,
                revStatus,
                revPerf
            ]);
            revRow.getCell(2).numFmt = '0.00%';
            revRow.getCell(3).numFmt = '0.00%';

            // Expense Control
            const expPercentage = expensePlanned !== 0 ? (expenseActual / expensePlanned) * 100 : 0;
            const expStatus = expPercentage <= 95 ? '✓ Good' : expPercentage <= 105 ? '◐ Fair' : '✗ Poor';
            const expPerf = expPercentage <= 100 ? 'On Target' : 'Above Target';
            
            const expRow = performanceWorksheet.addRow([
                'Expense Control',
                expPercentage / 100,
                1,
                expStatus,
                expPerf
            ]);
            expRow.getCell(2).numFmt = '0.00%';
            expRow.getCell(3).numFmt = '0.00%';

            // Profit Achievement
            if (profitPlanned !== 0) {
                const profitPercentage = (profitActual / profitPlanned) * 100;
                const profitStatus = profitPercentage >= 100 ? '✓ Good' : profitPercentage >= 90 ? '◐ Fair' : '✗ Poor';
                const profitPerf = profitPercentage >= 100 ? 'On Target' : 'Below Target';
                
                const profRow = performanceWorksheet.addRow([
                    'Profit Achievement',
                    profitPercentage / 100,
                    1,
                    profitStatus,
                    profitPerf
                ]);
                profRow.getCell(2).numFmt = '0.00%';
                profRow.getCell(3).numFmt = '0.00%';
            }

            // Set column widths
            performanceWorksheet.getColumn(1).width = 25;
            performanceWorksheet.getColumn(2).width = 15;
            performanceWorksheet.getColumn(3).width = 15;
            performanceWorksheet.getColumn(4).width = 15;
            performanceWorksheet.getColumn(5).width = 20;

            // Detailed Figures Sheet
            const detailsWorksheet = workbook.addWorksheet("Detailed Figures");

            // Title
            detailsWorksheet.mergeCells('A1:F1');
            const detailTitleCell = detailsWorksheet.getCell('A1');
            detailTitleCell.value = 'DETAILED FINANCIAL FIGURES';
            detailTitleCell.font = { size: 16, bold: true };
            detailTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            detailTitleCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFC7E7DE' }
            };

            detailsWorksheet.addRow([]);
            detailsWorksheet.addRow(['Budget ID:', budget.id]);
            detailsWorksheet.addRow([]);

            // Detailed table headers
            const detailHeaderRow = detailsWorksheet.addRow(['Category', 'Type', 'Planned', 'Actual', 'Variance', 'Variance %']);
            detailHeaderRow.font = { bold: true };
            detailHeaderRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFC7E7DE' }
            };
            detailHeaderRow.alignment = { horizontal: 'center' };

            // Add detailed rows
            const detailRevRow = detailsWorksheet.addRow([
                'Revenue',
                'Total',
                revenuePlanned,
                revenueActual,
                revenueVariance.numericValue,
                revenueVariance.numericPercentage / 100
            ]);
            detailRevRow.getCell(3).numFmt = '#,##0.00';
            detailRevRow.getCell(4).numFmt = '#,##0.00';
            detailRevRow.getCell(5).numFmt = '#,##0.00';
            detailRevRow.getCell(6).numFmt = '0.00%';

            const detailExpRow = detailsWorksheet.addRow([
                'Expenses',
                'Total',
                expensePlanned,
                expenseActual,
                expenseVariance.numericValue,
                expenseVariance.numericPercentage / 100
            ]);
            detailExpRow.getCell(3).numFmt = '#,##0.00';
            detailExpRow.getCell(4).numFmt = '#,##0.00';
            detailExpRow.getCell(5).numFmt = '#,##0.00';
            detailExpRow.getCell(6).numFmt = '0.00%';

            const detailProfitRow = detailsWorksheet.addRow([
                'Net Profit',
                'Net',
                profitPlanned,
                profitActual,
                profitVariance.numericValue,
                profitVariance.numericPercentage / 100
            ]);
            detailProfitRow.font = { bold: true };
            detailProfitRow.getCell(3).numFmt = '#,##0.00';
            detailProfitRow.getCell(4).numFmt = '#,##0.00';
            detailProfitRow.getCell(5).numFmt = '#,##0.00';
            detailProfitRow.getCell(6).numFmt = '0.00%';

            // Set column widths
            detailsWorksheet.getColumn(1).width = 20;
            detailsWorksheet.getColumn(2).width = 15;
            detailsWorksheet.getColumn(3).width = 20;
            detailsWorksheet.getColumn(4).width = 20;
            detailsWorksheet.getColumn(5).width = 20;
            detailsWorksheet.getColumn(6).width = 15;

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

            if (onGenerated && typeof onGenerated === "function") {
                onGenerated(excelFile);
            }
        } catch (error) {
            console.error("Error generating Excel:", error);
            alert("Failed to generate Excel file. Please try again.");

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

    return null;
}
