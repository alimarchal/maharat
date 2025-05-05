import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function PurchaseOrderPDF({ purchaseOrderId, onGenerated }) {
    const [purchaseOrder, setPurchaseOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPurchaseOrder = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `/api/v1/purchase-orders/${purchaseOrderId}?include=department,costCenter,subCostCenter,warehouse,quotation,supplier,user,requestForQuotation.items.product.category,requestForQuotation.items.product.unit`
                );
                if (response.data?.data) {
                    const data = response.data.data;
                    setPurchaseOrder(data);
                }
            } catch (error) {
                console.error("Error fetching purchase order data:", error);
                setError("Failed to load purchase order");
            } finally {
                setLoading(false);
            }
        };

        if (purchaseOrderId) {
            fetchPurchaseOrder();
        }
    }, [purchaseOrderId]);

    useEffect(() => {
        if (!loading && !error && purchaseOrder) {
            generatePDF();
        }
    }, [purchaseOrder, loading, error]);

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
            doc.text("PURCHASE ORDER", pageWidth / 2, margin + 32, {
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
            doc.text("Purchase Order #:", margin + 5, startY + 8);
            doc.text("Date:", margin + 5, startY + 18);

            doc.setFont("helvetica", "normal");
            doc.text(
                purchaseOrder.purchase_order_no || "N/A",
                margin + 40,
                startY + 8
            );
            doc.text(
                formatDateForDisplay(purchaseOrder.purchase_order_date),
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
            doc.text("Quotation #:", rightBoxX + 5, startY + 8);
            doc.text("Status:", rightBoxX + 5, startY + 18);

            doc.setFont("helvetica", "normal");
            doc.text(
                purchaseOrder.quotation?.quotation_number || "N/A",
                rightBoxX + 40,
                startY + 8
            );
            doc.text(
                purchaseOrder.status || "N/A",
                rightBoxX + 40,
                startY + 18
            );

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
                purchaseOrder.supplier?.name || "N/A",
                margin + 35,
                supplierStartY + 8
            );
            doc.text(
                purchaseOrder.supplier?.phone || "N/A",
                margin + 35,
                supplierStartY + 18
            );
            doc.text(
                purchaseOrder.supplier?.email || "N/A",
                margin + 35,
                supplierStartY + 28
            );
            doc.text(
                purchaseOrder.supplier?.tax_number || "N/A",
                margin + 35,
                supplierStartY + 38
            );

            // Company details box
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
            doc.text("Company:", rightBoxX + 5, supplierStartY + 8);
            doc.text("Contact:", rightBoxX + 5, supplierStartY + 18);
            doc.text("Email:", rightBoxX + 5, supplierStartY + 28);
            doc.text("VAT Number:", rightBoxX + 5, supplierStartY + 38);

            doc.setFont("helvetica", "normal");
            doc.text(
                purchaseOrder.quotation?.rfq?.company?.name || "Maharat",
                rightBoxX + 35,
                supplierStartY + 8
            );
            doc.text(
                purchaseOrder.quotation?.rfq?.contact_number || "N/A",
                rightBoxX + 35,
                supplierStartY + 18
            );
            doc.text(
                purchaseOrder.quotation?.rfq?.organization_email || "N/A",
                rightBoxX + 35,
                supplierStartY + 28
            );
            doc.text(
                purchaseOrder.quotation?.rfq?.company?.vat_no || "N/A",
                rightBoxX + 35,
                supplierStartY + 38
            );

            // Order Terms section
            const termsStartY = supplierStartY + supplierBoxHeight + 5;
            const termsBoxHeight = 30;

            // Left terms box
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(
                margin,
                termsStartY,
                leftBoxWidth,
                termsBoxHeight,
                3,
                3,
                "F"
            );

            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Issue Date:", margin + 5, termsStartY + 8);
            doc.text("Expiry Date:", margin + 5, termsStartY + 18);
            doc.text("Total Amount:", margin + 5, termsStartY + 28);

            doc.setFont("helvetica", "normal");
            doc.text(
                formatDateForDisplay(purchaseOrder.purchase_order_date),
                margin + 40,
                termsStartY + 8
            );
            doc.text(
                formatDateForDisplay(purchaseOrder.expiry_date),
                margin + 40,
                termsStartY + 18
            );
            doc.text(
                `${parseFloat(purchaseOrder.amount || 0).toLocaleString(
                    undefined,
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }
                )}`,
                margin + 40,
                termsStartY + 28
            );
            
            // Right terms box
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(
                rightBoxX,
                termsStartY,
                rightBoxWidth,
                termsBoxHeight,
                3,
                3,
                "F"
            );

            doc.setFont("helvetica", "bold");
            doc.text("RFQ #:", rightBoxX + 5, termsStartY + 8);
            doc.text(
                "Expected Delivery:",
                rightBoxX + 5,
                termsStartY + 18
            );
            doc.text(
                "Payment Terms:",
                rightBoxX + 5,
                termsStartY + 28
            );

            doc.setFont("helvetica", "normal");
            doc.text(
                purchaseOrder.quotation?.rfq?.rfq_number || "N/A",
                rightBoxX + 40,
                termsStartY + 8
            );
            doc.text(
                formatDateForDisplay(
                    purchaseOrder.quotation?.rfq?.expected_delivery_date
                ),
                rightBoxX + 40,
                termsStartY + 18
            );
            doc.text(
                purchaseOrder.supplier?.payment_terms || "Standard 30 days",
                rightBoxX + 40,
                termsStartY + 28
            );

            // Title for Order Items
            const detailsStartY = termsStartY + termsBoxHeight + 15;

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
            doc.text("Order Items", pageWidth / 2, detailsStartY, {
                align: "center",
            });

            // Order items table
            const tableStartY = detailsStartY + 10;
            const tableColumns = [
                "Item",
                "Description",
                "Quantity",
                "Unit Price",
                "Total",
            ];

            // If we have items in the PO
            const orderItems = purchaseOrder.items || [];
            const tableRows = orderItems.length
                ? orderItems.map((item) => [
                      item.name || "N/A",
                      item.description || "N/A",
                      item.quantity?.toString() || "0",
                      parseFloat(item.unit_price || 0).toLocaleString(
                          undefined,
                          {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                          }
                      ),
                      parseFloat(
                          (item.quantity || 0) * (item.unit_price || 0)
                      ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                      }),
                  ])
                : [
                      [
                          "Purchase Order Items",
                          "As per quotation",
                          "1",
                          purchaseOrder.amount || "0.00",
                          purchaseOrder.amount || "0.00",
                      ],
                  ];

            // Calculate available width
            const availableWidth = pageWidth - 2 * margin;

            // Add table with error handling
            try {
                const columnWidths = {
                    0: 30, // Item
                    1: 70, // Description
                    2: 20, // Quantity
                    3: 30, // Unit Price
                    4: 30, // Total
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
                        1: { cellWidth: columnWidths[1] },
                        2: { cellWidth: columnWidths[2], halign: "center" },
                        3: { cellWidth: columnWidths[3], halign: "right" },
                        4: { cellWidth: columnWidths[4], halign: "right" },
                    },
                    didDrawPage: (data) => {
                        // Add header to continued pages
                        if (data.pageNumber > 1) {
                            doc.setFontSize(10);
                            doc.setFont("helvetica", "bold");
                            doc.text(
                                `Purchase Order #: ${
                                    purchaseOrder.purchase_order_no || "N/A"
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
                            `Page ${data.pageNumber} of ${data.pageCount || doc.getNumberOfPages()}`,
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
                    willDrawCell: (data) => {
                        // Add constraints to cell height to prevent very tall cells
                        if (data.row.height > 20) {
                            data.row.height = 20;
                        }
                    }
                });
            } catch (tableError) {
                console.error("Error generating table:", tableError);
            }

            // Get the table result and handle potential page breaks
            let tableResult = doc.lastAutoTable || {
                finalY: tableStartY + 30,
            };
            let finalY = tableResult.finalY;

            // Add total amount after table
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Total Amount:", pageWidth - margin - 60, finalY + 10);
            doc.text(
                `${parseFloat(purchaseOrder.amount || 0).toLocaleString(
                    undefined,
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }
                )}`,
                pageWidth - margin,
                finalY + 10,
                { align: "right" }
            );

            // Calculate space needed for remaining sections
            const spaceNeeded = 120; // Approximate space needed for terms, notes and signatures
            const remainingSpace = pageHeight - (finalY + 15);

            // If not enough space, add a new page
            if (remainingSpace < spaceNeeded) {
                doc.addPage();
                finalY = margin;
            }

            // Add Terms and Conditions section
            const termsY = finalY + 20;

            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(margin, termsY, pageWidth - margin, termsY);

            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Terms and Conditions:", margin, termsY + 10);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            
            // Handle terms and conditions text wrapping
            const termsText = purchaseOrder.quotation?.terms_and_conditions ||
                "Standard terms and conditions apply to this purchase order.";
            const termsLines = doc.splitTextToSize(termsText, pageWidth - 2 * margin);
            doc.text(termsLines, margin, termsY + 20);

            // Calculate next Y position after terms text
            const termsEndY = termsY + 20 + (termsLines.length * 5);

            // Add Notes section
            const notesY = termsEndY + 10;

            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Notes:", margin, notesY);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            
            // Handle notes text wrapping
            const notesText = purchaseOrder.quotation?.notes ||
                "Please acknowledge receipt of this purchase order.";
            const notesLines = doc.splitTextToSize(notesText, pageWidth - 2 * margin);
            doc.text(notesLines, margin, notesY + 10);

            // Calculate next Y position after notes text
            const notesEndY = notesY + 10 + (notesLines.length * 5);

            // Check if we need to add another page for signatures
            const signatureSpaceNeeded = 50;
            if (pageHeight - notesEndY < signatureSpaceNeeded) {
                doc.addPage();
                // Define signature section at top of new page
                var signatureY = margin;
            } else {
                // Define signature section
                var signatureY = notesEndY + 20;
            }

            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Authorized by:", margin, signatureY + 10);
            doc.text("Received by:", pageWidth - margin - 50, signatureY + 10);

            // Signature lines
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(margin, signatureY + 25, margin + 70, signatureY + 25);
            doc.line(
                pageWidth - margin - 70,
                signatureY + 25,
                pageWidth - margin,
                signatureY + 25
            );

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(
                purchaseOrder.user?.name || "N/A",
                margin,
                signatureY + 35
            );
            doc.text(
                "Supplier Representative",
                pageWidth - margin - 50,
                signatureY + 35
            );

            // Add footer on last page
            const today = new Date();
            const day = today.getDate().toString().padStart(2, "0");
            const month = (today.getMonth() + 1).toString().padStart(2, "0");
            const year = today.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;

            const totalPages = doc.getNumberOfPages();
            const currentPage = totalPages;

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(
                `Generated on: ${formattedDate}`,
                margin,
                pageHeight - margin
            );
            doc.text(
                `Page ${currentPage} of ${totalPages}`,
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
                `purchase_order_${purchaseOrder.purchase_order_no}.pdf`,
                { type: "application/pdf" }
            );

            // Open the PDF in a new tab
            const fileUrl = URL.createObjectURL(pdfBlob);
            window.open(fileUrl, "_blank");

            // Save to server
            const formData = new FormData();
            formData.append("purchase_order_document", pdfFile);
            formData.append("update_attachment", false); // Don't update the attachment column, only generated_document

            try {
                console.log(`Uploading PDF to: /api/v1/purchase-orders/${purchaseOrderId}/upload-document`);
                const uploadResponse = await axios.post(
                    `/api/v1/purchase-orders/${purchaseOrderId}/upload-document`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                if (uploadResponse.data?.success) {
                    console.log("Document uploaded successfully:", uploadResponse.data);
                    if (onGenerated && typeof onGenerated === "function") {
                        onGenerated(uploadResponse.data?.document_url);
                    }
                } else {
                    console.warn("Document generated but not saved to server:", uploadResponse.data);
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
