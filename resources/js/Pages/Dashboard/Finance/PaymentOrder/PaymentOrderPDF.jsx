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
                
                console.log("⚠️ Fetching payment order with ID:", paymentOrderId);
                
                // CRITICAL FIX: The API is missing fields from PaymentOrderResource
                // Make a direct fetch to get the raw payment order data
                const rawDataResponse = await axios.get(
                    `/api/v1/payment-orders/${paymentOrderId}/raw-data`
                );
                
                // If the raw data endpoint fails, fall back to standard API
                if (!rawDataResponse.data || !rawDataResponse.data.data) {
                    console.warn("Raw data endpoint failed, falling back to standard API");
                    // Original API call as fallback
                    const response = await axios.get(
                        `/api/v1/payment-orders/${paymentOrderId}?include=user,purchaseOrder,purchaseOrder.supplier,purchaseOrder.quotation,logs`
                    );
                    
                    if (response.data?.data) {
                        const data = response.data.data;
                        console.log("⚠️ Using standard API data");
                        
                        // Fix missing issue_date by checking for date field
                        if (!data.issue_date && data.date) {
                            console.log("Using date field instead of issue_date");
                            data.issue_date = data.date;
                        }
                        
                        setPaymentOrder(data);
                    }
                } else {
                    // Use the raw data that includes all database fields
                    const rawData = rawDataResponse.data.data;
                    console.log("✅ Using raw payment order data with all fields:", rawData);
                    
                    // Fix missing issue_date by checking for date field
                    if (!rawData.issue_date && rawData.date) {
                        console.log("Using date field instead of issue_date");
                        rawData.issue_date = rawData.date;
                    }
                    
                    setPaymentOrder(rawData);
                }
            } catch (error) {
                console.error("Error fetching payment data:", error);
                
                // Last resort fallback - try direct fetch without the raw-data endpoint
                try {
                    console.warn("Attempting last resort fallback to standard API");
                    const standardResponse = await axios.get(
                        `/api/v1/payment-orders/${paymentOrderId}?include=user,purchaseOrder,purchaseOrder.supplier,purchaseOrder.quotation,logs`
                    );
                    
                    if (standardResponse.data?.data) {
                        setPaymentOrder(standardResponse.data.data);
                    } else {
                        setError("Failed to load payment order data");
                    }
                } catch (fallbackError) {
                    console.error("Fallback also failed:", fallbackError);
                    setError("Failed to load payment order");
                }
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
            // Add pre-generation debug
            console.log("About to generate PDF with data:", {
                payment_order_number: paymentOrder.payment_order_number,
                issue_date: paymentOrder.issue_date,
                status: paymentOrder.status,
                payment_type: paymentOrder.payment_type,
                total_amount: paymentOrder.total_amount,
                paid_amount: paymentOrder.paid_amount
            });
            
            generatePDF();
        }
    }, [paymentOrder, loading, error]);

    const formatDateForDisplay = (dateString) => {
        if (!dateString) {
            console.log("Date is empty");
            return "N/A";
        }
        
        // Debug the date string coming in
        console.log("📅 Formatting date:", dateString, "type:", typeof dateString);
        
        try {
            // Try to construct a date safely with more formats
            let date;
            
            // Handle string dates
            if (typeof dateString === 'string') {
                // Try MySQL format (YYYY-MM-DD)
                if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
                    // Make sure we handle timezone issues by forcing midnight UTC
                    const parts = dateString.split('-');
                    date = new Date(Date.UTC(
                        parseInt(parts[0], 10),
                        parseInt(parts[1], 10) - 1,
                        parseInt(parts[2], 10)
                    ));
                    console.log("Parsed MySQL date:", date);
                } else {
                    // Try other formats
                    date = new Date(dateString);
                    console.log("Parsed general date:", date);
                }
            } else {
                date = new Date(dateString);
                console.log("Parsed non-string date:", date);
            }
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.log("⚠️ Invalid date:", dateString);
                return "N/A";
            }
            
            // Format the date
            const day = date.getDate().toString().padStart(2, "0");
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const year = date.getFullYear();
            
            const formatted = `${day}/${month}/${year}`;
            console.log("✅ Formatted date:", formatted);
            return formatted;
        } catch (error) {
            console.error("Error formatting date:", error);
            return "N/A";
        }
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

            // Debug issue_date field specifically
            console.log("📅 PDF issue_date:", {
                issue_date: paymentOrder.issue_date,
                type: typeof paymentOrder.issue_date,
                formatted: formatDateForDisplay(paymentOrder.issue_date)
            });
            
            // Try to get the most reliable date
            let displayDate;
            if (paymentOrder.issue_date) {
                displayDate = formatDateForDisplay(paymentOrder.issue_date);
            } else if (paymentOrder.date) {
                displayDate = formatDateForDisplay(paymentOrder.date);
            } else if (paymentOrder.created_at) {
                displayDate = formatDateForDisplay(paymentOrder.created_at);
            } else {
                displayDate = "N/A";
            }
            
            doc.setFont("helvetica", "normal");
            doc.text(
                paymentOrder.payment_order_number || "N/A",
                margin + 40,
                startY + 8
            );
            doc.text(displayDate, margin + 40, startY + 18);

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

            // Debug status field in extreme detail with actual database field name
            console.log("🔴 PAYMENT ORDER FIELDS FROM DATABASE:");
            console.log("Available fields:", Object.keys(paymentOrder));

            // DIRECT ACCESS from payment_orders table
            const statusText = paymentOrder.status || "N/A";
            console.log("Status field direct access:", statusText);

            doc.setFont("helvetica", "normal");
            doc.text(
                paymentOrder.purchase_order?.purchase_order_no || "N/A",
                rightBoxX + 40,
                startY + 8
            );
            doc.text(statusText, rightBoxX + 40, startY + 18);

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

            // Format currency values
            const formatCurrency = (value) => {
                console.log("Currency value input:", value, typeof value);
                if (value === null || value === undefined) return 'N/A';
                return `SAR ${parseFloat(value).toFixed(2)}`;
            };

            // DIRECT ACCESS from payment_orders table
            console.log("🔹 PAYMENT DETAILS DIRECT ACCESS:");
            console.log({
                total_amount: paymentOrder.total_amount,
                paid_amount: paymentOrder.paid_amount,
                payment_type: paymentOrder.payment_type
            });

            // Use the direct fields from payment_orders table
            const totalAmount = paymentOrder.total_amount;
            const paidAmount = paymentOrder.paid_amount;
            const paymentType = paymentOrder.payment_type;

            console.log("Final values:", {
                totalAmount,
                paidAmount,
                paymentType
            });

            doc.setFont("helvetica", "normal");
            // Total Amount
            doc.text(
                formatCurrency(totalAmount),
                rightBoxX + 40,
                supplierStartY + 8
            );
            
            // Paid Amount
            doc.text(
                formatCurrency(paidAmount),
                rightBoxX + 40,
                supplierStartY + 18
            );
            
            // Quotation Number
            doc.text(
                paymentOrder.purchase_order?.quotation?.quotation_number ||
                    "N/A",
                rightBoxX + 40,
                supplierStartY + 28
            );
            
            // Payment Terms (from payment_type)
            doc.text(
                paymentType || "N/A",
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
                    displayDate,
                    formatCurrency(totalAmount),
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
            const pdfFileName = `payment_order_${paymentOrder.payment_order_number}.pdf`;
            const pdfFile = new File(
                [pdfBlob],
                pdfFileName,
                { type: "application/pdf" }
            );

            // Open the PDF in a new tab
            const fileUrl = URL.createObjectURL(pdfBlob);
            window.open(fileUrl, "_blank");

            console.log("PDF Generated:", {
                fileName: pdfFileName,
                fileSize: pdfFile.size,
                fileType: pdfFile.type
            });

            // Upload the PDF file to the server and save in the attachment column
            const formData = new FormData();
            formData.append("attachment", pdfFile);
            
            console.log("FormData:", {
                hasAttachment: formData.has("attachment"),
                fileName: pdfFile.name,
                fileSize: pdfFile.size
            });

            try {
                console.log("Uploading PDF to server to save in attachment column");
                
                // First, upload the file using a POST request to a dedicated endpoint
                const uploadResponse = await axios.post(
                    `/api/v1/payment-orders/${paymentOrderId}/save-attachment`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                console.log("Upload Response:", uploadResponse.data);

                if (uploadResponse.data?.success) {
                    const documentPath = uploadResponse.data?.file_path;
                    console.log("Document saved at path:", documentPath);
                    
                    if (onGenerated && typeof onGenerated === "function") {
                        onGenerated(documentPath);
                    }
                } else {
                    console.warn("Document generated but not saved to server:", uploadResponse.data);
                    // Fall back to local URL
                    if (onGenerated && typeof onGenerated === "function") {
                        onGenerated(fileUrl);
                    }
                }
            } catch (uploadError) {
                console.error("Error saving PDF to server:", uploadError);
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
