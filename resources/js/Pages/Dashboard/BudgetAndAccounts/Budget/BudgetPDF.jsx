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
                    setBudget(response.data.data);
                } else {
                    throw new Error("Invalid budget data format");
                }
            } catch (error) {
                console.error("Error fetching budget data:", error);
                setError("Failed to load budget: " + (error.message || "Unknown error"));
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
        if (amount === null || amount === undefined) return "0.00";
        return parseFloat(amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
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

            // Initialize autotable
            autoTable(doc, {});

            // Logo
            try {
                const img = new Image();
                img.src = "/images/MCTC_Logo.png";
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    setTimeout(resolve, 3000);
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
            const boxWidth = (contentWidth - 6) / 3;

            // Three column layout for basic info
            // Column 1 - Budget Info
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(margin, startY, boxWidth, boxHeight, 3, 3, "F");
            
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text("Budget ID:", margin + 3, startY + 8);
            doc.text("Status:", margin + 3, startY + 18);

            doc.setFont("helvetica", "normal");
            doc.text(budget.id?.toString() || "N/A", margin + 22, startY + 8, {
                maxWidth: boxWidth - 25
            });
            doc.text(budget.status || "N/A", margin + 22, startY + 18, {
                maxWidth: boxWidth - 25
            });

            // Column 2 - Fiscal Period
            const col2X = margin + boxWidth + 3;
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(col2X, startY, boxWidth, boxHeight, 3, 3, "F");
            
            doc.setFont("helvetica", "bold");
            doc.text("Fiscal Period:", col2X + 3, startY + 8);
            doc.text("Created By:", col2X + 3, startY + 18);

            doc.setFont("helvetica", "normal");
            doc.text(budget.fiscal_period?.period_name || "N/A", col2X + 26, startY + 8, {
                maxWidth: boxWidth - 29
            });
            doc.text(budget.creator?.name || "N/A", col2X + 26, startY + 18, {
                maxWidth: boxWidth - 29
            });

            // Column 3 - Department Info
            const col3X = col2X + boxWidth + 3;
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(col3X, startY, boxWidth, boxHeight, 3, 3, "F");
            
            doc.setFont("helvetica", "bold");
            doc.text("Department:", col3X + 3, startY + 8);
            doc.text("Cost Center:", col3X + 3, startY + 18);

            doc.setFont("helvetica", "normal");
            doc.text(budget.department?.name || "N/A", col3X + 26, startY + 8, {
                maxWidth: boxWidth - 29
            });
            doc.text(budget.cost_center?.name || "N/A", col3X + 26, startY + 18, {
                maxWidth: boxWidth - 29
            });

            // Budget Summary Section
            const summaryStartY = startY + boxHeight + 15;

            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(margin, summaryStartY - 5, pageWidth - margin, summaryStartY - 5);

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Budget Summary", pageWidth / 2, summaryStartY, {
                align: "center",
            });

            // Financial Summary Table
            const summaryTableStartY = summaryStartY + 10;
            const summaryColumns = ["Category", "Planned", "Actual", "Variance", "Variance %"];

            // FIXED CALCULATIONS - using correct field names
            const revenuePlanned = parseFloat(budget.total_revenue_planned || 0);
            const revenueActual = parseFloat(budget.total_revenue_actual || 0);
            const revenueVariance = revenueActual - revenuePlanned;
            const revenueVariancePct = revenuePlanned !== 0 ? (revenueVariance / revenuePlanned) * 100 : 0;

            const expensePlanned = parseFloat(budget.total_expense_planned || 0);
            const expenseActual = parseFloat(budget.total_expense_actual || 0);
            const expenseVariance = expenseActual - expensePlanned;
            const expenseVariancePct = expensePlanned !== 0 ? (expenseVariance / expensePlanned) * 100 : 0;

            const profitPlanned = revenuePlanned - expensePlanned;
            const profitActual = revenueActual - expenseActual;
            const profitVariance = profitActual - profitPlanned;
            const profitVariancePct = profitPlanned !== 0 ? (profitVariance / profitPlanned) * 100 : 0;

            const summaryRows = [
                [
                    "Revenue",
                    formatCurrency(revenuePlanned),
                    formatCurrency(revenueActual),
                    formatCurrency(revenueVariance),
                    `${revenueVariancePct.toFixed(1)}%`,
                ],
                [
                    "Expenses",
                    formatCurrency(expensePlanned),
                    formatCurrency(expenseActual),
                    formatCurrency(expenseVariance),
                    `${expenseVariancePct.toFixed(1)}%`,
                ],
                [
                    "Net Profit",
                    formatCurrency(profitPlanned),
                    formatCurrency(profitActual),
                    formatCurrency(profitVariance),
                    `${profitVariancePct.toFixed(1)}%`,
                ],
            ];

            try {
                autoTable(doc, {
                    head: [summaryColumns],
                    body: summaryRows,
                    startY: summaryTableStartY,
                    margin: { left: margin, right: margin },
                    styles: {
                        fontSize: 9,
                        cellPadding: 4,
                        lineWidth: 0.1,
                        valign: "middle",
                        overflow: 'linebreak',
                    },
                    headStyles: {
                        fillColor: [199, 231, 222],
                        textColor: [0, 0, 0],
                        fontStyle: "bold",
                        halign: "center",
                    },
                    columnStyles: {
                        0: { halign: "left", cellWidth: 40 },
                        1: { halign: "right", cellWidth: 35 },
                        2: { halign: "right", cellWidth: 35 },
                        3: { halign: "right", cellWidth: 35 },
                        4: { halign: "right", cellWidth: 35 },
                    },
                    alternateRowStyles: {
                        fillColor: [245, 245, 245],
                    },
                    didParseCell: function(data) {
                        // Color the variance cells
                        if (data.column.index === 3 || data.column.index === 4) {
                            if (data.row.index < 2) {
                                const variance = parseFloat(summaryRows[data.row.index][3].replace(/,/g, ''));
                                if (data.row.index === 0) {
                                    data.cell.styles.textColor = variance >= 0 ? [0, 128, 0] : [255, 0, 0];
                                } else {
                                    data.cell.styles.textColor = variance <= 0 ? [0, 128, 0] : [255, 0, 0];
                                }
                            } else {
                                const variance = parseFloat(summaryRows[2][3].replace(/,/g, ''));
                                data.cell.styles.textColor = variance >= 0 ? [0, 128, 0] : [255, 0, 0];
                            }
                        }
                    },
                });
            } catch (tableError) {
                console.error("Error generating summary table:", tableError);
            }

            // Performance Analysis Section
            const tableResult = doc.lastAutoTable || {
                finalY: summaryTableStartY + 40,
            };
            const analysisStartY = tableResult.finalY + 15;

            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(margin, analysisStartY - 5, pageWidth - margin, analysisStartY - 5);

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Performance Analysis", pageWidth / 2, analysisStartY, {
                align: "center",
            });

            // Performance Gauges
            const gaugeStartY = analysisStartY + 10;
            const gaugeHeight = 15;
            const gaugeWidth = contentWidth - 30;

            // Revenue Performance Gauge
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Revenue Achievement", margin, gaugeStartY);

            const revPercentage = revenuePlanned !== 0 ? (revenueActual / revenuePlanned) * 100 : 0;
            const revGaugeWidth = Math.max(10, Math.min((revPercentage / 100) * gaugeWidth, gaugeWidth));

            // Background
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(margin, gaugeStartY + 3, gaugeWidth, gaugeHeight, 2, 2, "F");

            // Actual gauge with color coding
            if (revPercentage >= 100) {
                doc.setFillColor(76, 175, 80);
            } else if (revPercentage >= 90) {
                doc.setFillColor(255, 193, 7);
            } else {
                doc.setFillColor(244, 67, 54);
            }
            doc.roundedRect(margin, gaugeStartY + 3, revGaugeWidth, gaugeHeight, 2, 2, "F");

            // Percentage text
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text(
                `${revPercentage.toFixed(1)}%`,
                margin + gaugeWidth + 5,
                gaugeStartY + 12
            );

            // Expense Performance Gauge
            const expGaugeStartY = gaugeStartY + gaugeHeight + 10;
            doc.setFont("helvetica", "bold");
            doc.text("Expense Control", margin, expGaugeStartY);

            const expPercentage = expensePlanned !== 0 ? (expenseActual / expensePlanned) * 100 : 0;
            const expGaugeWidth = Math.max(10, Math.min((expPercentage / 100) * gaugeWidth, gaugeWidth));

            // Background
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(margin, expGaugeStartY + 3, gaugeWidth, gaugeHeight, 2, 2, "F");

            // Actual gauge
            if (expPercentage <= 95) {
                doc.setFillColor(76, 175, 80);
            } else if (expPercentage <= 105) {
                doc.setFillColor(255, 193, 7);
            } else {
                doc.setFillColor(244, 67, 54);
            }
            doc.roundedRect(margin, expGaugeStartY + 3, expGaugeWidth, gaugeHeight, 2, 2, "F");

            // Percentage text
            doc.setTextColor(0, 0, 0);
            doc.text(
                `${expPercentage.toFixed(1)}%`,
                margin + gaugeWidth + 5,
                expGaugeStartY + 12
            );

            // Footer
            const footerY = expGaugeStartY + gaugeHeight + 20;
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(128, 128, 128);
            doc.text(
                `Generated on: ${formatDateForDisplay(new Date().toISOString())} at ${new Date().toLocaleTimeString()}`,
                margin,
                footerY
            );
            doc.text(
                "Maharat MCTC - Confidential",
                pageWidth - margin,
                footerY,
                { align: "right" }
            );

            // Save and download PDF
            const pdfBlob = doc.output("blob");
            const pdfFile = new File(
                [pdfBlob],
                `budget_report_${budget.id}.pdf`,
                { type: "application/pdf" }
            );

            const fileUrl = URL.createObjectURL(pdfBlob);
            window.open(fileUrl, "_blank");
            
            const downloadLink = document.createElement('a');
            downloadLink.href = fileUrl;
            downloadLink.download = `budget_report_${budget.id}.pdf`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            setTimeout(() => {
                URL.revokeObjectURL(fileUrl);
            }, 1000);

            if (onGenerated && typeof onGenerated === "function") {
                onGenerated(pdfFile);
            }
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
