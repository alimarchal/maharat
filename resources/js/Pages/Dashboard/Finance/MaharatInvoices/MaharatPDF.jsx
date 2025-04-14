import React, { useEffect, useState, useRef } from "react";
import { Head } from "@inertiajs/react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import QRCode from "qrcode";

export default function MaharatPDF({ invoiceId, onGenerated }) {
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [companyDetails, setCompanyDetails] = useState({});

    useEffect(() => {
        const fetchInvoiceData = async () => {
            try {
                setLoading(true);
                // Include all related data in the request
                const response = await axios.get(`/api/v1/invoices/${invoiceId}?include=items,client`);
                
                if (response.data?.data) {
                    const data = response.data.data;
                    console.log("Fetched Invoice data:", data);
                    
                    // Fetch company details
                    try {
                        const companyResponse = await axios.get("/api/v1/companies/1?include=currency");
                        if (companyResponse.data?.data) {
                            setCompanyDetails(companyResponse.data.data);
                        }
                    } catch (companyErr) {
                        console.error("Error fetching company details:", companyErr);
                    }
                    
                    // Fetch client details directly to ensure complete data
                    if (data.client_id) {
                        try {
                            const clientResponse = await axios.get(`/api/v1/customers/${data.client_id}`);
                            if (clientResponse.data?.data) {
                                // Merge client data with invoice data for easier access
                                data.clientDetails = clientResponse.data.data;
                            }
                        } catch (clientErr) {
                            console.error("Error fetching detailed client data:", clientErr);
                        }
                    }
                    
                    // Fetch representative details if available
                    if (data.representative_id) {
                        try {
                            const userResponse = await axios.get(`/api/v1/users/${data.representative_id}`);
                            if (userResponse.data?.data) {
                                data.representativeDetails = userResponse.data.data;
                            }
                        } catch (userErr) {
                            console.error("Error fetching representative details:", userErr);
                        }
                    }
                    
                    setInvoiceData(data);
                } else {
                    setError("Invalid response format");
                }
            } catch (error) {
                console.error("Error fetching Invoice data:", error);
                setError("Failed to load Invoice data");
            } finally {
                setLoading(false);
            }
        };

        if (invoiceId) {
            fetchInvoiceData();
        }
    }, [invoiceId]);

    useEffect(() => {
        if (!loading && !error && invoiceData) {
            generatePDF();
        }
    }, [invoiceData, loading, error]);

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    };
    
    // Safe value getter helper function
    const getSafeValue = (obj, path, defaultValue = "N/A") => {
        try {
            if (!obj) return defaultValue;
            
            const keys = path.split('.');
            let result = obj;
            
            for (const key of keys) {
                if (result === undefined || result === null) return defaultValue;
                result = result[key];
            }
            
            return result === undefined || result === null || result === "" 
                ? defaultValue 
                : result;
        } catch (e) {
            console.warn(`Error getting value at path ${path}:`, e);
            return defaultValue;
        }
    };

    const generatePDF = async () => {
        try {
            console.log("Generating PDF with data:", invoiceData);
            
            // Create a new jsPDF instance - A4 size in portrait
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // A4 size dimensions
            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 15;
            const contentWidth = pageWidth - (margin * 2);
            
            // Add autoTable plugin
            autoTable(doc, { /* empty config to ensure plugin is loaded */ });
            
            // Add Maharat logo at the top center
            try {
                const img = new Image();
                img.src = '/images/MCTC Logo.png';
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    // Set a timeout in case the image loading hangs
                    setTimeout(resolve, 3000);
                });
                
                // Calculate appropriate dimensions
                const logoHeight = 20;
                const logoWidth = 48;
                
                // Position logo at the top center
                doc.addImage(img, 'PNG', (pageWidth - logoWidth) / 2, margin, logoWidth, logoHeight);
            } catch (imgErr) {
                console.error("Error adding logo:", imgErr);
                // Continue without the logo
            }
            
            // Company details in header - left aligned instead of centered
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(companyDetails.name || "Maharat MCTC", margin, margin + 30);
            
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(`Address: ${companyDetails.address || "N/A"}`, margin, margin + 36);
            doc.text(`Mobile: ${companyDetails.contact_number || "N/A"}`, margin, margin + 41);
            doc.text(`VAT No: ${companyDetails.vat_no || "N/A"}`, margin, margin + 46);
            doc.text(`CR No: ${companyDetails.cr_no || "N/A"}`, margin, margin + 51);
            
            // Reposition QR code to be at the same level as the company name but right-aligned
            try {
                // Generate QR code content similar to CreateMaharatInvoice.jsx
                const qrCodeData = JSON.stringify({
                    seller: companyDetails?.name || "",
                    seller_vat: companyDetails?.vat_no || "",
                    invoice_no: invoiceData.invoice_number || "",
                    date: invoiceData.issue_date || new Date().toISOString(),
                    total_amount: invoiceData.total_amount || "",
                    currency: companyDetails?.currency?.name || "",
                    buyer_vat: invoiceData.clientDetails?.vat_number || invoiceData.client?.vat_number || "",
                });
                const qrCodeText = btoa(qrCodeData);
                
                // Create a simple canvas element
                const qrCanvas = document.createElement('canvas');
                qrCanvas.width = 120;
                qrCanvas.height = 120;
                
                // Use QRCode.toCanvas with a timeout to prevent hanging
                const generateQrPromise = QRCode.toCanvas(qrCanvas, qrCodeText, {
                    width: 120,
                    margin: 0,
                    errorCorrectionLevel: 'M'
                });
                
                // Add a timeout to prevent infinite waiting
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("QR code generation timed out")), 2000);
                });
                
                // Race between QR generation and timeout
                await Promise.race([generateQrPromise, timeoutPromise]);
                
                // If we get here, QR generation succeeded within the timeout
                const qrDataUrl = qrCanvas.toDataURL('image/png');
                
                // Add QR code image to PDF - smaller size to align with company text
                doc.addImage(
                    qrDataUrl, 
                    'PNG', 
                    pageWidth - margin - 25, 
                    margin + 26, 
                    25, 
                    25
                );
            } catch (qrError) {
                console.error("Error generating QR code:", qrError);
                // Fallback to placeholder - use a simple rounded rectangle instead - smaller size
                doc.setDrawColor(200, 200, 200);
                doc.setFillColor(240, 240, 240);
                doc.roundedRect(pageWidth - margin - 25, margin + 20, 25, 25, 2, 2, 'FD');
                doc.setFontSize(6);
                doc.setTextColor(100, 100, 100);
                doc.text("QR Code", pageWidth - margin - 12.5, margin + 35, { align: "center" });
                doc.setTextColor(0, 0, 0);
            }
            
            // Add a title section for VAT Invoice - REDUCED SPACE
            doc.setFillColor(199, 231, 222); // #C7E7DE
            doc.roundedRect(margin, margin + 56, contentWidth, 10, 5, 5, 'F');
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("VAT INVOICE", pageWidth / 2, margin + 63, { align: "center" });

            // Adjust the invoice details section - reduce width to avoid empty space
            // REDUCED SPACING BETWEEN VAT INVOICE AND GRAY BOXES
            const startY = margin + 70; // Reduced from 75
            const boxHeight = 25; // Reduced height
            const leftBoxWidth = contentWidth * 0.45; // 45% of content width
            const rightBoxWidth = contentWidth * 0.45; // 45% of content width
            const centerGap = contentWidth * 0.1; // 10% gap in the middle
            
            // Left box - Invoice details - REDUCED INTERNAL PADDING
            doc.setFillColor(240, 240, 240); // Light gray
            doc.roundedRect(margin, startY, leftBoxWidth, boxHeight, 3, 3, 'F');
            
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Invoice #:", margin + 5, startY + 8); // Reduced from +10
            doc.text("Invoice Date:", margin + 5, startY + 18); // Reduced from +20
            
            // Align values closer to labels - MOVE VALUES CLOSER TO LABELS
            doc.setFont("helvetica", "normal");
            doc.text(invoiceData.invoice_number || "N/A", margin + 30, startY + 8); // Moved closer to label
            doc.text(formatDateForDisplay(invoiceData.issue_date), margin + 30, startY + 18);
            
            // Right box - Payment details - REDUCED INTERNAL PADDING
            const rightBoxX = margin + leftBoxWidth + centerGap;
            doc.setFillColor(240, 240, 240); // Light gray
            doc.roundedRect(rightBoxX, startY, rightBoxWidth, boxHeight, 3, 3, 'F');
            
            doc.setFont("helvetica", "bold");
            doc.text("Payment:", rightBoxX + 5, startY + 8); // Reduced from +10
            doc.text("VAT Rate (%):", rightBoxX + 5, startY + 18); // Reduced from +20
            
            // Align values closer to labels - MOVE VALUES CLOSER TO LABELS
            doc.setFont("helvetica", "normal");
            doc.text(invoiceData.payment_method || "N/A", rightBoxX + 30, startY + 8); // Moved closer to label
            doc.text(invoiceData.vat_rate ? invoiceData.vat_rate.toString() : "N/A", rightBoxX + 30, startY + 18);

            // Client details section - REDUCED GAP AND INTERNAL PADDING
            const clientStartY = startY + boxHeight + 3; // reduced gap even more
            const clientBoxHeight = 40; // Reduced from 45
            
            // Left box - Client details
            doc.setFillColor(240, 240, 240); // Light gray
            doc.roundedRect(margin, clientStartY, leftBoxWidth, clientBoxHeight, 3, 3, 'F');
            
            // Get client data from enhanced invoice data with proper fallbacks
            const clientDetails = invoiceData.clientDetails || {};
            const representativeDetails = invoiceData.representativeDetails || {};
            
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Client:", margin + 5, clientStartY + 8);
            
            doc.setFont("helvetica", "normal");
            doc.text(clientDetails.name || client?.name || 'N/A', margin + 35, clientStartY + 8);
            
            doc.setFont("helvetica", "bold");
            doc.text("Representative:", margin + 5, clientStartY + 18);
            
            // Use representative name if available
            let representativeName = "N/A";
            if (representativeDetails.name) {
                representativeName = representativeDetails.name;
            } else if (invoiceData.representative_id) {
                representativeName = `ID: ${invoiceData.representative_id}`;
            }
            
            doc.setFont("helvetica", "normal");
            doc.text(representativeName, margin + 35, clientStartY + 18);
            
            doc.setFont("helvetica", "bold");
            doc.text("Address:", margin + 5, clientStartY + 28);
            
            doc.setFont("helvetica", "normal");
            doc.text(clientDetails.address || client?.address || 'N/A', margin + 35, clientStartY + 28);
            
            // Right box - Client VAT and contact - REDUCED INTERNAL PADDING
            doc.setFillColor(240, 240, 240); // Light gray
            doc.roundedRect(rightBoxX, clientStartY, rightBoxWidth, clientBoxHeight, 3, 3, 'F');
            
            doc.setFont("helvetica", "bold");
            doc.text("CR No:", rightBoxX + 5, clientStartY + 8);
            doc.text("VAT No:", rightBoxX + 5, clientStartY + 18);
            doc.text("Contact No:", rightBoxX + 5, clientStartY + 28);
            doc.text("Email:", rightBoxX + 5, clientStartY + 38);
            
            // Align values closer to labels - MOVE VALUES CLOSER TO LABELS
            doc.setFont("helvetica", "normal");
            doc.text(clientDetails.cr_no || client?.cr_no || 'N/A', rightBoxX + 28, clientStartY + 8);
            doc.text(clientDetails.vat_number || client?.vat_number || 'N/A', rightBoxX + 28, clientStartY + 18);
            doc.text(clientDetails.contact_number || client?.contact_number || 'N/A', rightBoxX + 28, clientStartY + 28);
            doc.text(clientDetails.email || client?.email || 'N/A', rightBoxX + 28, clientStartY + 38);

            // Client details section complete
            
            // Invoice Items section
            // Add more space before invoice items section
            const itemsStartY = clientStartY + 50; // REDUCED FROM 65: Less space before the items section
            
            // Add a black horizontal line above the title
            doc.setDrawColor(0);
            doc.setLineWidth(0.3);
            doc.line(margin, itemsStartY, pageWidth - margin, itemsStartY);
            
            // Increase space after line before title
            doc.setFontSize(14); // INCREASED FROM 11: Match size of VAT INVOICE
            doc.setFont("helvetica", "bold");
            doc.text("Invoice Items", pageWidth / 2, itemsStartY + 10, { align: "center" });
            
            // More space after title before table
            const tableY = itemsStartY + 15;

            // Items Table - INCREASED SPACE AFTER LINE
            const tableStartY = itemsStartY + 15; // INCREASED from +10 to add more space after line
            
            if (invoiceData.items && Array.isArray(invoiceData.items) && invoiceData.items.length > 0) {
                const tableColumns = [
                    "S/N", "Item Name", "Description", "Quantity", "Unit Price", "Total"
                ];
                
                // Map items to table rows
                const tableRows = invoiceData.items.map((item, index) => {
                    // Format currency values for display
                    const formattedUnitPrice = parseFloat(item.unit_price).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    
                    const formattedSubtotal = parseFloat(item.subtotal).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    
                    return [
                        index + 1,
                        item.name || "N/A",
                        item.description || "N/A",
                        item.quantity || "N/A",
                        formattedUnitPrice,
                        formattedSubtotal
                    ];
                });
                
                // Calculate available width - MATCH EXACTLY THE PAGE WIDTH
                const availableWidth = pageWidth - (2 * margin);
                
                // Add table with better error handling
                let tableResult = null; // Initialize with null instead of undefined
                try {
                    // Column widths that match exactly the A4 page width
                    const columnWidths = {
                        0: 12, // S/N
                        1: 28, // Item Name
                        2: 45, // Description - using RFQPDF.jsx width
                        3: 22, // Quantity
                        4: 22, // Unit Price
                        5: 26  // Total
                    };
                    
                    // Calculate total column width and adjust if needed
                    const totalWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0);
                    const remainingWidth = availableWidth - totalWidth;
                    
                    if (Math.abs(remainingWidth) > 0.1) {
                        // If there's a significant difference, adjust the description column
                        columnWidths[2] += remainingWidth;
                        console.log("Adjusted description column to fit page width exactly");
                    }
                    
                    tableResult = autoTable(doc, {
                        head: [tableColumns],
                        body: tableRows,
                        startY: tableStartY,
                        margin: { left: margin, right: margin },
                        styles: { 
                            fontSize: 9, 
                            cellPadding: 3, 
                            overflow: 'linebreak',
                            lineWidth: 0.1,
                            halign: 'center', // Center align ALL content
                            valign: 'middle', // Vertically center all content
                        },
                        headStyles: { 
                            fillColor: [199, 231, 222], 
                            textColor: [0, 0, 0], 
                            fontStyle: 'bold',
                            halign: 'center',
                            valign: 'middle'
                        },
                        tableWidth: availableWidth, // MATCH EXACTLY THE PAGE WIDTH
                        columnStyles: {
                            0: { cellWidth: columnWidths[0], halign: 'center' }, // S/N
                            1: { cellWidth: columnWidths[1], halign: 'center' }, // Item Name
                            2: { cellWidth: columnWidths[2], halign: 'center' }, // Description
                            3: { cellWidth: columnWidths[3], halign: 'center' }, // Quantity
                            4: { cellWidth: columnWidths[4], halign: 'center' }, // Unit Price
                            5: { cellWidth: columnWidths[5], halign: 'center' }  // Total
                        },
                        didDrawPage: (data) => {
                            // Add header to continue pages
                            if (data.pageNumber > 1) {
                                // Add minimal header on continued pages
                                doc.setFontSize(10);
                                doc.setFont("helvetica", "bold");
                                doc.text(`Invoice #: ${invoiceData.invoice_number || "N/A"}`, margin, margin + 10);
                                doc.text("(Continued)", margin, margin + 15);
                                
                                // Add line below the header
                                doc.setDrawColor(0, 0, 0);
                                doc.setLineWidth(0.3);
                                doc.line(margin, margin + 20, pageWidth - margin, margin + 20);
                                
                                // Adjust the table starting position on continued pages
                                data.settings.startY = margin + 25;
                            }
                            
                            // Format the current date in dd/mm/yyyy format
                            const today = new Date();
                            const day = today.getDate().toString().padStart(2, '0');
                            const month = (today.getMonth() + 1).toString().padStart(2, '0');
                            const year = today.getFullYear();
                            const formattedDate = `${day}/${month}/${year}`;
                            
                            // Add footer on each page
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
                        showFoot: 'everyPage',
                        willDrawCell: (data) => {
                            // Add constraints to cell height to prevent very tall cells
                            if (data.row.height > 20) {
                                data.row.height = 20;
                            }
                        }
                    });
                    
                    // Debug logging
                    console.log("Table generation successful", {
                        hasTableResult: !!tableResult,
                        finalY: tableResult ? tableResult.finalY : "N/A",
                        pageHeight: pageHeight,
                        remainingSpace: tableResult ? pageHeight - tableResult.finalY : "N/A",
                        pageCount: doc.getNumberOfPages()
                    });
                    
                } catch (tableError) {
                    console.error("Error generating table:", tableError);
                    // Continue without the table - we still need to show the summary
                }
                
                // Add Summary section - force it to the next page if needed
                // Determine if there's enough space based on table end position
                // Need at least 150mm for the summary section
                const spaceNeededForSummary = 150;
                const finalYPosition = tableResult && tableResult.finalY ? tableResult.finalY : tableStartY + 20;
                const remainingSpace = pageHeight - finalYPosition;
                
                // Check if we need to add a new page
                if (remainingSpace < spaceNeededForSummary) {
                    console.log("Adding summary section on new page", {
                        tableEndY: finalYPosition, 
                        remainingSpace: remainingSpace,
                        spaceNeeded: spaceNeededForSummary,
                        currentPage: doc.getNumberOfPages()
                    });
                    
                    // Always add a new page for the summary when space is insufficient
                    const currentPage = doc.getNumberOfPages();
                    doc.addPage();
                    
                    // Make sure we're now on the new page
                    if (doc.getNumberOfPages() !== currentPage + 1) {
                        console.error("Page addition failed, forcing page", currentPage + 1);
                        doc.setPage(currentPage + 1);
                    }
                    
                    // Reset the Y position to top of current page with some padding
                    const newPageSummaryY = margin + 20; // Reduced from +30
                    
                    // Add line ABOVE the title
                    doc.setDrawColor(0, 0, 0);
                    doc.setLineWidth(0.3);
                    doc.line(margin, newPageSummaryY - 5, pageWidth - margin, newPageSummaryY - 5);
                    
                    // Add summary title at top of new page with larger font
                    doc.setFontSize(16);
                    doc.setFont("helvetica", "bold");
                    doc.text("Bank Details & Payment Summary", pageWidth / 2, newPageSummaryY + 5, { align: "center" });
                    
                    // Draw the bank details box with increased spacing from title
                    const bankBoxY = newPageSummaryY + 15;
                    doc.setFillColor(240, 240, 240);
                    doc.roundedRect(margin, bankBoxY, leftBoxWidth + 10, 85, 3, 3, 'F'); // REDUCED from +20 to +10
                    
                    const bankLabelX = margin + 5;
                    const bankValueX = margin + 45; // REDUCED FROM +50
                    
                    // REDUCED VERTICAL SPACING BETWEEN ITEMS
                    doc.setFontSize(9);
                    doc.setFont("helvetica", "bold");
                    doc.text("Account Name:", bankLabelX, bankBoxY + 10);
                    doc.text("Account No:", bankLabelX, bankBoxY + 20);
                    doc.text("Currency:", bankLabelX, bankBoxY + 30);
                    doc.text("License No:", bankLabelX, bankBoxY + 40);
                    doc.text("IBAN Number:", bankLabelX, bankBoxY + 50);
                    doc.text("Bank Name:", bankLabelX, bankBoxY + 60);
                    doc.text("Branch Name:", bankLabelX, bankBoxY + 70);
                    doc.text("Swift Code:", bankLabelX, bankBoxY + 80);
                    
                    doc.setFont("helvetica", "normal");
                    const accountName = companyDetails.account_name || "MAHARAT CONSTRUCTION TRAINING CENTER (MCTC)";
                    const accountNo = companyDetails.account_no || "242-089787-001";
                    const currency = companyDetails.currency?.name || "Saudi Riyal";
                    const licenseNo = companyDetails.license_no || "L-310522";
                    const iban = companyDetails.iban || "SA0345000000242089787001";
                    const bankName = companyDetails.bank || "Saudi National Bank (SNB)";
                    const branchName = companyDetails.branch || "Khobar Main Branch";
                    const swiftCode = companyDetails.swift || "SABBSARI";
                    
                    // REDUCED TAB SPACE: Moved values closer to labels and added text wrapping
                    const maxTextWidth = leftBoxWidth + 10 - 40; // Maximum width for wrapped text (ADJUSTED for new box width)
                    const accountNameLines = doc.splitTextToSize(accountName, maxTextWidth);
                    doc.text(accountNameLines, bankValueX - 15, bankBoxY + 10);
                    doc.text(accountNo, bankValueX - 15, bankBoxY + 20);
                    doc.text(currency, bankValueX - 15, bankBoxY + 30);
                    doc.text(licenseNo, bankValueX - 15, bankBoxY + 40);
                    doc.text(iban, bankValueX - 15, bankBoxY + 50);
                    doc.text(bankName, bankValueX - 15, bankBoxY + 60);
                    doc.text(branchName, bankValueX - 15, bankBoxY + 70);
                    doc.text(swiftCode, bankValueX - 15, bankBoxY + 80);
                    
                    // Draw the totals boxes
                    const totalsBoxWidth = rightBoxWidth;
                    const totalsStartX = rightBoxX;
                    
                    doc.setFillColor(240, 240, 240);
                    doc.roundedRect(totalsStartX, bankBoxY, totalsBoxWidth, 40, 3, 3, 'F');
                    
                    const totalsLabelX = totalsStartX + 5;
                    const totalsValueX = totalsStartX + totalsBoxWidth - 5;
                    
                    doc.setFont("helvetica", "bold");
                    doc.text("Subtotal:", totalsLabelX, bankBoxY + 10);
                    doc.text("Discount:", totalsLabelX, bankBoxY + 20);
                    doc.text("VAT Amount:", totalsLabelX, bankBoxY + 30);
                    
                    const formattedSubtotal = parseFloat(invoiceData.subtotal || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    
                    const formattedDiscount = parseFloat(invoiceData.discount_amount || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    
                    const formattedVat = parseFloat(invoiceData.tax_amount || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    
                    const currencyCode = companyDetails.currency?.code || "SAR";
                    
                    doc.setFont("helvetica", "normal");
                    doc.text(`${formattedSubtotal} ${currencyCode}`, totalsValueX, bankBoxY + 10, { align: "right" });
                    doc.text(`${formattedDiscount} ${currencyCode}`, totalsValueX, bankBoxY + 20, { align: "right" });
                    doc.text(`${formattedVat} ${currencyCode}`, totalsValueX, bankBoxY + 30, { align: "right" });
                    
                    // Net Amount box - MATCH STYLING FROM CreateMaharatInvoice.jsx
                    doc.setFillColor(240, 240, 240);
                    doc.roundedRect(totalsStartX, bankBoxY + 45, totalsBoxWidth, 30, 3, 3, 'F'); // Increased height
                    
                    const formattedTotal = parseFloat(invoiceData.total_amount || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    
                    doc.setFontSize(14); // Larger font - match CreateMaharatInvoice.jsx
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(255, 0, 0);
                    doc.text("Net Amount:", totalsLabelX, bankBoxY + 63); // Centered in taller box
                    doc.text(`${formattedTotal} ${currencyCode}`, totalsValueX, bankBoxY + 63, { align: "right" });
                    doc.setTextColor(0, 0, 0);
                    
                    // Add footer on new page - ALL ALIGNED ON SAME BASELINE
                    const today = new Date();
                    const day = today.getDate().toString().padStart(2, '0');
                    const month = (today.getMonth() + 1).toString().padStart(2, '0');
                    const year = today.getFullYear();
                    const formattedDate = `${day}/${month}/${year}`;
                    
                    doc.setFontSize(8);
                    doc.setFont("helvetica", "normal");
                    const footerY = pageHeight - margin;
                    doc.text(`Generated on: ${formattedDate}`, margin, footerY);
                    doc.text(`Page ${doc.getNumberOfPages()} of ${doc.getNumberOfPages()}`, pageWidth / 2, footerY, { align: "center" });
                    doc.text("This is an official document of Maharat MCTC", pageWidth - margin, footerY, { align: "right" });
                } else {
                    // Enough space on current page, add section title
                    // Calculate summary start position based on table end
                    const summaryStartY = finalYPosition + 20;
                    
                    // Add line ABOVE the title
                    doc.setDrawColor(0, 0, 0);
                    doc.setLineWidth(0.3);
                    doc.line(margin, summaryStartY - 15, pageWidth - margin, summaryStartY - 15);
                    
                    doc.setFontSize(12);
                    doc.setFont("helvetica", "bold");
                    doc.text("Bank Details & Payment Summary", pageWidth / 2, summaryStartY - 5, { align: "center" });
                    
                    // Company bank details on the left - ensure proper width
                    doc.setFillColor(240, 240, 240); // Light gray
                    doc.roundedRect(margin, summaryStartY, leftBoxWidth + 10, 85, 3, 3, 'F'); // REDUCED from +20 to +10
                    
                    const bankLabelX = margin + 5;
                    const bankValueX = margin + 50; // Wider spacing for alignment
                    
                    // REDUCED VERTICAL SPACING BETWEEN ITEMS
                    doc.setFontSize(9);
                    doc.setFont("helvetica", "bold");
                    doc.text("Account Name:", bankLabelX, summaryStartY + 10);
                    doc.text("Account No:", bankLabelX, summaryStartY + 20);
                    doc.text("Currency:", bankLabelX, summaryStartY + 30);
                    doc.text("License No:", bankLabelX, summaryStartY + 40);
                    doc.text("IBAN Number:", bankLabelX, summaryStartY + 50);
                    doc.text("Bank Name:", bankLabelX, summaryStartY + 60);
                    doc.text("Branch Name:", bankLabelX, summaryStartY + 70);
                    doc.text("Swift Code:", bankLabelX, summaryStartY + 80);
                    
                    // Fetch actual company details
                    doc.setFont("helvetica", "normal");
                    const accountName = companyDetails.account_name || "MAHARAT CONSTRUCTION TRAINING CENTER (MCTC)";
                    const accountNo = companyDetails.account_no || "242-089787-001";
                    const currency = companyDetails.currency?.name || "Saudi Riyal";
                    const licenseNo = companyDetails.license_no || "L-310522";
                    const iban = companyDetails.iban || "SA0345000000242089787001";
                    const bankName = companyDetails.bank || "Saudi National Bank (SNB)";
                    const branchName = companyDetails.branch || "Khobar Main Branch";
                    const swiftCode = companyDetails.swift || "SABBSARI";
                    
                    // REDUCED TAB SPACE: Moved values closer to labels and added text wrapping
                    const maxTextWidth = leftBoxWidth + 10 - 40; // Maximum width for wrapped text (ADJUSTED for new box width)
                    const accountNameLines = doc.splitTextToSize(accountName, maxTextWidth);
                    doc.text(accountNameLines, bankValueX - 15, summaryStartY + 10);
                    doc.text(accountNo, bankValueX - 15, summaryStartY + 20);
                    doc.text(currency, bankValueX - 15, summaryStartY + 30);
                    doc.text(licenseNo, bankValueX - 15, summaryStartY + 40);
                    doc.text(iban, bankValueX - 15, summaryStartY + 50);
                    doc.text(bankName, bankValueX - 15, summaryStartY + 60);
                    doc.text(branchName, bankValueX - 15, summaryStartY + 70);
                    doc.text(swiftCode, bankValueX - 15, summaryStartY + 80);
                }
            } else {
                // No items message
                doc.setFontSize(10);
                doc.setFont("helvetica", "italic");
                doc.text("No items available for this invoice", pageWidth / 2, tableStartY + 10, { align: "center" });
                
                // Even with no items, add a summary section
                const summaryStartY = tableStartY + 40;
                
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text("Bank Details & Payment Summary", pageWidth / 2, summaryStartY - 5, { align: "center" });
                
                // Add separator line
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.3);
                doc.line(margin, summaryStartY - 10, pageWidth - margin, summaryStartY - 10);
                
                // Company bank details on the left - ensure proper width
                doc.setFillColor(240, 240, 240); // Light gray
                doc.roundedRect(margin, summaryStartY, leftBoxWidth + 10, 85, 3, 3, 'F'); // REDUCED from +20 to +10
                
                const bankLabelX = margin + 5;
                const bankValueX = margin + 50; // Wider spacing for alignment
                
                doc.setFontSize(9);
                doc.setFont("helvetica", "bold");
                doc.text("Account Name:", bankLabelX, summaryStartY + 10);
                doc.text("Account No:", bankLabelX, summaryStartY + 20);
                doc.text("Currency:", bankLabelX, summaryStartY + 30);
                doc.text("License No:", bankLabelX, summaryStartY + 40);
                doc.text("IBAN Number:", bankLabelX, summaryStartY + 50);
                doc.text("Bank Name:", bankLabelX, summaryStartY + 60);
                doc.text("Branch Name:", bankLabelX, summaryStartY + 70);
                doc.text("Swift Code:", bankLabelX, summaryStartY + 80);
                
                // Fetch actual company details
                doc.setFont("helvetica", "normal");
                const accountName = companyDetails.account_name || "MAHARAT CONSTRUCTION TRAINING CENTER (MCTC)";
                const accountNo = companyDetails.account_no || "242-089787-001";
                const currency = companyDetails.currency?.name || "Saudi Riyal";
                const licenseNo = companyDetails.license_no || "L-310522";
                const iban = companyDetails.iban || "SA0345000000242089787001";
                const bankName = companyDetails.bank || "Saudi National Bank (SNB)";
                const branchName = companyDetails.branch || "Khobar Main Branch";
                const swiftCode = companyDetails.swift || "SABBSARI";
                
                // REDUCED TAB SPACE: Moved values closer to labels and added text wrapping
                const maxTextWidth = leftBoxWidth + 10 - 40; // Maximum width for wrapped text (ADJUSTED for new box width)
                const accountNameLines = doc.splitTextToSize(accountName, maxTextWidth);
                doc.text(accountNameLines, bankValueX - 15, summaryStartY + 10);
                doc.text(accountNo, bankValueX - 15, summaryStartY + 20);
                doc.text(currency, bankValueX - 15, summaryStartY + 30);
                doc.text(licenseNo, bankValueX - 15, summaryStartY + 40);
                doc.text(iban, bankValueX - 15, summaryStartY + 50);
                doc.text(bankName, bankValueX - 15, summaryStartY + 60);
                doc.text(branchName, bankValueX - 15, summaryStartY + 70);
                doc.text(swiftCode, bankValueX - 15, summaryStartY + 80);
                
                // Invoice totals on the right - align properly
                const totalsBoxWidth = rightBoxWidth;
                const totalsStartX = rightBoxX;
                
                // First box - Subtotal & discount
                doc.setFillColor(240, 240, 240); // Light gray
                doc.roundedRect(totalsStartX, summaryStartY, totalsBoxWidth, 40, 3, 3, 'F');
                
                const totalsLabelX = totalsStartX + 5;
                const totalsValueX = totalsStartX + totalsBoxWidth - 5;
                
                doc.setFont("helvetica", "bold");
                doc.text("Subtotal:", totalsLabelX, summaryStartY + 10);
                doc.text("Discount:", totalsLabelX, summaryStartY + 20);
                doc.text("VAT Amount:", totalsLabelX, summaryStartY + 30);
                
                // Use known values from invoice data
                const formattedSubtotal = parseFloat(invoiceData.subtotal || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                
                const formattedDiscount = parseFloat(invoiceData.discount_amount || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                
                const formattedVat = parseFloat(invoiceData.tax_amount || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                
                const currencyCode = companyDetails.currency?.code || "SAR";
                
                doc.setFont("helvetica", "normal");
                doc.text(`${formattedSubtotal} ${currencyCode}`, totalsValueX, summaryStartY + 10, { align: "right" });
                doc.text(`${formattedDiscount} ${currencyCode}`, totalsValueX, summaryStartY + 20, { align: "right" });
                doc.text(`${formattedVat} ${currencyCode}`, totalsValueX, summaryStartY + 30, { align: "right" });
                
                // Second box - Net Amount (Total) - MATCH STYLING FROM CreateMaharatInvoice.jsx
                doc.setFillColor(240, 240, 240);
                doc.roundedRect(totalsStartX, summaryStartY + 45, totalsBoxWidth, 30, 3, 3, 'F'); // Increased height to match
                
                // Format total amount
                const formattedTotal = parseFloat(invoiceData.total_amount || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                
                doc.setFontSize(14); // Increased font size to match CreateMaharatInvoice.jsx
                doc.setFont("helvetica", "bold");
                doc.setTextColor(255, 0, 0);
                doc.text("Net Amount:", totalsLabelX, summaryStartY + 63); // Centered in taller box
                doc.text(`${formattedTotal} ${currencyCode}`, totalsValueX, summaryStartY + 63, { align: "right" });
                doc.setTextColor(0, 0, 0);
                
                // Add footer - ALL ALIGNED ON SAME BASELINE
                const today = new Date();
                const day = today.getDate().toString().padStart(2, '0');
                const month = (today.getMonth() + 1).toString().padStart(2, '0');
                const year = today.getFullYear();
                const formattedDate = `${day}/${month}/${year}`;
                
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                const footerY = pageHeight - margin;
                doc.text(`Generated on: ${formattedDate}`, margin, footerY);
                doc.text(`Page 1 of 1`, pageWidth / 2, footerY, { align: "center" });
                doc.text("This is an official document of Maharat MCTC", pageWidth - margin, footerY, { align: "right" });
            }
            
            // Save the PDF
            const pdfBlob = doc.output('blob');
            const pdfFile = new File([pdfBlob], `Invoice_${invoiceData.invoice_number || invoiceId}.pdf`, { type: 'application/pdf' });
            
            // Open the PDF in a new tab immediately
            const fileUrl = URL.createObjectURL(pdfBlob);
            window.open(fileUrl, '_blank');
            
            // Save to server
            const formData = new FormData();
            formData.append('invoice_document', pdfFile);
            
            const uploadResponse = await axios.post(`/api/v1/invoices/${invoiceId}/upload-document`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (uploadResponse.data?.success) {
                if (onGenerated && typeof onGenerated === 'function') {
                    onGenerated(uploadResponse.data?.document_url);
                }
            } else {
                console.warn("Document generated but not saved to server");
            }
            
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
            
            // Notify parent component about the error
            if (onGenerated && typeof onGenerated === 'function') {
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

    return null; // This component doesn't render anything visible
} 