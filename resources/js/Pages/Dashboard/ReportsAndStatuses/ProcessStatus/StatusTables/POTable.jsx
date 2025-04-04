import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";

export default function POTable() {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPurchaseOrders = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `api/v1/purchase-orders?include=department,costCenter,subCostCenter,warehouse,quotation,supplier,user,requestForQuotation.items.product.category,requestForQuotation.items.product.unit&page=${currentPage}`
                );
                const data = await response.json();
                if (response.ok) {
                    setPurchaseOrders(data.data || []);
                    setLastPage(data.meta?.last_page || 1);
                } else {
                    setError(data.message || "Failed to fetch PO.");
                }
            } catch (err) {
                console.error("Error fetching po:", err);
                setError("Error loading po.");
            } finally {
                setLoading(false);
            }
        };

        fetchPurchaseOrders();
    }, [currentPage]);

    return (
        <div className="w-full overflow-hidden">
            <table className="w-full">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            PO #
                        </th>
                        <th className="py-3 px-4">Quotation #</th>
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4">Issue Date</th>
                        <th className="py-3 px-4">Expiry Date</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                            Action
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
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="7"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : purchaseOrders.length > 0 ? (
                        purchaseOrders.map((order) => (
                            <tr key={order.id}>
                                <td className="px-3 py-4">
                                    {order.purchase_order_no || "N/A"}
                                </td>
                                <td className="px-3 py-4">
                                    {order.quotation?.quotation_number || "N/A"}
                                </td>
                                <td className="px-3 py-4">
                                    {order.quotation?.company_name || "N/A"}
                                </td>
                                <td className="px-3 py-4">
                                    {order.purchase_order_date}
                                </td>
                                <td className="px-6 py-4">
                                    {order.expiry_date}
                                </td>
                                <td className="px-6 py-4">
                                    {Number(order.amount || 0).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 flex justify-center space-x-3">
                                    <Link
                                        href={`/statuses/po-status/${order.id}`}
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
                                colSpan="7"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Material Requests found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && purchaseOrders.length > 0 && (
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
}
