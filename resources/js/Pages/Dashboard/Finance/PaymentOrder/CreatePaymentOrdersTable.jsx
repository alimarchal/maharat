import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import PaymentOrderModal from "./PaymentOrderModal";
import SelectFloating from "@/Components/SelectFloating";

const CreatePaymentOrdersTable = () => {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState("");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        const fetchPurchaseOrdersList = async () => {
            try {
                const response = await fetch("/api/v1/purchase-orders?has_payment_order=false");
                const res = await response.json();
                if (response.ok) {
                    setPurchaseOrders(res.data || []);
                } else {
                    throw new Error("Failed to fetch purchase orders list");
                }
            } catch (err) {
                console.error("Error loading purchase orders list:", err);
            }
        };

        fetchPurchaseOrdersList();
    }, []);

    useEffect(() => {
        // Only fetch data if a purchase order is selected
        if (!selectedPurchaseOrder) {
            setOrders([]);
            return;
        }
        
        const fetchPurchaseOrders = async () => {
            setLoading(true);
            try {
                const url = `/api/v1/purchase-orders/${selectedPurchaseOrder}?include=department,costCenter,subCostCenter,warehouse,quotation,supplier,user`;
                
                const response = await fetch(url);
                const res = await response.json();
                if (response.ok) {
                    // Single purchase order was requested
                    setOrders([res.data]);
                    setLastPage(1);
                } else {
                    throw new Error("Failed to fetch payment orders");
                }
            } catch (err) {
                setError("Error loading payment orders.");
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPurchaseOrders();
    }, [selectedPurchaseOrder]);

    const handlePurchaseOrderChange = (e) => {
        setSelectedPurchaseOrder(e.target.value);
        setCurrentPage(1);
    };

    const handleOpenModal = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        Purchase Orders without Payment Orders
                    </h2>
                    <p className="text-[#7D8086] text-lg">
                        List of Purchased Orders that have no Payment Orders
                    </p>
                </div>
                <div className="w-1/3">
                    <SelectFloating
                        label="Purchase Order"
                        name="purchaseOrder"
                        value={selectedPurchaseOrder}
                        onChange={handlePurchaseOrderChange}
                        options={purchaseOrders.map((order) => ({
                            id: order.id,
                            label: order.purchase_order_no || `PO #${order.id}`,
                        }))}
                    />
                </div>
            </div>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Purchase Order #
                        </th>
                        <th className="py-3 px-4">Quotation #</th>
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4 text-center">Attachment</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Create
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {!selectedPurchaseOrder ? (
                        <tr>
                            <td colSpan="6" className="text-center py-4">
                                Please select a purchase order to view details
                            </td>
                        </tr>
                    ) : loading ? (
                        <tr>
                            <td colSpan="6" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="6"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : orders.length > 0 ? (
                        orders.map((order) => (
                            <tr key={order.id}>
                                <td className="py-3 px-4">
                                    {order.purchase_order_no || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {order?.quotation?.quotation_number ||
                                        "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {order?.quotation?.company_name || order?.supplier?.name || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {order?.amount || "0.00"}
                                </td>
                                <td className="py-3 px-4 text-center text-[#009FDC] hover:text-blue-700 cursor-pointer">
                                    {order.attachment ? (
                                        <a
                                            href={`/storage/${order.attachment}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <FontAwesomeIcon
                                                icon={faPaperclip}
                                                className="text-xl"
                                            />
                                        </a>
                                    ) : (
                                        <span className="text-gray-400">
                                            No Attachment
                                        </span>
                                    )}
                                </td>
                                <td className="py-3 px-4 flex justify-center text-center">
                                    <button
                                        onClick={() => handleOpenModal(order)}
                                        className="flex items-center justify-center w-6 h-6 border border-[#9B9DA2] rounded-full text-[#9B9DA2] hover:text-gray-800 hover:border-gray-800 cursor-pointer transition duration-200"
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="6"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Purchase Orders found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Render the modal */}
            {isModalOpen && (
                <PaymentOrderModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    selectedOrder={selectedOrder}
                />
            )}
        </div>
    );
};

export default CreatePaymentOrdersTable;
