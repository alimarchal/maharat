import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { router } from "@inertiajs/react";
import InputFloating from "../../../../Components/InputFloating";

const CreateGRNModal = ({ isOpen, onClose, grnsData }) => {
    const [formData, setFormData] = useState({
        delivery_note_number: "",
        attachment: "",
    });
    const [rfqItems, setRFQItems] = useState([]);
    const [quantityDelivered, setQuantityDelivered] = useState({});
    const [error, setError] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchRFQItems = async () => {
            setLoading(true);
            const rfqId = grnsData?.quotation?.rfq_id ?? null;
            try {
                const response = await axios.get(
                    "/api/v1/rfq-items?include=category,unit,status"
                );
                const filteredItems = response.data.data.filter(
                    (item) => item.rfq_id === rfqId
                );
                setRFQItems(filteredItems);
            } catch (error) {
                setError({ fetch: "Error loading RFQ Items." });
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && grnsData) {
            fetchRFQItems();
        }
    }, [isOpen, grnsData]);

    const currentDate = new Date().toISOString().split("T")[0];

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
            }));
            setError((prev) => ({ ...prev, attachment: "" }));
        }
    };

    const validateForm = () => {
        let newErrors = {};
        let isValid = true;

        rfqItems.forEach((item) => {
            const deliveredQty = quantityDelivered[item.id];
            if (!deliveredQty || parseInt(deliveredQty) <= 0) {
                newErrors[item.id] =
                    "Quantity is required and must be greater than 0.";
                isValid = false;
            }
        });

        if (!formData.delivery_note_number) {
            newErrors.delivery_note_number =
                "Delivery Note Number is required.";
            isValid = false;
        }
        if (!formData.attachment) {
            newErrors.attachment = "Photo is required.";
            isValid = false;
        }

        setError(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const totalDeliveredQuantity = rfqItems.reduce((sum, item) => {
                const deliveredQty = parseInt(quantityDelivered[item.id]) || 0;
                return sum + deliveredQty;
            }, 0);

            const grnsPayload = {
                purchase_order_id: grnsData.id,
                quotation_id: grnsData.quotation_id,
                delivery_date: currentDate,
                quantity: totalDeliveredQuantity,
            };
            const grnResponse = await axios.post("/api/v1/grns", grnsPayload);
            const grnId = grnResponse.data.data?.id;

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
                        receiver_name: grnsData.supplier.name,
                        upc: grnsData.supplier?.upc || null,
                        quantity_delivered: parseInt(deliveredQty),
                        delivery_date: currentDate,
                    };
                    await axios.post(
                        "/api/v1/grn-receive-goods",
                        grnsGoodsPayload
                    );
                }
            }

            const formDataToSend = new FormData();
            formDataToSend.append(
                "delivery_note_number",
                formData.delivery_note_number
            );
            formDataToSend.append("grn_id", grnId);
            formDataToSend.append("purchase_order_id", grnsData.id);
            formDataToSend.append("attachment", formData.attachment);

            await axios.post(
                "/api/v1/external-delivery-notes",
                formDataToSend,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            // const inventoryPayload = {
            //     warehouse_id: 101,
            //     quantity: item.quantity,
            //     reorder_level: 10,
            //     description: "Stock in from supplier",
            //     reference_number: "PO-2025-0031",
            //     reference_type: "purchase_order",
            //     reference_id: "1",
            //     notes: "Regular stock replenishment",
            // };

            // await axios.post(
            //     `/api/v1/inventories/product/${grnsData.id}/stock-in`,
            //     inventoryPayload
            // );

            const purchaseOrderPayload = {
                has_good_receive_note: true,
            };
            await axios.put(
                `/api/v1/purchase-orders/${grnsData?.id}`,
                purchaseOrderPayload
            );

            onClose();
            router.visit("/goods-receiving-notes");
        } catch (error) {
            setError({ submit: "Failed to submit Goods Receiving Note" });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-7xl">
                <div className="flex justify-between">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        Goods Received
                    </h2>
                    <div className="flex justify-start items-center gap-8">
                        <h2 className="text-xl font-medium text-[#2C323C]">
                            Delivery Date:{" "}
                            <span className="text-gray-500">{currentDate}</span>
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
                            <th className="py-3 px-4">QTY Ordered</th>
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
                            rfqItems.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="py-3 px-4">{index + 1}</td>
                                    <td className="py-3 px-4">
                                        {item.item_name}
                                    </td>
                                    <td className="py-3 px-4">
                                        {item.description}
                                    </td>
                                    <td className="py-3 px-4">
                                        {item.brand?.name}
                                    </td>
                                    <td className="py-3 px-4">
                                        {item.unit?.name}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {parseInt(item.quantity)}
                                    </td>
                                    <td className="py-3 px-4">
                                        <input
                                            type="number"
                                            value={
                                                quantityDelivered[item.id] || ""
                                            }
                                            onChange={(e) =>
                                                handleQuantityChange(e, item.id)
                                            }
                                            className="w-full p-2 border rounded"
                                            min="1"
                                        />
                                        {error[item.id] && (
                                            <p className="text-red-500 text-sm">
                                                {error[item.id]}
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            ))
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <label className="border p-5 rounded-2xl bg-white w-full flex items-center justify-center cursor-pointer relative">
                                <FontAwesomeIcon
                                    icon={faCamera}
                                    className="text-gray-500 mr-2"
                                />
                                <span className="text-gray-700 text-sm sm:text-base overflow-hidden text-ellipsis max-w-[80%]">
                                    {formData.attachment?.name || "Add a Photo"}
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
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

                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-[#009FDC] text-white rounded-lg hover:bg-[#0077B6] transition"
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Create"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGRNModal;
