import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip, faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { router } from "@inertiajs/react";
import InputFloating from "../../../../Components/InputFloating";
import PartialDeliveryModal from "./PartialDeliveryModal";
import { usePage } from "@inertiajs/react";

const CreateGRNModal = ({ isOpen, onClose, grnsData }) => {
    const user_id = usePage().props.auth.user.id;

    const [formData, setFormData] = useState({
        delivery_note_number: "",
        receiver_name: "",
        attachment: null,
        attachment_name: "",
    });

    const [quantityDelivered, setQuantityDelivered] = useState({});
    const [previouslyDelivered, setPreviouslyDelivered] = useState({});
    const [error, setError] = useState({});
    const [loading, setLoading] = useState(false);
    const [rfqItems, setRfqItems] = useState([]);
    const [showPartialDeliveryModal, setShowPartialDeliveryModal] = useState(false);
    const [partialItems, setPartialItems] = useState([]);

    const currentDate = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit", 
        year: "numeric"
    });

    useEffect(() => {
        if (grnsData) {
            const itemsFromRfq = grnsData?.rfq?.items;
            const itemsFromQuotationRfq = grnsData?.quotation?.rfq?.items;
            const itemsFromRequestForQuotation = grnsData?.requestForQuotation?.items;
            
            const items = itemsFromRfq || itemsFromQuotationRfq || itemsFromRequestForQuotation || [];
            setRfqItems(items);
            
            console.log('GRN Modal Data:', {
                grnsData,
                items
            });
            
            // Check if this is a partially delivered purchase order
            // We need to check if there are any GRNs with "Partially Delivered" status for this PO
            // Pass the items directly to avoid timing issues
            loadExistingGRNs(grnsData.id, items);
        }
    }, [grnsData]);

    const loadExistingGRNs = async (purchaseOrderId, currentRfqItems) => {
        try {
            const response = await axios.get(`/api/v1/grns?filter[purchase_order_id]=${purchaseOrderId}&include=receiveGoods`);
            const existingGRNs = response.data.data || [];
            
            console.log('Existing GRNs:', existingGRNs);
            console.log('Current RFQ Items:', currentRfqItems);
            
            // Check if there are any partially delivered GRNs
            // We'll check both the status field and the receive_goods data
            const hasPartiallyDelivered = existingGRNs.some(grn => {
                // Check if GRN status is "Partially Delivered"
                if (grn.status === 'Partially Delivered') {
                    return true;
                }
                
                // Fallback: Check if any receive_goods show partial delivery
                if (grn.receive_goods && grn.receive_goods.length > 0) {
                    return grn.receive_goods.some(receiveGood => {
                        const delivered = parseFloat(receiveGood.quantity_delivered) || 0;
                        const quoted = parseFloat(receiveGood.quantity_quoted) || 0;
                        return delivered > 0 && delivered < quoted;
                    });
                }
                
                return false;
            });
            
            if (hasPartiallyDelivered && currentRfqItems.length > 0) {
                // Calculate total delivered quantities for each item
                const deliveredQuantities = {};
                
                // Use the GRN quantity field directly (not receive_goods data)
                existingGRNs.forEach(grn => {
                    if (currentRfqItems.length > 0) {
                        const itemId = currentRfqItems[0].id;
                        const grnQuantity = parseFloat(grn.quantity) || 0;
                        deliveredQuantities[itemId] = grnQuantity;
                        
                        console.log('Processing GRN quantity:', {
                            itemId,
                            grnQuantity,
                            grnId: grn.id,
                            grnStatus: grn.status,
                            currentRfqItems: currentRfqItems
                        });
                    }
                });
                
                console.log('Delivered quantities calculated:', deliveredQuantities);
                
                // Update RFQ items to show remaining quantities instead of original ordered quantities
                console.log('Before mapping rfqItems:', currentRfqItems);
                console.log('Delivered quantities for mapping:', deliveredQuantities);
                
                const updatedRfqItems = currentRfqItems.map(item => {
                    const deliveredQty = deliveredQuantities[item.id] || 0;
                    const originalQty = parseInt(item.quantity) || 0;
                    const remainingQty = originalQty - deliveredQty;
                    
                    console.log('Mapping item:', {
                        itemId: item.id,
                        originalQty,
                        deliveredQty,
                        remainingQty,
                        item
                    });
                    
                    return {
                        ...item,
                        original_quantity: originalQty, // Store original quantity
                        quantity: remainingQty > 0 ? remainingQty : 0 // Show remaining quantity
                    };
                });
                
                console.log('Updated RFQ items:', updatedRfqItems);
                
                // Update the RFQ items with remaining quantities
                setRfqItems(updatedRfqItems);
                
                // For partially delivered items, we want to show previously delivered quantities
                // but the input field should be empty for additional quantities
                const additionalQuantities = {};
                Object.keys(deliveredQuantities).forEach(itemId => {
                    additionalQuantities[itemId] = 0; // Start with 0 for additional quantities
                });
                
                // Store both delivered and additional quantities
                setPreviouslyDelivered(deliveredQuantities);
                setQuantityDelivered(additionalQuantities);
                
                console.log('Loaded existing GRNs for partial delivery:', {
                    purchaseOrderId,
                    existingGRNs,
                    deliveredQuantities,
                    additionalQuantities,
                    updatedRfqItems,
                    hasPartiallyDelivered
                });
            }
        } catch (error) {
            console.error('Error loading existing GRNs:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError({ ...error, [e.target.name]: "" });
    };

    const handleQuantityChange = (e, itemId) => {
        const { value } = e.target;
        setQuantityDelivered((prev) => ({
            ...prev,
            [itemId]: value,
        }));
        setError((prev) => ({ ...prev, [itemId]: "" }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({
                ...prev,
                attachment: file,
                attachment_name: file.name,
            }));
            setError((prev) => ({ ...prev, attachment: "" }));
        }
    };

    const validateForm = () => {
        let newErrors = {};
        let isValid = true;

        rfqItems.forEach((item) => {
            const deliveredQty = parseInt(quantityDelivered[item.id]) || 0;
            const orderedQty = parseInt(item.quantity) || 0;
            
            if (!quantityDelivered[item.id] || deliveredQty <= 0) {
                newErrors[item.id] = "Quantity is required and must be greater than 0.";
                isValid = false;
            } else if (deliveredQty > orderedQty) {
                newErrors[item.id] = `Delivered quantity cannot exceed ordered quantity of ${orderedQty}`;
                isValid = false;
            }
        });

        if (!formData.delivery_note_number) {
            newErrors.delivery_note_number = "Delivery Note Number is required.";
            isValid = false;
        }
        if (!formData.receiver_name) {
            newErrors.receiver_name = "Receiver Name is required.";
            isValid = false;
        }
        if (!formData.attachment) {
            newErrors.attachment = "Attachment is required.";
            isValid = false;
        }

        setError(newErrors);
        return isValid;
    };

    const checkForPartialDelivery = () => {
        const partialDeliveryItems = [];
        
        rfqItems.forEach((item) => {
            const orderedQty = parseInt(item.quantity) || 0;
            const deliveredQty = parseInt(quantityDelivered[item.id]) || 0;
            
            if (orderedQty !== deliveredQty) {
                partialDeliveryItems.push({
                    id: item.id,
                    itemName: item.item_name || item.product?.name || "N/A",
                    description: item.description || item.product?.description || "N/A",
                    quantityOrdered: orderedQty,
                    quantityDelivered: deliveredQty,
                    estimatedUnitPrice: item.unit_price || 0, // Add this field to your items data
                });
            }
        });

        return partialDeliveryItems;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        // Check for partial delivery before proceeding
        const partialDeliveryItems = checkForPartialDelivery();
        
        if (partialDeliveryItems.length > 0) {
            setPartialItems(partialDeliveryItems);
            setShowPartialDeliveryModal(true);
            return;
        }

        // If no partial delivery, proceed normally
        await processGRNCreation("complete_delivery");
    };

    const handlePartialDeliveryConfirm = async (deliveryOption) => {
        setShowPartialDeliveryModal(false);
        await processGRNCreation(deliveryOption);
    };

    const processGRNCreation = async (deliveryOption) => {
        setLoading(true);
        try {
            // Check if this is a partially delivered purchase order
            const isPartiallyDelivered = Object.keys(previouslyDelivered).length > 0;
            
            const totalDeliveredQuantity = rfqItems.reduce((sum, item) => {
                const additionalQty = parseInt(quantityDelivered[item.id]) || 0;
                const previouslyDeliveredQty = previouslyDelivered[item.id] || 0;
                
                if (isPartiallyDelivered) {
                    // For partially delivered items, add additional quantity to previously delivered
                    return sum + additionalQty;
                } else {
                    // For new items, use the delivered quantity as is
                    return sum + additionalQty;
                }
            }, 0);

            let grnId;
            
            if (isPartiallyDelivered) {
                // Update existing GRN instead of creating new one
                const existingGRN = await axios.get(`/api/v1/grns?filter[purchase_order_id]=${grnsData.id}&filter[status]=Partially Delivered`);
                const existingGRNData = existingGRN.data.data?.[0];
                
                if (existingGRNData) {
                    // Calculate new total quantity (existing + additional)
                    const newTotalQuantity = parseFloat(existingGRNData.quantity) + totalDeliveredQuantity;
                    
                    // Determine new status based on completion
                    const originalOrderedQty = rfqItems.reduce((sum, item) => {
                        return sum + (parseInt(item.original_quantity || item.quantity) || 0);
                    }, 0);
                    
                    const newStatus = newTotalQuantity >= originalOrderedQty ? 'Fully Delivered' : 'Partially Delivered';
                    
                    const updatePayload = {
                        quantity: newTotalQuantity,
                        status: newStatus,
                        delivery_date: currentDate,
                        delivery_status: deliveryOption, // Add delivery_status to update payload
                    };
                    
                    console.log('GRN Status Update Details:', {
                        existingGRNId: existingGRNData.id,
                        existingQuantity: existingGRNData.quantity,
                        additionalQuantity: totalDeliveredQuantity,
                        newTotalQuantity,
                        originalOrderedQty,
                        newStatus,
                        updatePayload
                    });
                    
                    console.log('Updating existing GRN:', {
                        existingGRNId: existingGRNData.id,
                        existingQuantity: existingGRNData.quantity,
                        additionalQuantity: totalDeliveredQuantity,
                        newTotalQuantity,
                        newStatus,
                        originalOrderedQty
                    });
                    
                    await axios.put(`/api/v1/grns/${existingGRNData.id}`, updatePayload);
                    grnId = existingGRNData.id;
                    
                    console.log('GRN updated successfully, will trigger material request status update after inventory update');
                } else {
                    throw new Error('Existing partially delivered GRN not found');
                }
            } else {
                // Create new GRN for first-time delivery
                const grnsPayload = {
                    purchase_order_id: grnsData.id,
                    quotation_id: grnsData.quotation_id,
                    delivery_date: currentDate,
                    quantity: totalDeliveredQuantity,
                    delivery_status: deliveryOption,
                };
                
                console.log('=== FRONTEND: CREATING NEW GRN ===', {
                    deliveryOption: deliveryOption,
                    grnsPayload: grnsPayload,
                    note: 'About to send to backend'
                });
                
                const grnResponse = await axios.post("/api/v1/grns", grnsPayload);
                grnId = grnResponse.data.data?.id;
                console.log('=== FRONTEND: NEW GRN CREATED ===', {
                    grnId: grnId,
                    deliveryOption: deliveryOption,
                    grnData: grnResponse.data.data
                });
            }

            // Handle receive goods records
            for (const item of rfqItems) {
                const additionalQty = quantityDelivered[item.id];
                if (parseInt(additionalQty) > 0) {
                    if (isPartiallyDelivered) {
                        // Update existing receive goods record
                        const existingReceiveGoods = await axios.get(`/api/v1/grn-receive-goods?filter[grn_id]=${grnId}`);
                        const existingRecord = existingReceiveGoods.data.data?.[0];
                        
                        if (existingRecord) {
                            // Calculate new total delivered quantity
                            const newTotalDelivered = parseFloat(existingRecord.quantity_delivered) + parseInt(additionalQty);
                            
                            const updatePayload = {
                                quantity_delivered: newTotalDelivered,
                                receiver_name: formData.receiver_name,
                                delivery_date: currentDate,
                            };
                            
                            console.log('Updating existing receive goods:', {
                                recordId: existingRecord.id,
                                existingDelivered: existingRecord.quantity_delivered,
                                additionalQty,
                                newTotalDelivered
                            });
                            
                            await axios.put(`/api/v1/grn-receive-goods/${existingRecord.id}`, updatePayload);
                        } else {
                            throw new Error('Existing receive goods record not found');
                        }
                    } else {
                        // Create new receive goods record for first-time delivery
                        const grnsGoodsPayload = {
                            supplier_id: grnsData.supplier_id,
                            grn_id: grnId,
                            purchase_order_id: grnsData.id,
                            quotation_id: grnsData.quotation_id,
                            quantity_quoted: item.quantity,
                            due_delivery_date: currentDate,
                            receiver_name: formData.receiver_name,
                            upc: grnsData.supplier?.upc || null,
                            quantity_delivered: parseInt(additionalQty),
                            delivery_date: currentDate,
                            delivery_status: deliveryOption,
                        };
                        
                        console.log('Creating new receive goods:', {
                            itemId: item.id,
                            quotedQty: item.quantity,
                            deliveredQty: additionalQty
                        });
                        
                        await axios.post("/api/v1/grn-receive-goods", grnsGoodsPayload);
                    }
                }
            }

            // Update inventory - this happens for all delivery options including partial delivery
            for (const item of rfqItems) {
                const additionalQty = parseInt(quantityDelivered[item.id]) || 0;
                if (additionalQty > 0) {
                    const warehouseId = grnsData?.warehouse_id || 
                                    grnsData?.warehouse?.id || 
                                    grnsData?.rfq?.warehouse_id || 
                                    grnsData?.rfq?.warehouse?.id ||
                                    grnsData?.quotation?.rfq?.warehouse_id || 
                                    grnsData?.quotation?.rfq?.warehouse?.id ||
                                    grnsData?.requestForQuotation?.warehouse_id ||
                                    grnsData?.requestForQuotation?.warehouse?.id;
                    
                    const inventoryPayload = {
                        warehouse_id: warehouseId,
                        quantity: additionalQty,
                        reorder_level: parseInt(item.quantity),
                        description: item.description,
                    };
                    
                    console.log(`Updating inventory for product ${item?.product_id}:`, {
                        deliveryOption,
                        additionalQty,
                        warehouseId,
                        inventoryPayload,
                        isPartiallyDelivered
                    });
                    
                    await axios.post(
                        `/api/v1/inventories/product/${item?.product_id}/stock-in`,
                        inventoryPayload
                    );
                }
            }

            // Trigger material request status update after inventory update
            if (isPartiallyDelivered) {
                console.log('Triggering material request status update after inventory update for GRN:', grnId);
                try {
                    await axios.post(`/api/v1/grns/${grnId}/update-material-request-status`);
                    console.log('Material request status update completed');
                } catch (error) {
                    console.error('Failed to update material request status:', error);
                }
            }

            // Create external delivery note
            const formDataToSend = new FormData();
            formDataToSend.append("delivery_note_number", formData.delivery_note_number);
            formDataToSend.append("grn_id", grnId);
            formDataToSend.append("purchase_order_id", grnsData.id);
            formDataToSend.append("attachment", formData.attachment);
            formDataToSend.append("attachment_name", formData.attachment_name);

            await axios.post("/api/v1/external-delivery-notes", formDataToSend, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            // Update purchase order based on delivery option
            let purchaseOrderStatus;
            if (deliveryOption === "adjust_order") {
                purchaseOrderStatus = "completed";
            } else if (deliveryOption === "later_delivery") {
                purchaseOrderStatus = "partially_delivered";
            } else {
                purchaseOrderStatus = "delivered";
            }

            const purchaseOrderPayload = {
                has_good_receive_note: deliveryOption !== "later_delivery",
                delivery_status: purchaseOrderStatus,
            };
            
            await axios.put(`/api/v1/purchase-orders/${grnsData?.id}`, purchaseOrderPayload);

            // Note: Approval process for adjust_order is now handled automatically by the backend
            // when task_status is set to 'Draft' during GRN creation

            // If adjusting order, create adjustment records
            if (deliveryOption === "adjust_order") {
                const adjustmentPayload = {
                    purchase_order_id: grnsData.id,
                    grn_id: grnId,
                    adjustment_type: "quantity_shortage",
                    adjustment_reason: "Supplier unable to deliver remaining items",
                    adjustment_date: currentDate,
                    items: rfqItems.map(item => ({
                        item_id: item.id,
                        ordered_quantity: parseInt(item.quantity),
                        delivered_quantity: parseInt(quantityDelivered[item.id]) || 0,
                        adjusted_quantity: (parseInt(item.quantity) - (parseInt(quantityDelivered[item.id]) || 0)),
                    })),
                };
                
                // You'll need to create this endpoint
                // await axios.post("/api/v1/purchase-order-adjustments", adjustmentPayload);
            }

            onClose();
            router.visit("/goods-receiving-notes");
        } catch (error) {
            console.error("GRN Creation Error:", error);
            setError({ submit: "Failed to submit Goods Receiving Note" });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-8 rounded-2xl w-[90%] max-w-7xl">
                    <div className="flex justify-between">
                        <h2 className="text-3xl font-bold text-[#2C323C]">
                            Goods Received
                        </h2>
                        <div className="flex justify-start items-center gap-8">
                            <h2 className="text-xl font-medium text-[#2C323C]">
                                Delivery Date:{" "}
                                <span className="text-[#2C323C]">{currentDate}</span>
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-red-500 hover:text-red-800"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center w-full gap-4 my-4">
                        <h3 className="text-2xl font-medium text-[#6E66AC] whitespace-nowrap">
                            {grnsData?.purchase_order_no}
                        </h3>
                        <div
                            className="h-[3px] flex-grow"
                            style={{
                                background:
                                    "linear-gradient(to right, #9B9DA200, #9B9DA2)",
                            }}
                        ></div>
                    </div>

                    <table className="w-full border-collapse">
                        <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                    ID #
                                </th>
                                <th className="py-3 px-4">Item Name</th>
                                <th className="py-3 px-4">Description</th>
                                <th className="py-3 px-4">Brand</th>
                                <th className="py-3 px-4">Unit</th>
                                <th className="py-3 px-4 text-center">
                                    {Object.keys(previouslyDelivered).length > 0 ? 'Original QTY' : 'QTY Ordered'}
                                </th>
                                {Object.keys(previouslyDelivered).length > 0 && (
                                    <th className="py-3 px-4 text-center">Previously Delivered</th>
                                )}
                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                                    {Object.keys(previouslyDelivered).length > 0 ? 'Additional QTY' : 'QTY Delivered'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                            {loading ? (
                                <tr>
                                    <td colSpan={Object.keys(previouslyDelivered).length > 0 ? "8" : "7"} className="text-center py-12">
                                        <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                                    </td>
                                </tr>
                            ) : error.fetch ? (
                                <tr>
                                    <td
                                        colSpan={Object.keys(previouslyDelivered).length > 0 ? "8" : "7"}
                                        className="text-center text-red-500 font-medium py-4"
                                    >
                                        {error.fetch}
                                    </td>
                                </tr>
                            ) : rfqItems.length > 0 ? (
                                rfqItems.map((item, index) => {
                                    const orderedQty = parseInt(item.quantity) || 0;
                                    const deliveredQty = parseInt(quantityDelivered[item.id]) || 0;
                                    const isPartial = deliveredQty > 0 && deliveredQty !== orderedQty;
                                    const isExceeded = deliveredQty > orderedQty;
                                    const isPartiallyDelivered = grnsData?.delivery_status === 'partially_delivered' || Object.keys(previouslyDelivered).length > 0;
                                    
                                    return (
                                        <tr key={item.id}>
                                            <td className="py-3 px-4">{index + 1}</td>
                                            <td className="py-3 px-4">
                                                {item.item_name || item.product?.name || "N/A"}
                                            </td>
                                            <td className="py-3 px-4">
                                                {item.description || item.product?.description || "N/A"}
                                            </td>
                                            <td className="py-3 px-4">
                                                {item.brand || "N/A"}
                                            </td>
                                            <td className="py-3 px-4">
                                                {item.unit?.name || item.unit_id || "N/A"}
                                            </td>
                                            <td className="py-3 px-4 text-base font-medium text-center text-[#2C323C]">
                                                {isPartiallyDelivered ? (item.original_quantity || orderedQty) : orderedQty}
                                            </td>
                                            {isPartiallyDelivered && (
                                                <td className="py-3 px-4 text-center text-base font-medium text-[#2C323C]">
                                                    {previouslyDelivered[item.id] || 0}
                                                </td>
                                            )}
                                            <td className="py-3 px-4">
                                                <input
                                                    type="number"
                                                    value={isPartiallyDelivered ? (quantityDelivered[item.id] || "") : (quantityDelivered[item.id] || "")}
                                                    onChange={(e) => handleQuantityChange(e, item.id)}
                                                    className="w-full p-2 border rounded"
                                                    min="0"
                                                    max={isPartiallyDelivered ? orderedQty : orderedQty}
                                                    placeholder=""
                                                    style={{ 
                                                        outline: 'none !important',
                                                        boxShadow: 'none !important',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '0.375rem'
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.style.outline = 'none';
                                                        e.target.style.boxShadow = 'none';
                                                        e.target.style.border = '2px solid #009FDC';
                                                    }}
                                                    onBlur={(e) => {
                                                        e.target.style.border = '1px solid #d1d5db';
                                                    }}
                                                />
                                                {error[item.id] && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                        {error[item.id]}
                                                    </p>
                                                )}
                                                {isExceeded ? (
                                                    <p className="text-red-600 text-xs mt-1">
                                                        Cannot exceed ordered quantity
                                                    </p>
                                                ) : isPartial && (
                                                    <p className="text-amber-600 text-xs mt-1">
                                                        Partial delivery detected
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="text-center text-[#2C323C] font-medium py-4"
                                    >
                                        No RFQ Items Found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <form className="my-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <InputFloating
                                    label="Delivery Note Number"
                                    name="delivery_note_number"
                                    value={formData.delivery_note_number}
                                    onChange={handleChange}
                                />
                                {error.delivery_note_number && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {error.delivery_note_number}
                                    </p>
                                )}
                            </div>
                            <div>
                                <InputFloating
                                    label="Receiver Name"
                                    name="receiver_name"
                                    value={formData.receiver_name}
                                    onChange={handleChange}
                                />
                                {error.receiver_name && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {error.receiver_name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="border p-5 rounded-2xl bg-white w-full flex items-center justify-center cursor-pointer relative">
                                    <FontAwesomeIcon
                                        icon={faPaperclip}
                                        className="text-gray-500 mr-2"
                                    />
                                    <span className="text-gray-700 text-sm sm:text-base overflow-hidden text-ellipsis max-w-[80%]">
                                        {formData.attachment_name || "Add Attachment"}
                                    </span>
                                    <input
                                        type="file"
                                        accept="*/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                                {error.attachment && (
                                    <p className="text-red-500 text-sm mt-2">
                                        {error.attachment}
                                    </p>
                                )}
                            </div>
                        </div>
                    </form>

                    {error.submit && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error.submit}
                        </div>
                    )}

                    <div className="flex justify-end mt-6">
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-[#009FDC] text-white rounded-lg hover:bg-[#0077B6] transition"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Processing...
                                </div>
                            ) : (
                                "Create GRN"
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Partial Delivery Modal */}
            <PartialDeliveryModal
                isOpen={showPartialDeliveryModal}
                onClose={() => setShowPartialDeliveryModal(false)}
                partialItems={partialItems}
                onConfirm={handlePartialDeliveryConfirm}
                purchaseOrderNumber={grnsData?.purchase_order_no}
            />
        </>
    );
};

export default CreateGRNModal;
