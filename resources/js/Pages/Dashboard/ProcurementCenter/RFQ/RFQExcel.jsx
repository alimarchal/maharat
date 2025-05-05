import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

export default function RFQExcel({ rfqId, onGenerated }) {
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
                    
                    // If we have cost_center_id but no cost center data, fetch it
                    if (data.cost_center_id && 
                        (!data.costCenter || !data.costCenter.name) && 
                        (!data.cost_center || !data.cost_center.name)) {
                        try {
                            const costCenterResponse = await axios.get(`/api/v1/cost-centers/${data.cost_center_id}`);
                            if (costCenterResponse.data?.data) {
                                data.cost_center = costCenterResponse.data.data;
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
                            }
                        } catch (e) {
                            console.error("Error fetching sub cost center:", e);
                        }
                    }
                    
                    // If payment_type is a number (status ID) but not an object, fetch it
                    if (data.payment_type && typeof data.payment_type === 'number' && 
                        (!data.paymentType || !data.paymentType.name)) {
                        try {
                            const paymentTypeResponse = await axios.get(`/api/v1/statuses/${data.payment_type}`);
                            if (paymentTypeResponse.data?.data) {
                                data.paymentType = paymentTypeResponse.data.data;
                            }
                        } catch (e) {
                            console.error("Error fetching payment type:", e);
                        }
                    }
                    
                    setRfqData(data);
                } else {
                    setError("Invalid response format");
                }
            } catch (error) {
                console.error("Error fetching RFQ data for Excel:", error);
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
            generateExcel();
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

    const generateExcel = async () => {
        try {
            // Extract values once here at the top for clarity
            const categoryName = getSafeValue(rfqData, 'categories.0.name') || 
                                getSafeValue(rfqData, 'category.name') || 
                                getSafeValue(rfqData, 'category_name', 'N/A');
            
            // Cost Center value
            let costCenterName = 'N/A';
            if (rfqData.costCenter && rfqData.costCenter.name) {
                costCenterName = rfqData.costCenter.name;
            } else if (rfqData.cost_center && rfqData.cost_center.name) {
                costCenterName = rfqData.cost_center.name;
            } else if (rfqData.cost_center_id) {
                costCenterName = `ID: ${rfqData.cost_center_id}`;
            }
            
            // Sub Cost Center value
            let subCostCenterName = 'N/A';
            if (rfqData.subCostCenter && rfqData.subCostCenter.name) {
                subCostCenterName = rfqData.subCostCenter.name;
            } else if (rfqData.sub_cost_center && rfqData.sub_cost_center.name) {
                subCostCenterName = rfqData.sub_cost_center.name;
            } else if (rfqData.sub_cost_center_id) {
                subCostCenterName = `ID: ${rfqData.sub_cost_center_id}`;
            }
            
            // Payment Type value
            let paymentTypeName = 'N/A';
            if (rfqData.paymentType && rfqData.paymentType.name) {
                paymentTypeName = rfqData.paymentType.name;
            } else if (typeof rfqData.payment_type === 'object' && rfqData.payment_type && rfqData.payment_type.name) {
                paymentTypeName = rfqData.payment_type.name;
            } else if (rfqData.payment_type) {
                paymentTypeName = `ID: ${rfqData.payment_type}`;
            }
            
            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            
            // Add document properties
            wb.Props = {
                Title: `RFQ ${rfqData.rfq_number || rfqId}`,
                Subject: "Request for Quotation",
                Author: "Maharat MCTC",
                CreatedDate: new Date(),
                Company: "Maharat MCTC",
                Category: "Procurement Documents"
            };
            
            // Format header data with strict data typing
            const headerData = [
                ["REQUEST FOR QUOTATION"],
                [""],  // Empty row for spacing
                ["RFQ #:", String(rfqData.rfq_number || 'N/A')],
                ["Issue Date:", String(formatDateForDisplay(rfqData.request_date))],
                ["Closing Date:", String(formatDateForDisplay(rfqData.closing_date))],
                [""],  // Empty row for spacing
                ["Organization Details:"],
                ["Name:", String(getSafeValue(rfqData, 'organization_name'))],
                ["Email:", String(getSafeValue(rfqData, 'organization_email'))],
                ["City:", String(getSafeValue(rfqData, 'city'))],
                ["Warehouse:", String(getSafeValue(rfqData, 'warehouse.name'))],
                ["Contact:", String(getSafeValue(rfqData, 'contact_number'))],
                [""],  // Empty row for spacing
                ["Additional Information:"],
                ["Category:", String(categoryName)],
                ["Cost Center:", String(costCenterName)],
                ["Sub Cost Center:", String(subCostCenterName)],
                ["Payment Type:", String(paymentTypeName)],
                ["Status:", String(getSafeValue(rfqData, 'status.name'))],
                [""],  // Empty row for spacing
                ["Generated:", `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
                ["Generated By:", "Maharat MCTC Procurement System"],
            ];
            
            // Create the header worksheet
            const wsHeader = XLSX.utils.aoa_to_sheet(headerData);
            
            // Apply cell styles - A way to add style information that will be used when opened in Excel
            // NOTE: These aren't real Excel styles but will be interpreted by Excel when opened
            
            // Style the title
            if (!wsHeader['!cols']) wsHeader['!cols'] = [];
            wsHeader['!cols'][0] = { wch: 20 }; // Column A width
            wsHeader['!cols'][1] = { wch: 40 }; // Column B width
            
            // Apply some styling to the header (merging cells for the title)
            wsHeader['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Merge title cells
            ];
            
            // Add header worksheet to workbook
            XLSX.utils.book_append_sheet(wb, wsHeader, "RFQ Information");
            
            // Create items table if items exist
            if (rfqData.items && Array.isArray(rfqData.items) && rfqData.items.length > 0) {
                // Table headers
                const itemsHeaders = [
                    ["Items List"],
                    [""],  // Empty row for spacing
                    ["#", "Product", "Description", "Unit", "Quantity", "Brand", "Expected Delivery Date"]
                ];
                
                // Map the items to table rows
                const itemsData = rfqData.items.map((item, index) => {
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
                
                // Combine headers and data
                const tableData = [...itemsHeaders, ...itemsData];
                
                // Create the items worksheet
                const wsItems = XLSX.utils.aoa_to_sheet(tableData);
                
                // Apply some styling (merging cells for the title)
                wsItems['!merges'] = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Merge title cells
                ];
                
                // Set column widths
                wsItems['!cols'] = [
                    { wch: 5 },  // # column
                    { wch: 20 }, // Product
                    { wch: 40 }, // Description
                    { wch: 15 }, // Unit
                    { wch: 10 }, // Quantity
                    { wch: 15 }, // Brand
                    { wch: 20 }, // Expected Delivery Date
                ];
                
                // Add items worksheet to workbook
                XLSX.utils.book_append_sheet(wb, wsItems, "Items");
            }

            // Add a status history worksheet if available
            if (rfqData.statusLogs && rfqData.statusLogs.length > 0) {
                const historyHeaders = [
                    ["Status History"],
                    [""],
                    ["Date", "Status", "Changed By", "Remarks"]
                ];

                const historyData = rfqData.statusLogs.map(log => [
                    new Date(log.created_at).toLocaleString(),
                    getSafeValue(log, 'status.name'),
                    getSafeValue(log, 'changedBy.name'),
                    log.remarks || 'N/A'
                ]);

                const historySheet = XLSX.utils.aoa_to_sheet([...historyHeaders, ...historyData]);
                
                historySheet['!merges'] = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Merge title cells
                ];
                
                historySheet['!cols'] = [
                    { wch: 20 }, // Date
                    { wch: 15 }, // Status
                    { wch: 20 }, // Changed By
                    { wch: 40 }, // Remarks
                ];
                
                XLSX.utils.book_append_sheet(wb, historySheet, "Status History");
            }
            
            // Generate Excel file
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const excelFile = new File([excelBlob], `RFQ_${rfqData.rfq_number || rfqId}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            // Create temporary URL and open Excel file in new tab
            const fileUrl = URL.createObjectURL(excelBlob);
            window.open(fileUrl, '_blank');
            
            // Save Excel file to server
            const formData = new FormData();
            formData.append('excel_attachment', excelFile);
            
            const uploadResponse = await axios.post(`/api/v1/rfqs/${rfqId}/upload-excel`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (uploadResponse.data?.success) {
                if (onGenerated && typeof onGenerated === 'function') {
                    onGenerated(uploadResponse.data?.excel_url);
                }
            } else {
                console.warn("Excel file generated but not saved to server");
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