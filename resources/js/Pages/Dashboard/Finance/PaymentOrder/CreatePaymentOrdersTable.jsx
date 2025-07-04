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

    const [externalInvoicePOIds, setExternalInvoicePOIds] = useState([]);

    useEffect(() => {
        const fetchPurchaseOrdersList = async () => {
            try {
                const [poRes, extInvRes] = await Promise.all([
                    fetch("/api/v1/purchase-orders?has_payment_order=false&filter[status]=Approved"),
                    fetch("/api/v1/external-invoices")
                ]);
                const poData = await poRes.json();
                const extInvData = await extInvRes.json();

                if (poRes.ok && extInvRes.ok) {
                    setPurchaseOrders(poData.data || []);
                    // Extract purchase_order_id from each external invoice
                    const poIds = (extInvData.data || []).map(inv => inv.purchase_order_id);
                    setExternalInvoicePOIds(poIds);
                } else {
                    throw new Error("Failed to fetch purchase orders or external invoices");
                }
            } catch (err) {
                console.error("Error loading purchase orders or external invoices:", err);
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
                        options={purchaseOrders
                            .filter(order => externalInvoicePOIds.includes(order.id))
                            .map((order) => ({
                                id: order.id,
                                label: order.purchase_order_no || `PO #${order.id}`,
                            }))
                        }
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
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4 text-center">EXT Attachment</th>
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
                                    {order?.supplier?.name || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {(() => {
                                        const amount = Number(order?.amount) || 0;
                                        const vat = Number(order?.vat_amount) || 0;
                                        const sum = amount + vat;
                                        return sum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                    })()}
                                </td>
                                <td className="py-3 px-4 text-center">
                                    {order.attachment ? (
                                        <button
                                            className="w-8 h-8"
                                            onClick={() => {
                                                const filePath = order.attachment;
                                                const fixedPath = filePath.startsWith("http")
                                                    ? filePath
                                                    : filePath.startsWith("/storage/")
                                                        ? filePath
                                                        : filePath.startsWith("invoices/")
                                                            ? `/storage/${filePath}`
                                                            : `/storage/${filePath}`;
                                                window.open(fixedPath, "_blank");
                                            }}
                                            title="View Document"
                                        >
                                            <img
                                                src="/images/pdf-file.png"
                                                alt="PDF"
                                                className="w-full h-full"
                                            />
                                        </button>
                                    ) : (
                                        <span className="text-gray-500">
                                            No document attached
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
