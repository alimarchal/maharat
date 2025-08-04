import React, { useEffect, useState } from "react";
import axios from "axios";
import ExcelJS from "exceljs";

export default function InventoryExcel({ inventoryId, onGenerated }) {
    const [inventoryData, setInventoryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchInventoryData = async () => {
            try {
                setLoading(true);
                console.log(`Fetching inventory data for ID: ${inventoryId}, Type: ${typeof inventoryId}`);
                
                // Use only allowed includes from the InventoryParameters
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
                    
                    // Add detailed user info logging
                    if (data.user) {
                        console.log("User data available:", {
                            id: data.user.id,
                            name: data.user.name,
                            firstname: data.user.firstname,
                            lastname: data.user.lastname,
                            email: data.user.email
                        });
                    } else if (data.user_id) {
                        console.log("User ID available but no user object:", data.user_id);
                    } else {
                        console.log("No user information available in response");
                    }
                    
                    setInventoryData(data);
                } else {
                    console.error("Invalid response format:", response.data);
                    setError("Invalid response format");
                }
            } catch (error) {
                console.error(`Error fetching inventory data for ID: ${inventoryId}`, error);
                
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
            console.log(`useEffect triggered with inventoryId: ${inventoryId}`);
            fetchInventoryData();
        } else {
            console.warn("No inventory ID provided");
        }
    }, [inventoryId]);

    useEffect(() => {
        if (!loading && !error && inventoryData) {
            generateExcel();
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

    const generateExcel = async () => {
        try {
            // Create workbook
            const workbook = new ExcelJS.Workbook();
            
            // Add document properties
            workbook.creator = "Maharat MCTC";
            workbook.lastModifiedBy = "Maharat MCTC";
            workbook.created = new Date();
            workbook.modified = new Date();
            workbook.title = `Inventory Report - ${getSafeValue(inventoryData, 'product.name', `ID: ${inventoryId}`)}`;
            workbook.subject = "Inventory Information";
            workbook.category = "Inventory Documents";
            
            // Create the header worksheet
            const headerWorksheet = workbook.addWorksheet("Inventory Information");
            
            // Format header data
            const headerData = [
                ["INVENTORY REPORT"],
                [""],  // Empty row for spacing
                ["Inventory ID:", inventoryData.id.toString()],
                ["Created Date:", formatDateForDisplay(inventoryData.created_at)],
                ["Last Updated:", formatDateForDisplay(inventoryData.updated_at)],
                [""],  // Empty row for spacing
                ["Product Information:"],
                ["Product ID:", getSafeValue(inventoryData, 'product.id').toString()],
                ["Product Name:", getSafeValue(inventoryData, 'product.name')],
                ["Product Description:", getSafeValue(inventoryData, 'product.description')],
                [""],  // Empty row for spacing
                ["Warehouse Information:"],
                ["Warehouse ID:", getSafeValue(inventoryData, 'warehouse.id').toString()],
                ["Warehouse Name:", getSafeValue(inventoryData, 'warehouse.name')],
                ["Warehouse Location:", getSafeValue(inventoryData, 'warehouse.address')],
                [""],  // Empty row for spacing
                ["Inventory Details:"],
                ["Current Quantity:", inventoryData.quantity.toString()],
                ["Reorder Level:", inventoryData.reorder_level.toString()],
                ["Description:", inventoryData.description || "N/A"],
                [""],  // Empty row for spacing
                ["Created By:", getUserName(inventoryData)],
                [""],  // Empty row for spacing
                ["Generated:", `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
                ["Generated By:", "Maharat MCTC Inventory System"],
            ];
            
            // Add rows to the worksheet
            headerData.forEach(row => {
                headerWorksheet.addRow(row);
            });
            
            // Set column widths
            headerWorksheet.getColumn(1).width = 25;
            headerWorksheet.getColumn(2).width = 50;
            
            // Merge cells for the title
            headerWorksheet.mergeCells('A1:C1');
            
            // Try to get additional inventory data if available - using the proper API endpoint structure
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
                    // Table headers for inventory transactions
                    const transactionsHeaders = [
                        ["Inventory Transactions"],
                        [""],  // Empty row for spacing
                        ["Date", "Type", "Previous Qty", "Change", "New Qty", "Reference", "Notes"]
                    ];
                    
                    // Map the transactions items to table rows (removed user which might not be available)
                    const transactionsData = transactionsResponse.data.data.map((item, index) => [
                        formatDateForDisplay(item.created_at),
                        item.transaction_type || "Update",
                        item.previous_quantity?.toString() || "N/A",
                        item.quantity?.toString() || "N/A",
                        item.new_quantity?.toString() || "N/A",
                        item.reference_number || "N/A",
                        item.notes || "N/A"
                    ]);
                    
                    // Combine headers and data
                    const tableData = [...transactionsHeaders, ...transactionsData];
                    
                    // Create the transactions worksheet
                    const transactionsWorksheet = workbook.addWorksheet("Transactions");
                    
                    // Add rows to the worksheet
                    tableData.forEach(row => {
                        transactionsWorksheet.addRow(row);
                    });
                    
                    // Merge cells for the title
                    transactionsWorksheet.mergeCells('A1:G1');
                    
                    // Set column widths
                    transactionsWorksheet.getColumn(1).width = 20; // Date
                    transactionsWorksheet.getColumn(2).width = 15; // Type
                    transactionsWorksheet.getColumn(3).width = 15; // Previous Qty
                    transactionsWorksheet.getColumn(4).width = 10; // Change
                    transactionsWorksheet.getColumn(5).width = 10; // New Qty
                    transactionsWorksheet.getColumn(6).width = 15; // Reference
                    transactionsWorksheet.getColumn(7).width = 30; // Notes
                } else {
                    console.log("No transaction data found or empty array returned");
                }
            } catch (transactionsError) {
                console.warn("Could not fetch inventory transactions:", transactionsError);
                
                // Additional error details
                if (transactionsError.response) {
                    console.warn("Transactions error response:", transactionsError.response.data);
                }
                
                // Continue without the transactions data
            }
            
            // Generate Excel file
            const excelBuffer = await workbook.xlsx.writeBuffer();
            const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const excelFile = new File([excelBlob], `Inventory_${inventoryId}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            // Create temporary URL and open Excel file in new tab
            const fileUrl = URL.createObjectURL(excelBlob);
            window.open(fileUrl, '_blank');
            
            // Save Excel file to server using FormData and following the upload-excel endpoint pattern
            try {
                console.log("Preparing to upload Excel file for inventory ID:", inventoryId);
                
                const formData = new FormData();
                formData.append('excel_document', excelFile);
                
                console.log("Uploading Excel file...");
                
                // Following the pattern of RFQ excel upload in api.php
                const uploadResponse = await axios.post(`/api/v1/inventories/${inventoryId}/upload-excel`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                console.log("Upload response received:", uploadResponse.data);
                
                if (uploadResponse.data?.success) {
                    console.log("Excel document saved successfully with URL:", uploadResponse.data?.excel_url);
                    if (onGenerated && typeof onGenerated === 'function') {
                        onGenerated(uploadResponse.data?.excel_url || uploadResponse.data?.document_url);
                    }
                } else {
                    console.warn("Excel document generated but server response unclear:", uploadResponse.data);
                    if (onGenerated && typeof onGenerated === 'function') {
                        onGenerated("success");
                    }
                }
            } catch (uploadError) {
                console.error("Error uploading Excel document:", uploadError);
                
                if (uploadError.response) {
                    console.error("Upload error response data:", uploadError.response.data);
                    console.error("Upload error status:", uploadError.response.status);
                }
                
                // Try a fallback update method to set the excel_document field
                try {
                    console.log("Attempting fallback update for inventory Excel document...");
                    
                    // Use a simple update to just set the filename in the database
                    const fallbackResponse = await axios.put(`/api/v1/inventories/${inventoryId}`, {
                        excel_document: `Inventory_${inventoryId}.xlsx`
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
                    
                    // The Excel file was still generated and downloaded by the user
                    if (onGenerated && typeof onGenerated === 'function') {
                        onGenerated("downloaded_only", uploadError);
                    }
                }
            }
            
        } catch (error) {
            console.error("Error generating Excel:", error);
            alert("Failed to generate Excel file. Please try again.");
            
            // Notify parent component about the error
            if (onGenerated && typeof onGenerated === 'function') {
                onGenerated(null, error);
            }
        }
    };

    if (loading) {
        return <div>Generating Excel, please wait...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return null; // This component doesn't render anything visible
} 