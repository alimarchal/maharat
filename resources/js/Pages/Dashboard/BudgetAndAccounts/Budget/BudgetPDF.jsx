import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function BudgetPDF({ budgetId, onGenerated }) {
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
                    console.log("Fetched Budget data:", data);
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
            generatePDF();
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
        };
    };

    const generatePDF = async () => {
        try {
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 15;
            const contentWidth = pageWidth - margin * 2;

            // Initialize autotable to ensure plugin is loaded
            autoTable(doc, {
                /* empty config */
            });

            // Logo
            try {
                const img = new Image();
                img.src = "/images/MCTC Logo.png";
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    setTimeout(resolve, 3000); // Failsafe timeout
                });

                const logoHeight = 20;
                const logoWidth = 48;

                doc.addImage(
                    img,
                    "PNG",
                    (pageWidth - logoWidth) / 2,
                    margin,
                    logoWidth,
                    logoHeight
                );
            } catch (imgErr) {
                console.error("Error adding logo:", imgErr);
                // Continue without logo if it fails
            }

            // Title bar
            doc.setFillColor(199, 231, 222);
            doc.roundedRect(margin, margin + 25, contentWidth, 10, 5, 5, "F");
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("BUDGET REPORT", pageWidth / 2, margin + 32, {
                align: "center",
            });

            const startY = margin + 40;
            const boxHeight = 30;
            const leftBoxWidth = contentWidth * 0.48;
            const rightBoxWidth = contentWidth * 0.48;
            const centerGap = contentWidth * 0.05;

            // Left info box
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(margin, startY, leftBoxWidth, boxHeight, 3, 3, "F");

            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Budget ID:", margin + 5, startY + 8);
            doc.text("Description:", margin + 5, startY + 18);
            doc.text("Status:", margin + 5, startY + 28);

            doc.setFont("helvetica", "normal");
            doc.text(budget.id.toString() || "N/A", margin + 40, startY + 8);
            doc.text(budget.description || "N/A", margin + 40, startY + 18);
            doc.text(budget.status || "N/A", margin + 40, startY + 28);

            // Right info box
            const rightBoxX = margin + leftBoxWidth + centerGap;
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(
                rightBoxX,
                startY,
                rightBoxWidth,
                boxHeight,
                3,
                3,
                "F"
            );

            doc.setFont("helvetica", "bold");
            doc.text("Fiscal Period:", rightBoxX + 5, startY + 8);
            doc.text("Period Range:", rightBoxX + 5, startY + 18);
            doc.text("Created By:", rightBoxX + 5, startY + 28);

            doc.setFont("helvetica", "normal");
            doc.text(
                budget.fiscal_period?.period_name || "N/A",
                rightBoxX + 40,
                startY + 8
            );
            doc.text(
                `${formatDateForDisplay(
                    budget.fiscal_period?.start_date
                )} - ${formatDateForDisplay(budget.fiscal_period?.end_date)}`,
                rightBoxX + 40,
                startY + 18
            );
            doc.text(
                budget.creator?.name || "N/A",
                rightBoxX + 40,
                startY + 28
            );

            // Department details section
            const deptStartY = startY + boxHeight + 5;
            const deptBoxHeight = 30;

            // Department box
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(
                margin,
                deptStartY,
                leftBoxWidth,
                deptBoxHeight,
                3,
                3,
                "F"
            );

            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Department:", margin + 5, deptStartY + 8);
            doc.text("Department Code:", margin + 5, deptStartY + 18);
            doc.text("Created At:", margin + 5, deptStartY + 28);

            doc.setFont("helvetica", "normal");
            doc.text(
                budget.department?.name || "N/A",
                margin + 50,
                deptStartY + 8
            );
            doc.text(
                budget.department?.code || "N/A",
                margin + 50,
                deptStartY + 18
            );
            doc.text(
                formatDateForDisplay(budget.created_at),
                margin + 50,
                deptStartY + 28
            );

            // Cost Center box
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(
                rightBoxX,
                deptStartY,
                rightBoxWidth,
                deptBoxHeight,
                3,
                3,
                "F"
            );

            doc.setFont("helvetica", "bold");
            doc.text("Cost Center:", rightBoxX + 5, deptStartY + 8);
            doc.text("Cost Center Code:", rightBoxX + 5, deptStartY + 18);
            doc.text("Cost Center Type:", rightBoxX + 5, deptStartY + 28);

            doc.setFont("helvetica", "normal");
            doc.text(
                budget.cost_center?.name || "N/A",
                rightBoxX + 50,
                deptStartY + 8
            );
            doc.text(
                budget.cost_center?.code || "N/A",
                rightBoxX + 50,
                deptStartY + 18
            );
            doc.text(
                budget.cost_center?.cost_center_type || "N/A",
                rightBoxX + 50,
                deptStartY + 28
            );

            // Budget Summary Section Title
            const summaryStartY = deptStartY + deptBoxHeight + 15;

            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(
                margin,
                summaryStartY - 5,
                pageWidth - margin,
                summaryStartY - 5
            );

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Budget Summary", pageWidth / 2, summaryStartY, {
                align: "center",
            });

            // Budget Summary Table
            const summaryTableStartY = summaryStartY + 10;
            const summaryTableColumns = [
                "Category",
                "Planned",
                "Actual",
                "Variance",
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

            const summaryTableRows = [
                [
                    "Revenue",
                    formatCurrency(budget.total_revenue_planned),
                    formatCurrency(budget.total_revenue_actual),
                    revenueVariance.formatted,
                ],
                [
                    "Expenses",
                    formatCurrency(budget.total_expense_planned),
                    formatCurrency(budget.total_expense_actual),
                    expenseVariance.formatted,
                ],
                [
                    "Profit/Loss",
                    formatCurrency(plannedProfit),
                    formatCurrency(actualProfit),
                    profitVariance.formatted,
                ],
            ];

            try {
                autoTable(doc, {
                    head: [summaryTableColumns],
                    body: summaryTableRows,
                    startY: summaryTableStartY,
                    margin: { left: margin, right: margin },
                    styles: {
                        fontSize: 10,
                        cellPadding: 5,
                        lineWidth: 0.1,
                        valign: "middle",
                    },
                    headStyles: {
                        fillColor: [199, 231, 222],
                        textColor: [0, 0, 0],
                        fontStyle: "bold",
                        halign: "center",
                    },
                    columnStyles: {
                        0: { halign: "left" },
                        1: { halign: "right" },
                        2: { halign: "right" },
                        3: { halign: "right" },
                    },
                    alternateRowStyles: {
                        fillColor: [245, 245, 245],
                    },
                    tableWidth: contentWidth,
                });
            } catch (tableError) {
                console.error("Error generating summary table:", tableError);
            }

            // Budget Analysis & Performance Section
            const tableResult = doc.lastAutoTable || {
                finalY: summaryTableStartY + 30,
            };
            const analysisStartY = tableResult.finalY + 15;

            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(
                margin,
                analysisStartY - 5,
                pageWidth - margin,
                analysisStartY - 5
            );

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Budget Analysis", pageWidth / 2, analysisStartY, {
                align: "center",
            });

            // Add budget performance gauge section - visual representation of budget performance
            const performanceStartY = analysisStartY + 10;
            const gaugeHeight = 20;

            // Revenue performance
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Revenue Performance", margin, performanceStartY);

            // Safely calculate percentages to avoid division by zero
            const plannedRevenue =
                parseFloat(budget.total_revenue_planned) || 0.01; // Avoid division by zero
            const actualRevenue = parseFloat(budget.total_revenue_actual) || 0;
            const revPercent = (actualRevenue / plannedRevenue) * 100;

            const gaugeWidth = contentWidth;
            const actualRevWidth = Math.min(
                (revPercent / 100) * gaugeWidth,
                gaugeWidth
            );

            // Background gauge
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(
                margin,
                performanceStartY + 5,
                gaugeWidth,
                gaugeHeight,
                2,
                2,
                "F"
            );

            // Actual gauge - color based on performance
            if (revPercent >= 100) {
                doc.setFillColor(144, 238, 144); // Light green
            } else if (revPercent >= 90) {
                doc.setFillColor(255, 255, 153); // Light yellow
            } else {
                doc.setFillColor(255, 182, 193); // Light red
            }

            doc.roundedRect(
                margin,
                performanceStartY + 5,
                actualRevWidth,
                gaugeHeight,
                2,
                2,
                "F"
            );

            // Percentage text
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(50, 50, 50);
            doc.text(
                `${revPercent.toFixed(1)}%`,
                margin + actualRevWidth - 15,
                performanceStartY + 17
            );

            // Expense performance
            const expensePerformanceY = performanceStartY + gaugeHeight + 15;
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text("Expense Performance", margin, expensePerformanceY);

            // Safely calculate percentages
            const plannedExpense =
                parseFloat(budget.total_expense_planned) || 0.01; // Avoid division by zero
            const actualExpense = parseFloat(budget.total_expense_actual) || 0;
            const expPercent = (actualExpense / plannedExpense) * 100;

            const actualExpWidth = Math.min(
                (expPercent / 100) * gaugeWidth,
                gaugeWidth
            );

            // Background gauge
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(
                margin,
                expensePerformanceY + 5,
                gaugeWidth,
                gaugeHeight,
                2,
                2,
                "F"
            );

            // Actual gauge - for expenses, lower is better
            if (expPercent <= 95) {
                doc.setFillColor(144, 238, 144); // Light green
            } else if (expPercent <= 105) {
                doc.setFillColor(255, 255, 153); // Light yellow
            } else {
                doc.setFillColor(255, 182, 193); // Light red
            }

            doc.roundedRect(
                margin,
                expensePerformanceY + 5,
                actualExpWidth,
                gaugeHeight,
                2,
                2,
                "F"
            );

            // Percentage text
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(50, 50, 50);
            doc.text(
                `${expPercent.toFixed(1)}%`,
                margin + actualExpWidth - 15,
                expensePerformanceY + 17
            );

            // Notes section
            const notesStartY = expensePerformanceY + gaugeHeight + 20;

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text("Notes & Comments", margin, notesStartY);

            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.1);
            doc.line(
                margin,
                notesStartY + 5,
                pageWidth - margin,
                notesStartY + 5
            );

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");

            // Add performance summary based on data
            let performanceText = "";

            // Revenue analysis
            if (revPercent >= 100) {
                performanceText += "✓ Revenue target achieved successfully. ";
            } else if (revPercent >= 90) {
                performanceText += "! Revenue slightly below target. ";
            } else {
                performanceText +=
                    "✗ Revenue significantly below target. Requires attention. ";
            }

            // Expense analysis
            if (expPercent <= 95) {
                performanceText += "✓ Expenses well controlled below budget. ";
            } else if (expPercent <= 105) {
                performanceText +=
                    "! Expenses approximately at budgeted level. ";
            } else {
                performanceText +=
                    "✗ Expenses exceed budget. Requires review. ";
            }

            // Profit analysis - safely handle possible zero or negative values
            if (plannedProfit === 0) {
                performanceText += "! No profit was planned.";
            } else {
                const profitPercent =
                    (actualProfit / Math.abs(plannedProfit)) * 100;
                if (plannedProfit > 0) {
                    // Normal case - profit was expected
                    if (profitPercent >= 100) {
                        performanceText += "✓ Profit target achieved.";
                    } else if (profitPercent >= 90) {
                        performanceText += "! Profit slightly below target.";
                    } else {
                        performanceText +=
                            "✗ Profit significantly below target.";
                    }
                } else {
                    // Special case - loss was expected
                    if (actualProfit > 0) {
                        performanceText +=
                            "✓ Exceeded expectations - profit achieved instead of projected loss.";
                    } else if (actualProfit > plannedProfit) {
                        performanceText += "✓ Loss less than projected.";
                    } else {
                        performanceText += "✗ Loss greater than projected.";
                    }
                }
            }

            doc.text(performanceText, margin, notesStartY + 15, {
                maxWidth: contentWidth,
                align: "left",
            });

            // Footer with generation timestamp
            const footerY = pageHeight - 10;
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.text(
                `Generated on: ${new Date().toLocaleString()}`,
                margin,
                footerY
            );

            // Save the PDF
            const pdfBlob = doc.output("blob");
            const pdfFile = new File(
                [pdfBlob],
                `budget_report_${budget.id}.pdf`,
                { type: "application/pdf" }
            );

            // Notify parent component that PDF was generated
            if (onGenerated && typeof onGenerated === "function") {
                onGenerated(pdfFile);
            }

            // Open the PDF in a new tab
            const fileUrl = URL.createObjectURL(pdfBlob);
            window.open(fileUrl, "_blank");
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
            if (onGenerated && typeof onGenerated === "function") {
                onGenerated(null, error);
            }
        }
    };

    if (loading) {
        return <div>Generating Budget PDF, please wait...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return null;
}
