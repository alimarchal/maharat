import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";

const PMTTable = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `/api/v1/payment-orders?include=user,purchaseOrder,purchaseOrder.supplier,purchaseOrder.quotation,logs&page=${currentPage}`
                );
                const res = await response.json();
                if (response.ok) {
                    setOrders(res?.data);
                    setLastPage(res.meta?.last_page || 1);
                }
            } catch (err) {
                setError("Error loading payment orders.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [currentPage]);

    return (
        <div className="w-full">
            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Payment Order #
                        </th>
                        <th className="py-3 px-4">Purchase Order #</th>
                        <th className="py-3 px-4">Quotation #</th>
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Action
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
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
                                    {order.payment_order_number}
                                </td>
                                <td className="py-3 px-4">
                                    {order.purchase_order?.purchase_order_no ||
                                        "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {order.purchase_order.quotation
                                        ?.quotation_number || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {order.purchase_order?.supplier?.name ||
                                        "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    ${order.purchase_order?.amount || "N/A"}
                                </td>
                                <td className="py-3 px-4 flex justify-center text-center space-x-3">
                                    <Link
                                        href={`/statuses/pmt-status/${order.id}`}
                                        className="text-[#9B9DA2] hover:text-gray-500"
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                    </Link>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="6"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Payment Orders found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && orders.length > 0 && (
                <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                    {Array.from(
                        { length: lastPage },
                        (_, index) => index + 1
                    ).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 ${
                                currentPage === page
                                    ? "bg-[#009FDC] text-white"
                                    : "border border-[#B9BBBD] bg-white"
                            } rounded-full hover:bg-[#0077B6] transition`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className={`px-3 py-1 bg-[#009FDC] text-white rounded-full hover:bg-[#0077B6] transition ${
                            currentPage >= lastPage
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                        }`}
                        disabled={currentPage >= lastPage}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default PMTTable;
