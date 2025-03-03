import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faPaperclip } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";

const PaymentOrderTable = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const staticOrders = [
        {
            id: 1,
            payment_order_number: "PO-1001",
            po_number: "12345",
            quotation_number: "Q-5678",
            company: "ABC Ltd.",
            amount: "5000",
        },
        {
            id: 2,
            payment_order_number: "PO-1002",
            po_number: "67890",
            quotation_number: "Q-91011",
            company: "XYZ Corp.",
            amount: "7000",
        },
        {
            id: 3,
            payment_order_number: "PO-1003",
            po_number: "67898",
            quotation_number: "Q-91034",
            company: "Evelogics",
            amount: "4000",
        },
        {
            id: 4,
            payment_order_number: "PO-1004",
            po_number: "7567",
            quotation_number: "Q-914657",
            company: "Pims",
            amount: "9000",
        },
    ];

    // useEffect(() => {
    //     const fetchOrders = async () => {
    //         setLoading(true);
    //         try {
    //             const response = await fetch("/api/v1/payment-orders");
    //             const data = await response.json();
    //             if (response.ok) {
    //                 setOrders(data);
    //             }
    //         } catch (err) {
    //             setError("Error loading payment orders.");
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     fetchOrders();
    // }, []);

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-[#2C323C] mb-4">
                    Payment Orders
                </h2>
                <Link
                    href="/payment-orders/create"
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                >
                    Create new Payment Order
                </Link>
            </div>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Payment Order #
                        </th>
                        <th className="py-3 px-4">Purchase Order #</th>
                        <th className="py-3 px-4">Quotation #</th>
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4 text-center">Attachment</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            View
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {!loading ? (
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
                    ) : staticOrders.length > 0 ? (
                        staticOrders.map((order) => (
                            <tr key={order.id}>
                                <td className="py-3 px-4">
                                    {order.payment_order_number}
                                </td>
                                <td className="py-3 px-4">{order.po_number}</td>
                                <td className="py-3 px-4">
                                    {order.quotation_number}
                                </td>
                                <td className="py-3 px-4">{order.company}</td>
                                <td className="py-3 px-4">${order.amount}</td>
                                <td className="py-3 px-4 text-center text-[#009FDC] hover:text-blue-800 cursor-pointer">
                                    <FontAwesomeIcon icon={faPaperclip} />
                                </td>
                                <td className="py-3 px-4 text-center text-[#9B9DA2] hover:text-gray-800 cursor-pointer">
                                    <FontAwesomeIcon icon={faEye} />
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="7"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Payment Orders found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PaymentOrderTable;
