import React, { useEffect, useState } from "react";
import { Head } from "@inertiajs/react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

export default function RFQPDF({ rfqId, onGenerated }) {
    const [rfqData, setRfqData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRFQData = async () => {
            try {
                setLoading(true);
                // Include all related data in the request with expanded include list
                const response = await axios.get(`/api/v1/rfqs/${rfqId}?include=status,warehouse,items.unit,items.brand,items.product,costCenter,subCostCenter,categories,paymentType,cost_center,sub_cost_center,payment_type,items.specifications`);
                
                if (response.data?.data) {
                    const data = response.data.data;
                    console.log("Fetched RFQ data:", data);
                    
                    // Log specific fields that we're having trouble with
                    console.log("Cost Center: ", {
                        costCenter: data.costCenter,
                        cost_center: data.cost_center,
                        cost_center_id: data.cost_center_id
                    });
                    
                    console.log("Sub Cost Center: ", {
                        subCostCenter: data.subCostCenter,
                        sub_cost_center: data.sub_cost_center,
                        sub_cost_center_id: data.sub_cost_center_id
                    });
                    
                    if (data.items && data.items.length > 0) {
                        console.log("First item details:", {
                            item_name: data.items[0].item_name,
                            description: data.items[0].description,
                            product: data.items[0].product
                        });
                    }
                    
                    // If we have cost_center_id but no cost center data, fetch it
                    if (data.cost_center_id && 
                        (!data.costCenter || !data.costCenter.name) && 
                        (!data.cost_center || !data.cost_center.name)) {
                        try {
                            const costCenterResponse = await axios.get(`/api/v1/cost-centers/${data.cost_center_id}`);
                            if (costCenterResponse.data?.data) {
                                data.cost_center = costCenterResponse.data.data;
                                console.log("Fetched cost center:", data.cost_center);
                            }
                        } catch (e) {
                            console.error("Error fetching cost center:", e);
                        }
                    }
                    
                    // If we have sub_cost_center_id but no sub cost center data, fetch it
                    if (data.sub_cost_center_id && 
                        (!data.subCostCenter || !data.subCostCenter.name) && 
                        (!data.sub_cost_center || !data.sub_cost_center.name)) {
                        try {
                            const subCostCenterResponse = await axios.get(`/api/v1/cost-centers/${data.sub_cost_center_id}`);
                            if (subCostCenterResponse.data?.data) {
                                data.sub_cost_center = subCostCenterResponse.data.data;
                                console.log("Fetched sub cost center:", data.sub_cost_center);
                            }
                        } catch (e) {
                            console.error("Error fetching sub cost center:", e);
                        }
                    }
                    
                    setRfqData(data);
                } else {
                    setError("Invalid response format");
                }
            } catch (error) {
                console.error("Error fetching RFQ data:", error);
                setError("Failed to load RFQ data");
            } finally {
                setLoading(false);
            }
        };

        if (rfqId) {
            fetchRFQData();
        }
    }, [rfqId]);

    useEffect(() => {
        if (!loading && !error && rfqData) {
            generatePDF();
        }
    }, [rfqData, loading, error]);

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
                
                // Handle possible JSON string that needs parsing
                if (typeof result === 'string' && (result.startsWith('{') || result.startsWith('['))) {
                    try {
                        const parsed = JSON.parse(result);
                        result = parsed;
                        console.log(`Parsed JSON string for key ${key}:`, parsed);
                    } catch (e) {
                        // Not valid JSON, continue with the string value
                    }
                }
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
            console.log("Generating PDF with data:", rfqData);
            
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
            
            // Add logo on the right side - with reduced height
            try {
                const img = new Image();
                img.src = '/images/MCTC Logo.png';
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    // Set a timeout in case the image loading hangs
                    setTimeout(resolve, 3000);
                });
                
                // Calculate appropriate dimensions - reduced height instead of width
                const logoHeight = 15; // Increase height slightly
                const logoWidth = 20; // Increase width slightly
                
                // Position logo closer to the first line (more down)
                doc.addImage(img, 'PNG', pageWidth - margin - logoWidth, margin + 4, logoWidth, logoHeight);
            } catch (imgErr) {
                console.error("Error adding logo:", imgErr);
                // Continue without the logo
            }
            
            // Title - centered instead of left aligned, smaller size
            doc.setFontSize(14); // Reduced from 20 to match other headings
            doc.setFont("helvetica", "bold");
            doc.text("REQUEST FOR QUOTATION", pageWidth / 2, margin + 15, { align: "center" });
            
            // Add a horizontal line below the title and logo
            doc.setLineWidth(0.3); // Explicitly set line thickness
            doc.line(margin, margin + 20, pageWidth - margin, margin + 20);
            
            // RFQ Number, dates in left section (without status)
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("RFQ #:", margin, margin + 30);
            doc.text("Issue Date:", margin, margin + 37);
            doc.text("Closing Date:", margin, margin + 44);
            
            // Set values with normal font
            doc.setFont("helvetica", "normal");
            doc.text(rfqData.rfq_number || 'N/A', margin + 25, margin + 30);
            doc.text(formatDateForDisplay(rfqData.request_date), margin + 25, margin + 37);
            doc.text(formatDateForDisplay(rfqData.closing_date), margin + 25, margin + 44);
            
            // Add a horizontal line below the header info - reduced space after this line
            doc.setLineWidth(0.3); // Explicitly set line thickness
            doc.line(margin, margin + 50, pageWidth - margin, margin + 50);
            
            // Organization Info - left column - reduced space after line
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Name:", margin, margin + 60); // Changed from +70 to +60
            doc.text("Email:", margin, margin + 67); // Changed from +77 to +67
            doc.text("City:", margin, margin + 74); // Changed from +84 to +74
            doc.text("Warehouse:", margin, margin + 81); // Changed from +91 to +81
            doc.text("Contact:", margin, margin + 88); // Changed from +98 to +88
            
            // Left column values with text overflow handling - use more space for values
            doc.setFont("helvetica", "normal");
            const maxLeftWidth = pageWidth - (margin + 30) - 30; // Dramatically increased width for left column values
            
            // Helper function to truncate text if too long
            const fitTextInColumn = (text, maxWidth) => {
                if (doc.getStringUnitWidth(text) * 10 > maxWidth) {
                    let truncated = text;
                    while (doc.getStringUnitWidth(truncated + "...") * 10 > maxWidth) {
                        truncated = truncated.slice(0, -1);
                    }
                    return truncated + "...";
                }
                return text;
            };
            
            doc.text(fitTextInColumn(getSafeValue(rfqData, 'organization_name'), maxLeftWidth), margin + 30, margin + 60);
            doc.text(fitTextInColumn(getSafeValue(rfqData, 'organization_email'), maxLeftWidth), margin + 30, margin + 67);
            doc.text(fitTextInColumn(getSafeValue(rfqData, 'city'), maxLeftWidth), margin + 30, margin + 74);
            doc.text(fitTextInColumn(getSafeValue(rfqData, 'warehouse.name'), maxLeftWidth), margin + 30, margin + 81);
            doc.text(fitTextInColumn(getSafeValue(rfqData, 'contact_number'), maxLeftWidth), margin + 30, margin + 88);
            
            // Category and Cost Centers - right column - adjust to match new spacing
            const centerX = pageWidth / 2 + 5;
            doc.setFont("helvetica", "bold");
            doc.text("Category:", centerX, margin + 60); // Changed from +70 to +60
            doc.text("Cost Center:", centerX, margin + 67); // Changed from +77 to +67
            doc.text("Sub Cost Center:", centerX, margin + 74); // Changed from +84 to +74
            doc.text("Payment Type:", centerX, margin + 81); // Changed from +91 to +81
            doc.text("Status:", centerX, margin + 88); // Changed from +98 to +88
            
            // Right column values with consistent spacing from labels
            doc.setFont("helvetica", "normal");
            const labelWidth = 35; // Width for right column labels
            const valueX = centerX + labelWidth; // X position for values with consistent spacing
            const maxRightWidth = pageWidth - valueX - margin + 70; // Increased width significantly for right column values
            
            // Category
            let categoryName = 'N/A';
            if (rfqData.categories && rfqData.categories.length > 0) {
                categoryName = rfqData.categories[0].name;
            } else if (rfqData.category && rfqData.category.name) {
                categoryName = rfqData.category.name;
            } else if (rfqData.category_name) {
                categoryName = rfqData.category_name;
            }
            doc.text(fitTextInColumn(categoryName, maxRightWidth), valueX, margin + 60);
            
            // Cost Center
            let costCenterName = 'N/A';
            if (rfqData.costCenter) {
                costCenterName = rfqData.costCenter.name || 'N/A';
            } else if (rfqData.cost_center) {
                costCenterName = rfqData.cost_center.name || 'N/A';
            } else if (rfqData.cost_center_id) {
                costCenterName = `ID: ${rfqData.cost_center_id}`;
            }
            doc.text(fitTextInColumn(costCenterName, maxRightWidth), valueX, margin + 67);
            
            // Sub Cost Center
            let subCostCenterName = 'N/A';
            if (rfqData.subCostCenter) {
                subCostCenterName = rfqData.subCostCenter.name || 'N/A';
            } else if (rfqData.sub_cost_center) {
                subCostCenterName = rfqData.sub_cost_center.name || 'N/A';
            } else if (rfqData.sub_cost_center_id) {
                subCostCenterName = `ID: ${rfqData.sub_cost_center_id}`;
            }
            doc.text(fitTextInColumn(subCostCenterName, maxRightWidth), valueX, margin + 74);
            
            // Payment Type
            let paymentTypeName = getSafeValue(rfqData, 'paymentType.name');
            if (paymentTypeName === 'N/A' && rfqData.payment_type) {
                paymentTypeName = getSafeValue(rfqData, 'payment_type.name');
            }
            doc.text(fitTextInColumn(paymentTypeName, maxRightWidth), valueX, margin + 81);
            
            // Status with color
            const statusName = getSafeValue(rfqData, 'status.name');
            
            // Set status color based on value
            if (statusName === 'Active') {
                doc.setTextColor(0, 128, 0); // Green
            } else if (statusName === 'Rejected') {
                doc.setTextColor(255, 0, 0); // Red
            } else if (statusName === 'Pending') {
                doc.setTextColor(255, 165, 0); // Orange
            } else {
                doc.setTextColor(0, 0, 0); // Black
            }
            
            doc.text(fitTextInColumn(statusName, maxRightWidth), valueX, margin + 88);
            doc.setTextColor(0, 0, 0); // Reset to black
            
            // Add a horizontal line below the organization info - reduced spacing
            doc.setLineWidth(0.3); // Explicitly set line thickness
            doc.line(margin, margin + 95, pageWidth - margin, margin + 95);
            
            // Items Section Title - centered - moved up
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Items", pageWidth / 2, margin + 105, { align: "center" }); // Changed from +115 to +105
            
            // Check if items exist and are in an array
            let tableResult;
            if (rfqData.items && Array.isArray(rfqData.items) && rfqData.items.length > 0) {
                const tableColumn = [
                    "#", "Product", "Description", "Unit", 
                    "Quantity", "Brand", "Expected Delivery Date"
                ];
                
                // Map the items to table rows with better data access
                const tableRows = rfqData.items.map((item, index) => {
                    // Try to get product name from relationship or direct property
                    let productName = item.item_name || 'N/A';
                    if (productName === 'N/A' && item.product) {
                        productName = item.product.name || 'N/A';
                    }
                    
                    // Get description with fallbacks
                    let description = 'N/A';
                    if (item.description && item.description !== '') {
                        description = item.description;
                    } else if (item.product && item.product.description) {
                        description = item.product.description;
                    } else if (item.specifications) {
                        description = item.specifications;
                    }
                    
                    // Get unit name from relationship
                    let unitName = 'N/A';
                    if (item.unit) {
                        unitName = item.unit.name || 'N/A';
                    }
                    
                    // Get brand name from relationship
                    let brandName = 'N/A';
                    if (item.brand) {
                        brandName = item.brand.name || 'N/A';
                    }
                    
                    return [
                        index + 1,
                        productName,
                        description,
                        unitName,
                        item.quantity || 'N/A',
                        brandName,
                        formatDateForDisplay(item.expected_delivery_date)
                    ];
                });
                
                // Calculate total available width and make sure it uses the full width
                const availableWidth = pageWidth - (2 * margin);
                
                // Add the table using the autoTable function and store result
                tableResult = autoTable(doc, {
                    head: [tableColumn],
                    body: tableRows,
                    startY: margin + 110, // Changed from +120 to +110
                    margin: { left: margin, right: margin },
                    styles: { 
                        fontSize: 9, 
                        cellPadding: 3, 
                        overflow: 'linebreak',
                        lineWidth: 0.1,
                        halign: 'center', // Center align ALL content by default
                        valign: 'middle', // Vertically center all content
                    },
                    headStyles: { 
                        fillColor: [199, 231, 222], 
                        textColor: [0, 0, 0], 
                        fontStyle: 'bold',
                        halign: 'center',
                        valign: 'middle'
                    },
                    tableWidth: availableWidth, // Exactly fit to available width
                    columnStyles: {
                        0: { cellWidth: 8, halign: 'center' }, // # column - reduced width
                        1: { cellWidth: 28, halign: 'center' }, // Product
                        2: { cellWidth: 49, halign: 'center' }, // Description - increased width to compensate
                        3: { cellWidth: 22, halign: 'center' }, // Unit
                        4: { cellWidth: 22, halign: 'center' }, // Quantity
                        5: { cellWidth: 25, halign: 'center' }, // Brand
                        6: { cellWidth: 26, halign: 'center' } // Expected Delivery Date
                    },
                    didDrawPage: (data) => {
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
                            "This is an official document of Maharat MCTC",
                            pageWidth - margin,
                            pageHeight - margin,
                            { align: "right" }
                        );
                    }
                });
            } else {
                doc.setFontSize(10);
                doc.setFont("helvetica", "italic");
                doc.text("No items available for this RFQ", pageWidth / 2, margin + 130, { align: "center" });
                
                // Add footer if no items
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.text(
                    `Generated on: ${new Date().toLocaleDateString()}`,
                    margin,
                    pageHeight - margin
                );
                doc.text(
                    "This is an official document of Maharat MCTC",
                    pageWidth - margin,
                    pageHeight - margin,
                    { align: "right" }
                );
            }
            
            // Save the PDF
            const pdfBlob = doc.output('blob');
            const pdfFile = new File([pdfBlob], `RFQ_${rfqData.rfq_number || rfqId}.pdf`, { type: 'application/pdf' });
            
            // Open the PDF in a new tab immediately
            const fileUrl = URL.createObjectURL(pdfBlob);
            window.open(fileUrl, '_blank');
            
            // Save to server
            const formData = new FormData();
            formData.append('quotation_document', pdfFile);
            
            const uploadResponse = await axios.post(`/api/v1/rfqs/${rfqId}/upload-document`, formData, {
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