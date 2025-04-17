import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function IncomeStatementPDF({
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

                // Use the same API endpoints as the main component
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

                // Get expense details by category (mock structure based on available data)
                const expenseCategories =
                    expensesResponse.data.data.categories || [];

                // Get revenue details by category (mock structure based on available data)
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
            generatePDF();
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

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return "SAR 0.00";
        return `SAR ${parseFloat(amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    // Since we don't know the exact structure of the API response, using fallback mock data
    const aggregateRevenueByCategory = () => {
        // If we have actual categories from API response, use them
        if (Array.isArray(data.invoices) && data.invoices.length > 0) {
            return data.invoices.map((item) => ({
                category: item.name || item.category || "Revenue",
                amount: parseFloat(item.amount || item.value || 0),
            }));
        }

        // Fallback to simplified data
        return [{ category: "Total Revenue", amount: data.totals.revenue }];
    };

    const aggregateExpensesByAccount = () => {
        // If we have actual expense categories from API response, use them
        if (Array.isArray(data.expenses) && data.expenses.length > 0) {
            return data.expenses.map((item) => ({
                account: item.name || item.category || "Expense",
                amount: parseFloat(item.amount || item.value || 0),
            }));
        }

        // Fallback to simplified data
        return [{ account: "Total Expenses", amount: data.totals.expenses }];
    };

    const calculateNetIncome = () => {
        return data.totals.revenue - data.totals.expenses;
    };

    const calculateProfitMargin = () => {
        const revenue = data.totals.revenue;
        if (revenue === 0) return 0;

        const netIncome = calculateNetIncome();
        return (netIncome / revenue) * 100;
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
            doc.text("INCOME STATEMENT", pageWidth / 2, margin + 32, {
                align: "center",
            });

            // Period subtitle
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(
                `For the period ${formatDateForDisplay(
                    startDate
                )} to ${formatDateForDisplay(endDate)}`,
                pageWidth / 2,
                margin + 42,
                { align: "center" }
            );

            // Summary Box
            const summaryStartY = margin + 50;
            const summaryBoxHeight = 40;

            doc.setFillColor(240, 240, 240);
            doc.roundedRect(
                margin,
                summaryStartY,
                contentWidth,
                summaryBoxHeight,
                3,
                3,
                "F"
            );

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(
                "Income Statement Summary",
                margin + 5,
                summaryStartY + 10
            );

            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Total Revenue:", margin + 10, summaryStartY + 20);
            doc.text("Total Expenses:", margin + 10, summaryStartY + 28);
            doc.text("Net Income:", margin + 10, summaryStartY + 36);

            const netIncome = calculateNetIncome();
            const profitMargin = calculateProfitMargin();

            doc.setFont("helvetica", "normal");
            doc.text(
                formatCurrency(data.totals.revenue),
                margin + 60,
                summaryStartY + 20
            );
            doc.text(
                formatCurrency(data.totals.expenses),
                margin + 60,
                summaryStartY + 28
            );

            // Set color based on profit/loss
            if (netIncome >= 0) {
                doc.setTextColor(0, 100, 0); // Dark green for profit
            } else {
                doc.setTextColor(180, 0, 0); // Dark red for loss
            }
            doc.setFont("helvetica", "bold");
            doc.text(
                formatCurrency(netIncome),
                margin + 60,
                summaryStartY + 36
            );
            doc.setTextColor(0, 0, 0); // Reset text color

            // Profit Margin
            doc.setFont("helvetica", "bold");
            doc.text("Profit Margin:", contentWidth - 60, summaryStartY + 36);

            if (profitMargin >= 0) {
                doc.setTextColor(0, 100, 0); // Dark green for positive margin
            } else {
                doc.setTextColor(180, 0, 0); // Dark red for negative margin
            }
            doc.text(
                `${profitMargin.toFixed(2)}%`,
                contentWidth - 10,
                summaryStartY + 36,
                { align: "right" }
            );
            doc.setTextColor(0, 0, 0); // Reset text color

            // Revenue Section
            const revenueStartY = summaryStartY + summaryBoxHeight + 15;

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Revenue Details", pageWidth / 2, revenueStartY, {
                align: "center",
            });

            // Revenue Table
            const revenueData = aggregateRevenueByCategory();
            const revenueTableStartY = revenueStartY + 10;
            const revenueTableColumns = ["Category", "Amount", "% of Total"];

            const revenueTableRows = revenueData.map((item) => [
                item.category,
                formatCurrency(item.amount),
                `${((item.amount / data.totals.revenue) * 100).toFixed(2)}%`,
            ]);

            // Add total row if not already included
            if (
                !revenueData.some((item) => item.category === "Total Revenue")
            ) {
                revenueTableRows.push([
                    "Total Revenue",
                    formatCurrency(data.totals.revenue),
                    "100.00%",
                ]);
            }

            try {
                autoTable(doc, {
                    head: [revenueTableColumns],
                    body: revenueTableRows,
                    startY: revenueTableStartY,
                    margin: { left: margin, right: margin },
                    styles: {
                        fontSize: 9,
                        cellPadding: 4,
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
                    },
                    alternateRowStyles: {
                        fillColor: [245, 245, 245],
                    },
                    tableWidth: contentWidth,
                    didDrawCell: (data) => {
                        // Add special styling to total row
                        if (data.row.index === revenueTableRows.length - 1) {
                            doc.setFont("helvetica", "bold");
                        }
                    },
                });
            } catch (tableError) {
                console.error("Error generating revenue table:", tableError);
            }

            // Expenses Section
            const revenueTableEndY = doc.lastAutoTable
                ? doc.lastAutoTable.finalY
                : revenueTableStartY + 50;
            const expensesStartY = revenueTableEndY + 15;

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Expense Details", pageWidth / 2, expensesStartY, {
                align: "center",
            });

            // Expenses Table
            const expenseData = aggregateExpensesByAccount();
            const expenseTableStartY = expensesStartY + 10;
            const expenseTableColumns = ["Account", "Amount", "% of Total"];

            const expenseTableRows = expenseData.map((item) => [
                item.account,
                formatCurrency(item.amount),
                `${((item.amount / data.totals.expenses) * 100).toFixed(2)}%`,
            ]);

            // Add total row if not already included
            if (
                !expenseData.some((item) => item.account === "Total Expenses")
            ) {
                expenseTableRows.push([
                    "Total Expenses",
                    formatCurrency(data.totals.expenses),
                    "100.00%",
                ]);
            }

            try {
                autoTable(doc, {
                    head: [expenseTableColumns],
                    body: expenseTableRows,
                    startY: expenseTableStartY,
                    margin: { left: margin, right: margin },
                    styles: {
                        fontSize: 9,
                        cellPadding: 4,
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
                    },
                    alternateRowStyles: {
                        fillColor: [245, 245, 245],
                    },
                    tableWidth: contentWidth,
                    didDrawCell: (data) => {
                        // Add special styling to total row
                        if (data.row.index === expenseTableRows.length - 1) {
                            doc.setFont("helvetica", "bold");
                        }
                    },
                });
            } catch (tableError) {
                console.error("Error generating expense table:", tableError);
            }

            // Performance Analysis
            const expenseTableEndY = doc.lastAutoTable
                ? doc.lastAutoTable.finalY
                : expenseTableStartY + 50;
            const analysisStartY = expenseTableEndY + 15;

            // Only add a second page if needed
            if (analysisStartY > pageHeight - 40) {
                doc.addPage();
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text("Performance Analysis", pageWidth / 2, margin + 10, {
                    align: "center",
                });
                const analysisStartY = margin + 20;
            }

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Performance Analysis", pageWidth / 2, analysisStartY, {
                align: "center",
            });

            // Performance Metrics
            const metricsStartY = analysisStartY + 10;
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(margin, metricsStartY, contentWidth, 30, 3, 3, "F");

            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Profit Margin:", margin + 10, metricsStartY + 10);
            doc.text(
                "Revenue to Expense Ratio:",
                margin + 10,
                metricsStartY + 20
            );

            const revToExpRatio =
                data.totals.revenue / (data.totals.expenses || 1);

            doc.setFont("helvetica", "normal");
            if (profitMargin >= 15) {
                doc.setTextColor(0, 128, 0); // Green
                doc.text(
                    `${profitMargin.toFixed(2)}% (Excellent)`,
                    margin + 70,
                    metricsStartY + 10
                );
            } else if (profitMargin >= 5) {
                doc.setTextColor(0, 100, 0); // Dark green
                doc.text(
                    `${profitMargin.toFixed(2)}% (Good)`,
                    margin + 70,
                    metricsStartY + 10
                );
            } else if (profitMargin >= 0) {
                doc.setTextColor(255, 140, 0); // Orange
                doc.text(
                    `${profitMargin.toFixed(2)}% (Fair)`,
                    margin + 70,
                    metricsStartY + 10
                );
            } else {
                doc.setTextColor(220, 0, 0); // Red
                doc.text(
                    `${profitMargin.toFixed(2)}% (Needs Improvement)`,
                    margin + 70,
                    metricsStartY + 10
                );
            }

            if (revToExpRatio >= 1.2) {
                doc.setTextColor(0, 128, 0); // Green
                doc.text(
                    `${revToExpRatio.toFixed(2)} (Excellent)`,
                    margin + 70,
                    metricsStartY + 20
                );
            } else if (revToExpRatio >= 1) {
                doc.setTextColor(0, 100, 0); // Dark green
                doc.text(
                    `${revToExpRatio.toFixed(2)} (Good)`,
                    margin + 70,
                    metricsStartY + 20
                );
            } else if (revToExpRatio >= 0.9) {
                doc.setTextColor(255, 140, 0); // Orange
                doc.text(
                    `${revToExpRatio.toFixed(2)} (Fair)`,
                    margin + 70,
                    metricsStartY + 20
                );
            } else {
                doc.setTextColor(220, 0, 0); // Red
                doc.text(
                    `${revToExpRatio.toFixed(2)} (Needs Improvement)`,
                    margin + 70,
                    metricsStartY + 20
                );
            }

            doc.setTextColor(0, 0, 0); // Reset text color

            // Footer
            const footerY = pageHeight - 10;
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.text(
                `Generated on: ${new Date().toLocaleString()}`,
                margin,
                footerY
            );
            doc.text(`Page 1 of 1`, pageWidth - margin, footerY, {
                align: "right",
            });

            // Save the PDF
            const pdfBlob = doc.output("blob");
            const pdfFile = new File(
                [pdfBlob],
                `income_statement_${formatDateForDisplay(
                    startDate
                )}_to_${formatDateForDisplay(endDate)}.pdf`,
                { type: "application/pdf" }
            );

            // Notify parent component that PDF was generated
            if (onGenerated && typeof onGenerated === "function") {
                onGenerated(URL.createObjectURL(pdfFile));
            }

            // Open the PDF in a new tab
            const fileUrl = URL.createObjectURL(pdfBlob);
            window.open(fileUrl, "_blank");
        } catch (error) {
            console.error("Error generating Income Statement PDF:", error);
            alert("Failed to generate Income Statement PDF. Please try again.");
            if (onGenerated && typeof onGenerated === "function") {
                onGenerated(null, error);
            }
        }
    };

    if (loading) {
        return <div>Generating Income Statement PDF, please wait...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return null;
}
