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
        }
    }, [grnsData]);

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

    const handlePartialDeliveryConfirm = async (deliveryOption, processInfo = null) => {
        setShowPartialDeliveryModal(false);
        await processGRNCreation(deliveryOption, processInfo);
    };

    const processGRNCreation = async (deliveryOption, processInfo = null) => {
        setLoading(true);
        try {
            const totalDeliveredQuantity = rfqItems.reduce((sum, item) => {
                const deliveredQty = parseInt(quantityDelivered[item.id]) || 0;
                return sum + deliveredQty;
            }, 0);

            // Create GRN payload
            const grnsPayload = {
                purchase_order_id: grnsData.id,
                quotation_id: grnsData.quotation_id,
                delivery_date: currentDate,
                quantity: totalDeliveredQuantity,
                delivery_status: deliveryOption,
            };
            
            const grnResponse = await axios.post("/api/v1/grns", grnsPayload);
            const grnId = grnResponse.data.data?.id;

            // Create receive goods records
            for (const item of rfqItems) {
                const deliveredQty = quantityDelivered[item.id];
                if (parseInt(deliveredQty) > 0) {
                    const grnsGoodsPayload = {
                        supplier_id: grnsData.supplier_id,
                        grn_id: grnId,
                        purchase_order_id: grnsData.id,
                        quotation_id: grnsData.quotation_id,
                        quantity_quoted: item.quantity,
                        due_delivery_date: currentDate,
                        receiver_name: formData.receiver_name,
                        upc: grnsData.supplier?.upc || null,
                        quantity_delivered: parseInt(deliveredQty),
                        delivery_date: currentDate,
                        delivery_status: deliveryOption,
                    };
                    await axios.post("/api/v1/grn-receive-goods", grnsGoodsPayload);
                }
            }

            // Update inventory
            for (const item of rfqItems) {
                const deliveredQty = parseInt(quantityDelivered[item.id]) || 0;
                if (deliveredQty > 0) {
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
                        quantity: deliveredQty,
                        reorder_level: parseInt(item.quantity),
                        description: item.description,
                    };
                    
                    await axios.post(
                        `/api/v1/inventories/product/${item?.product_id}/stock-in`,
                        inventoryPayload
                    );
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

            // Handle approval process for adjust_order option
            if (deliveryOption === "adjust_order") {
                if (!processInfo) {
                    setError({ submit: "Failed to initialize approval process. Please try again." });
                    setLoading(false);
                    return;
                }
                const { processStep, assignUser, process } = processInfo;
                
                // Create GRN approval transaction
                const GRNTransactionPayload = {
                    grn_id: grnId,
                    requester_id: user_id,
                    assigned_to: assignUser.approver_id,
                    order: processStep.order,
                    description: processStep.description,
                    status: "Pending",
                };
                await axios.post("/api/v1/grn-approval-transactions", GRNTransactionPayload);

                // Create task for approver
                const taskPayload = {
                    process_step_id: processStep.id,
                    process_id: processStep.process_id,
                    assigned_at: new Date().toISOString(),
                    urgency: "Normal",
                    order_no: processStep.order,
                    assigned_to_user_id: assignUser.approver_id,
                    assigned_from_user_id: user_id,
                    grn_id: grnId,
                };
                await axios.post("/api/v1/tasks", taskPayload);
            }

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
                                <th className="py-3 px-4 text-center">QTY Ordered</th>
                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                                    QTY Delivered
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-12">
                                        <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                                    </td>
                                </tr>
                            ) : error.fetch ? (
                                <tr>
                                    <td
                                        colSpan="7"
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
                                            <td className="py-3 px-4 text-xl font-medium text-center">
                                                {orderedQty}
                                            </td>
                                            <td className="py-3 px-4">
                                                <input
                                                    type="number"
                                                    value={quantityDelivered[item.id] || ""}
                                                    onChange={(e) => handleQuantityChange(e, item.id)}
                                                    className="w-full p-2 border rounded"
                                                    min="0"
                                                    max={orderedQty}
                                                    placeholder="Enter quantity"
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
