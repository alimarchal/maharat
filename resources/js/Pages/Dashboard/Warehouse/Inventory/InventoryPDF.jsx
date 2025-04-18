import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

export default function InventoryPDF({ inventoryId, onGenerated }) {
    const [inventoryData, setInventoryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchInventoryData = async () => {
            try {
                setLoading(true);
                console.log("Fetching inventory data for ID:", inventoryId);
                
                // Include all related data in the request
                const response = await axios.get(`/api/v1/inventories/${inventoryId}`, {
                    params: {
                        include: 'warehouse,product,user'
                    }
                });
                
                console.log("Inventory data response:", response.data);
                
                if (response.data?.data) {
                    const data = response.data.data;
                    console.log("Inventory data parsed:", {
                        id: data.id,
                        warehouseId: data.warehouse_id,
                        productId: data.product_id,
                        userId: data.user_id,
                        hasWarehouse: !!data.warehouse,
                        hasProduct: !!data.product,
                        hasUser: !!data.user
                    });
                    
                    setInventoryData(data);
                } else {
                    console.error("Invalid response format:", response.data);
                    setError("Invalid response format");
                }
            } catch (error) {
                console.error("Error fetching inventory data for PDF:", error);
                
                // Add more detailed error logging
                if (error.response) {
                    console.error("Error response data:", error.response.data);
                    console.error("Error response status:", error.response.status);
                    console.error("Error response headers:", error.response.headers);
                } else if (error.request) {
                    console.error("No response received:", error.request);
                } else {
                    console.error("Error message:", error.message);
                }
                
                setError("Failed to load inventory data: " + (error.response?.data?.message || error.message));
            } finally {
                setLoading(false);
            }
        };

        if (inventoryId) {
            fetchInventoryData();
        }
    }, [inventoryId]);

    useEffect(() => {
        if (!loading && !error && inventoryData) {
            generatePDF();
        }
    }, [inventoryData, loading, error]);

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    };
    
    // Simple value getter helper function
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

    const getUserName = (data) => {
        // If we have user data
        if (data && data.user) {
            const user = data.user;
            // Try to use the name field first
            if (user.name) return user.name;
            
            // If we have both firstname and lastname, combine them
            if (user.firstname && user.lastname) return `${user.firstname} ${user.lastname}`;
            
            // Fall back to one of the fields if available
            if (user.firstname) return user.firstname;
            if (user.lastname) return user.lastname;
            
            // If nothing else, use the ID
            if (user.id) return `User #${user.id}`;
        }
        
        // If we have a user_id but no user object
        if (data && data.user_id) return `User #${data.user_id}`;
        
        // Last resort
        return "Unknown User";
    };

    const generatePDF = async () => {
        try {
            console.log("Generating PDF with data:", inventoryData);
            
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
            
            // Add logo on the right side
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
                const logoHeight = 15;
                const logoWidth = 20;
                
                // Position logo
                doc.addImage(img, 'PNG', pageWidth - margin - logoWidth, margin + 4, logoWidth, logoHeight);
            } catch (imgErr) {
                console.error("Error adding logo:", imgErr);
                // Continue without the logo
            }
            
            // Title - centered
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("INVENTORY REPORT", pageWidth / 2, margin + 15, { align: "center" });
            
            // Add a horizontal line below the title and logo
            doc.setLineWidth(0.3);
            doc.line(margin, margin + 20, pageWidth - margin, margin + 20);
            
            // Inventory header info
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Inventory ID:", margin, margin + 30);
            doc.text("Created Date:", margin, margin + 37);
            doc.text("Last Updated:", margin, margin + 44);
            
            // Set values with normal font
            doc.setFont("helvetica", "normal");
            doc.text(inventoryData.id.toString(), margin + 30, margin + 30);
            doc.text(formatDateForDisplay(inventoryData.created_at), margin + 30, margin + 37);
            doc.text(formatDateForDisplay(inventoryData.updated_at), margin + 30, margin + 44);
            
            // Add a horizontal line below the header info
            doc.setLineWidth(0.3);
            doc.line(margin, margin + 50, pageWidth - margin, margin + 50);
            
            // Product Information section
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Product Information:", margin, margin + 60);
            
            doc.setFontSize(10);
            doc.text("Product ID:", margin, margin + 70);
            doc.text("Product Name:", margin, margin + 77);
            doc.text("Description:", margin, margin + 84);
            
            // Set product values with normal font
            doc.setFont("helvetica", "normal");
            doc.text(getSafeValue(inventoryData, 'product.id').toString(), margin + 30, margin + 70);
            doc.text(getSafeValue(inventoryData, 'product.name'), margin + 30, margin + 77);
            
            // Handle description with wrapping if needed
            const productDescription = getSafeValue(inventoryData, 'product.description');
            const descriptionLines = doc.splitTextToSize(productDescription, contentWidth - 30);
            doc.text(descriptionLines, margin + 30, margin + 84);
            
            // Determine Y position after description
            let yPos = margin + 84 + (descriptionLines.length * 7);
            
            // Add a horizontal line below the product info
            doc.setLineWidth(0.3);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 10;
            
            // Warehouse Information section
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Warehouse Information:", margin, yPos);
            yPos += 10;
            
            // Increase spacing for warehouse section with consistent label width
            const warehouseValueX = margin + 40; // Increase from 30 to 40 to avoid overlap
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Warehouse ID:", margin, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(getSafeValue(inventoryData, 'warehouse.id').toString(), warehouseValueX, yPos);
            yPos += 7;
            
            doc.setFont("helvetica", "bold");
            doc.text("Warehouse Name:", margin, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(getSafeValue(inventoryData, 'warehouse.name'), warehouseValueX, yPos);
            yPos += 7;
            
            doc.setFont("helvetica", "bold");
            doc.text("Warehouse Location:", margin, yPos);
            doc.setFont("helvetica", "normal");
            const warehouseAddress = getSafeValue(inventoryData, 'warehouse.address');
            const addressLines = doc.splitTextToSize(warehouseAddress, contentWidth - 40);
            doc.text(addressLines, warehouseValueX, yPos);
            yPos += (addressLines.length * 7);
            
            // Add a horizontal line below the warehouse info
            yPos += 3;
            doc.setLineWidth(0.3);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 10;
            
            // Inventory Details section
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Inventory Details:", margin, yPos);
            yPos += 10;
            
            // Increase spacing for inventory details section with consistent label width
            const inventoryValueX = margin + 40; // Increase from 30 to 40 to avoid overlap
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Current Quantity:", margin, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(inventoryData.quantity.toString(), inventoryValueX, yPos);
            yPos += 7;
            
            doc.setFont("helvetica", "bold");
            doc.text("Reorder Level:", margin, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(inventoryData.reorder_level.toString(), inventoryValueX, yPos);
            yPos += 7;
            
            doc.setFont("helvetica", "bold");
            doc.text("Description:", margin, yPos);
            doc.setFont("helvetica", "normal");
            const inventoryDescription = inventoryData.description || "N/A";
            const invDescLines = doc.splitTextToSize(inventoryDescription, contentWidth - 40);
            doc.text(invDescLines, inventoryValueX, yPos);
            yPos += (invDescLines.length * 7);
            
            // Add a horizontal line below the inventory details
            yPos += 3;
            doc.setLineWidth(0.3);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 10;
            
            // Additional Info
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Created By:", margin, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(getUserName(inventoryData), margin + 30, yPos);
            yPos += 7;
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Generated:", margin, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin + 30, yPos);
            yPos += 7;
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Generated By:", margin, yPos);
            doc.setFont("helvetica", "normal");
            doc.text("Maharat MCTC Inventory System", margin + 30, yPos);
            
            // Try to get inventory transactions if available
            try {
                console.log("Attempting to fetch inventory transactions for inventory ID:", inventoryId);
                
                // Try to get inventory transactions with proper filtering
                const transactionsResponse = await axios.get(`/api/v1/inventory-transactions`, {
                    params: {
                        filter: {
                            inventory_id: inventoryId
                        },
                        include: 'inventory.product,inventory.warehouse,user'
                    }
                });
                
                console.log("Transactions response:", transactionsResponse.data);
                
                if (transactionsResponse.data && Array.isArray(transactionsResponse.data.data) && transactionsResponse.data.data.length > 0) {
                    // Add new page for transactions
                    doc.addPage();
                    
                    // Add logo on the right side
                    try {
                        const img = new Image();
                        img.src = '/images/MCTC Logo.png';
                        await new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = reject;
                            setTimeout(resolve, 3000);
                        });
                        
                        doc.addImage(img, 'PNG', pageWidth - margin - logoWidth, margin + 4, logoWidth, logoHeight);
                    } catch (imgErr) {
                        console.error("Error adding logo on transaction page:", imgErr);
                    }
                    
                    // Title for transactions page
                    doc.setFontSize(14);
                    doc.setFont("helvetica", "bold");
                    doc.text("INVENTORY TRANSACTIONS", pageWidth / 2, margin + 15, { align: "center" });
                    
                    // Add horizontal line
                    doc.setLineWidth(0.3);
                    doc.line(margin, margin + 20, pageWidth - margin, margin + 20);
                    
                    // Basic inventory info for reference
                    doc.setFontSize(10);
                    doc.setFont("helvetica", "bold");
                    doc.text(`Inventory ID: ${inventoryData.id}`, margin, margin + 30);
                    doc.text(`Product: ${getSafeValue(inventoryData, 'product.name')}`, margin + 60, margin + 30);
                    doc.text(`Warehouse: ${getSafeValue(inventoryData, 'warehouse.name')}`, margin + 120, margin + 30);
                    
                    // Horizontal line
                    doc.setLineWidth(0.3);
                    doc.line(margin, margin + 35, pageWidth - margin, margin + 35);
                    
                    // Transactions table
                    const transactionsHeaders = ["Date", "Type", "Previous Qty", "Change", "New Qty", "Reference", "User", "Notes"];
                    
                    // Map transactions to table rows
                    const transactionsRows = transactionsResponse.data.data.map(item => [
                        formatDateForDisplay(item.created_at),
                        item.transaction_type || "Update",
                        item.previous_quantity?.toString() || "N/A",
                        item.quantity?.toString() || "N/A",
                        item.new_quantity?.toString() || "N/A",
                        item.reference_number || "N/A",
                        getSafeValue(item, 'user.name') || `User #${item.user_id}` || "N/A",
                        item.notes || "N/A"
                    ]);
                    
                    // Add transactions table
                    autoTable(doc, {
                        head: [transactionsHeaders],
                        body: transactionsRows,
                        startY: margin + 40,
                        margin: { left: margin, right: margin },
                        styles: { 
                            fontSize: 8, 
                            cellPadding: 2,
                            overflow: 'linebreak',
                            lineWidth: 0.1
                        },
                        headStyles: { 
                            fillColor: [199, 231, 222], 
                            textColor: [0, 0, 0], 
                            fontStyle: 'bold',
                            halign: 'center'
                        },
                        columnStyles: {
                            0: { cellWidth: 25 }, // Date
                            1: { cellWidth: 20 }, // Type
                            2: { cellWidth: 20 }, // Previous Qty
                            3: { cellWidth: 15 }, // Change
                            4: { cellWidth: 15 }, // New Qty
                            5: { cellWidth: 25 }, // Reference
                            6: { cellWidth: 25 }, // User
                            7: { cellWidth: 35 }  // Notes
                        },
                        didDrawPage: (data) => {
                            // Footer on transaction page
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
                    });
                }
            } catch (transactionError) {
                console.warn("Could not fetch inventory transactions:", transactionError);
                // Continue without transactions data
            }
            
            // Add footer on all pages
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
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
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    pageWidth / 2,
                    pageHeight - margin,
                    { align: "center" }
                );
            }
            
            // Save the PDF
            const pdfBlob = doc.output('blob');
            const pdfFile = new File([pdfBlob], `Inventory_${inventoryId}.pdf`, { type: 'application/pdf' });
            
            // Open the PDF in a new tab immediately
            const fileUrl = URL.createObjectURL(pdfBlob);
            window.open(fileUrl, '_blank');
            
            // Save PDF to server using FormData
            try {
                console.log("Preparing to upload PDF file for inventory ID:", inventoryId);
                
                const formData = new FormData();
                formData.append('pdf_document', pdfFile);
                
                console.log("Uploading PDF file...");
                
                // Upload the PDF to the server
                const uploadResponse = await axios.post(`/api/v1/inventories/${inventoryId}/upload-pdf`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                console.log("Upload response received:", uploadResponse.data);
                
                if (uploadResponse.data?.success) {
                    console.log("PDF document saved successfully with URL:", uploadResponse.data?.pdf_url);
                    if (onGenerated && typeof onGenerated === 'function') {
                        onGenerated(uploadResponse.data?.pdf_url || uploadResponse.data?.document_url);
                    }
                } else {
                    console.warn("PDF document generated but server response unclear:", uploadResponse.data);
                    if (onGenerated && typeof onGenerated === 'function') {
                        onGenerated("success");
                    }
                }
            } catch (uploadError) {
                console.error("Error uploading PDF document:", uploadError);
                
                if (uploadError.response) {
                    console.error("Upload error response data:", uploadError.response.data);
                    console.error("Upload error status:", uploadError.response.status);
                }
                
                // Try a fallback update method to set the pdf_document field
                try {
                    console.log("Attempting fallback update for inventory PDF document...");
                    
                    // Use a simple update to just set the filename in the database
                    const fallbackResponse = await axios.put(`/api/v1/inventories/${inventoryId}`, {
                        pdf_document: `Inventory_${inventoryId}.pdf`
                    });
                    
                    console.log("Fallback update response:", fallbackResponse.data);
                    
                    if (fallbackResponse.data && fallbackResponse.data.data) {
                        console.log("Fallback update completed successfully");
                        if (onGenerated && typeof onGenerated === 'function') {
                            onGenerated("success_fallback");
                        }
                    } else {
                        console.warn("Fallback update completed but response unclear");
                        if (onGenerated && typeof onGenerated === 'function') {
                            onGenerated("downloaded_only", uploadError);
                        }
                    }
                } catch (fallbackError) {
                    console.error("Fallback update failed:", fallbackError);
                    
                    if (fallbackError.response) {
                        console.error("Fallback error response:", fallbackError.response.data);
                    }
                    
                    // The PDF file was still generated and downloaded by the user
                    if (onGenerated && typeof onGenerated === 'function') {
                        onGenerated("downloaded_only", uploadError);
                    }
                }
            }
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF file. Please try again.");
            
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