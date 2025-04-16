import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function PaymentOrderPDF({ paymentOrderId, onGenerated }) {
    const [paymentOrder, setPaymentOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPaymentOrder = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `/api/v1/payment-orders/${paymentOrderId}?include=user,purchaseOrder,purchaseOrder.supplier,purchaseOrder.quotation,logs`
                );
                if (response.data?.data) {
                    const data = response.data.data;
                    console.log("Fetched Payment data:", data);
                    setPaymentOrder(data);
                }
            } catch (error) {
                console.error("Error fetching payment data:", error);
                setError("Failed to load payment order");
            } finally {
                setLoading(false);
            }
        };

        if (paymentOrderId) {
            fetchPaymentOrder();
        }
    }, [paymentOrderId]);

    useEffect(() => {
        if (!loading && !error && paymentOrder) {
            generatePDF();
        }
    }, [paymentOrder, loading, error]);

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
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
            doc.text("PAYMENT ORDER", pageWidth / 2, margin + 32, {
                align: "center",
            });

            const startY = margin + 40;
            const boxHeight = 25;
            const leftBoxWidth = contentWidth * 0.45;
            const rightBoxWidth = contentWidth * 0.45;
            const centerGap = contentWidth * 0.1;

            // Left info box
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(margin, startY, leftBoxWidth, boxHeight, 3, 3, "F");

            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Payment Order #:", margin + 5, startY + 8);
            doc.text("Date:", margin + 5, startY + 18);

            doc.setFont("helvetica", "normal");
            doc.text(
                paymentOrder.payment_order_number || "N/A",
                margin + 40,
                startY + 8
            );
            doc.text(
                formatDateForDisplay(paymentOrder.date),
                margin + 40,
                startY + 18
            );

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
            doc.text("Purchase Order #:", rightBoxX + 5, startY + 8);
            doc.text("Status:", rightBoxX + 5, startY + 18);

            doc.setFont("helvetica", "normal");
            doc.text(
                paymentOrder.purchase_order?.purchase_order_no || "N/A",
                rightBoxX + 40,
                startY + 8
            );
            doc.text(paymentOrder.status || "N/A", rightBoxX + 40, startY + 18);

            // Supplier details section
            const supplierStartY = startY + boxHeight + 5;
            const supplierBoxHeight = 40;

            // Supplier box
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(
                margin,
                supplierStartY,
                leftBoxWidth,
                supplierBoxHeight,
                3,
                3,
                "F"
            );

            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Supplier:", margin + 5, supplierStartY + 8);
            doc.text("Contact:", margin + 5, supplierStartY + 18);
            doc.text("Email:", margin + 5, supplierStartY + 28);
            doc.text("Tax Number:", margin + 5, supplierStartY + 38);

            doc.setFont("helvetica", "normal");
            doc.text(
                paymentOrder.purchase_order?.supplier?.name || "N/A",
                margin + 35,
                supplierStartY + 8
            );
            doc.text(
                paymentOrder.purchase_order?.supplier?.phone || "N/A",
                margin + 35,
                supplierStartY + 18
            );
            doc.text(
                paymentOrder.purchase_order?.supplier?.email || "N/A",
                margin + 35,
                supplierStartY + 28
            );
            doc.text(
                paymentOrder.purchase_order?.supplier?.tax_number || "N/A",
                margin + 35,
                supplierStartY + 38
            );

            // Payment details box
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(
                rightBoxX,
                supplierStartY,
                rightBoxWidth,
                supplierBoxHeight,
                3,
                3,
                "F"
            );

            doc.setFont("helvetica", "bold");
            doc.text("Total Amount:", rightBoxX + 5, supplierStartY + 8);
            doc.text("Paid Amount:", rightBoxX + 5, supplierStartY + 18);
            doc.text("Quotation #:", rightBoxX + 5, supplierStartY + 28);
            doc.text("Payment Terms:", rightBoxX + 5, supplierStartY + 38);

            doc.setFont("helvetica", "normal");
            doc.text(
                paymentOrder.purchase_order?.quotation?.quotation_number ||
                    "N/A",
                rightBoxX + 40,
                supplierStartY + 28
            );
            doc.text(
                paymentOrder.purchase_order?.supplier?.payment_terms || "N/A",
                rightBoxX + 40,
                supplierStartY + 38
            );

            // Title for Payment Details
            const detailsStartY = supplierStartY + supplierBoxHeight + 15;

            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(
                margin,
                detailsStartY - 5,
                pageWidth - margin,
                detailsStartY - 5
            );

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Payment Details", pageWidth / 2, detailsStartY + 5, {
                align: "center",
            });

            // No items for payment order, so create an empty table with header
            const tableStartY = detailsStartY + 15;
            const tableColumns = ["Description", "Reference", "Date", "Amount"];

            // We'll create a single row with the payment details
            const tableRows = [
                [
                    `Payment for PO: ${
                        paymentOrder.purchase_order?.purchase_order_no || "N/A"
                    }`,
                    paymentOrder.payment_order_number || "N/A",
                    formatDateForDisplay(paymentOrder.date),
                    `${parseFloat(
                        paymentOrder.purchase_order?.amount || 0
                    ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`,
                ],
            ];

            // Calculate available width
            const availableWidth = pageWidth - 2 * margin;

            // Add table with error handling
            try {
                const columnWidths = {
                    0: 75, // Description
                    1: 35, // Reference
                    2: 35, // Date
                    3: 35, // Amount
                };

                autoTable(doc, {
                    head: [tableColumns],
                    body: tableRows,
                    startY: tableStartY,
                    margin: { left: margin, right: margin },
                    styles: {
                        fontSize: 9,
                        cellPadding: 3,
                        overflow: "linebreak",
                        lineWidth: 0.1,
                        valign: "middle",
                    },
                    headStyles: {
                        fillColor: [199, 231, 222],
                        textColor: [0, 0, 0],
                        fontStyle: "bold",
                        halign: "center",
                        valign: "middle",
                    },
                    tableWidth: availableWidth,
                    columnStyles: {
                        0: { cellWidth: columnWidths[0] },
                        1: { cellWidth: columnWidths[1], halign: "center" },
                        2: { cellWidth: columnWidths[2], halign: "center" },
                        3: { cellWidth: columnWidths[3], halign: "right" },
                    },
                    didDrawPage: (data) => {
                        // Add header to continued pages
                        if (data.pageNumber > 1) {
                            doc.setFontSize(10);
                            doc.setFont("helvetica", "bold");
                            doc.text(
                                `Payment Order #: ${
                                    paymentOrder.payment_order_number || "N/A"
                                }`,
                                margin,
                                margin + 10
                            );
                            doc.text("(Continued)", margin, margin + 15);

                            // Add line below header
                            doc.setDrawColor(200, 200, 200);
                            doc.setLineWidth(0.3);
                            doc.line(
                                margin,
                                margin + 20,
                                pageWidth - margin,
                                margin + 20
                            );

                            // Adjust table starting position
                            data.settings.startY = margin + 25;
                        }

                        // Format current date
                        const today = new Date();
                        const day = today.getDate().toString().padStart(2, "0");
                        const month = (today.getMonth() + 1)
                            .toString()
                            .padStart(2, "0");
                        const year = today.getFullYear();
                        const formattedDate = `${day}/${month}/${year}`;

                        // Add footer
                        doc.setFontSize(8);
                        doc.setFont("helvetica", "normal");
                        doc.text(
                            `Generated on: ${formattedDate}`,
                            margin,
                            pageHeight - margin
                        );
                        doc.text(
                            `Page ${data.pageNumber} of ${data.pageCount || 1}`,
                            pageWidth / 2,
                            pageHeight - margin,
                            { align: "center" }
                        );
                        doc.text(
                            "This is an official document of Maharat MCTC",
                            pageWidth - margin,
                            pageHeight - margin,
                            { align: "right" }
                        );
                    },
                    showFoot: "everyPage",
                });
            } catch (tableError) {
                console.error("Error generating table:", tableError);
            }

            // Add Bank Details section
            const tableResult = doc.lastAutoTable || {
                finalY: tableStartY + 30,
            };
            const finalY = tableResult.finalY + 15;

            // Add separator line
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(margin, finalY - 5, pageWidth - margin, finalY - 5);

            // Define signatureY variable - this was missing in the original code
            const signatureY = finalY + 40;

            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Authorized by:", margin, signatureY + 15);
            doc.text("Received by:", pageWidth - margin - 50, signatureY + 15);

            // Signature lines
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(margin, signatureY + 30, margin + 70, signatureY + 30);
            doc.line(
                pageWidth - margin - 70,
                signatureY + 30,
                pageWidth - margin,
                signatureY + 30
            );

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(paymentOrder.user?.name || "N/A", margin, signatureY + 40);
            doc.text(
                "Supplier Representative",
                pageWidth - margin - 50,
                signatureY + 40
            );

            // Add footer on last page
            const today = new Date();
            const day = today.getDate().toString().padStart(2, "0");
            const month = (today.getMonth() + 1).toString().padStart(2, "0");
            const year = today.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(
                `Generated on: ${formattedDate}`,
                margin,
                pageHeight - margin
            );
            doc.text(
                `Page ${doc.getNumberOfPages()} of ${doc.getNumberOfPages()}`,
                pageWidth / 2,
                pageHeight - margin,
                {
                    align: "center",
                }
            );
            doc.text(
                "This is an official document of Maharat MCTC",
                pageWidth - margin,
                pageHeight - margin,
                {
                    align: "right",
                }
            );

            // Save the PDF
            const pdfBlob = doc.output("blob");
            const pdfFile = new File(
                [pdfBlob],
                `payment_order_${paymentOrder.payment_order_number}.pdf`,
                { type: "application/pdf" }
            );

            // Open the PDF in a new tab
            const fileUrl = URL.createObjectURL(pdfBlob);
            window.open(fileUrl, "_blank");

            // Save to server
            const formData = new FormData();
            formData.append("payment_document", pdfFile);

            try {
                const uploadResponse = await axios.post(
                    `/api/v1/payment-orders/${paymentOrderId}/upload-document`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                if (uploadResponse.data?.success) {
                    if (onGenerated && typeof onGenerated === "function") {
                        onGenerated(uploadResponse.data?.document_url);
                    }
                } else {
                    console.warn("Document generated but not saved to server");
                    if (onGenerated && typeof onGenerated === "function") {
                        onGenerated(fileUrl); // Still return the local URL
                    }
                }
            } catch (uploadError) {
                console.error("Error uploading document:", uploadError);
                // Still return the local URL even if upload fails
                if (onGenerated && typeof onGenerated === "function") {
                    onGenerated(fileUrl);
                }
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
        return <div>Generating PDF, please wait...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return null;
}
