import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";

const CreatePaymentOrdersTable = () => {
    const [formData, setFormData] = useState({
        from_date: "",
        to_date: "",
    });
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const staticPaymentOrders = [
        {
            id: 1,
            po_number: "MC-PO-2024001",
            quotation_number: "QT-2024001",
            company: "InfoTech",
            amount: "1300.00",
        },
        {
            id: 2,
            po_number: "MC-PO-6788001",
            quotation_number: "QT-6788001",
            company: "EVLogic",
            amount: "1500.00",
        },
        {
            id: 3,
            po_number: "MC-PO-3249801",
            quotation_number: "QT-3249801",
            company: "Compaq",
            amount: "1700.00",
        },
        {
            id: 4,
            po_number: "MC-PO-2024001",
            quotation_number: "QT-2024001",
            company: "InnoTech",
            amount: "1800.00",
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        Payment Orders
                    </h2>
                    <p className="text-[#7D8086] text-lg">
                        List of Purchased Orders which has no Payment Orders
                    </p>
                </div>
                <div className="flex flex-col lg:flex-row lg:justify-start items-center gap-3 w-full md:w-2/5">
                    <div className="relative w-full">
                        <input
                            type="date"
                            name="from_date"
                            value={formData.from_date}
                            onChange={handleChange}
                            min={new Date().toISOString().split("T")[0]}
                            className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                        />
                        <label
                            className={`absolute left-3 px-2 bg-white text-gray-500 text-base transition-all
                                ${
                                    formData.from_date
                                        ? "-top-2 text-[#009FDC] text-sm px-2"
                                        : "top-1/2 text-gray-400 -translate-y-1/2"
                                }
                                peer-focus:top-0 peer-focus:text-sm peer-focus:text-[#009FDC] peer-focus:px-2`}
                        >
                            Select From Date
                        </label>
                    </div>
                    <div className="relative w-full">
                        <input
                            type="date"
                            name="to_date"
                            value={formData.to_date}
                            onChange={handleChange}
                            min={new Date().toISOString().split("T")[0]}
                            className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                        />
                        <label
                            className={`absolute left-3 px-2 bg-white text-gray-500 text-base transition-all
                                ${
                                    formData.to_date
                                        ? "-top-2 text-[#009FDC] text-sm px-2"
                                        : "top-1/2 text-gray-400 -translate-y-1/2"
                                }
                                peer-focus:top-0 peer-focus:text-sm peer-focus:text-[#009FDC] peer-focus:px-2`}
                        >
                            Select To Date
                        </label>
                    </div>
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
                            Action
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {!loading ? (
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
                    ) : staticPaymentOrders.length > 0 ? (
                        staticPaymentOrders.map((order) => (
                            <tr key={order.id}>
                                <td className="py-3 px-4">{order.po_number}</td>
                                <td className="py-3 px-4">
                                    {order.quotation_number}
                                </td>
                                <td className="py-3 px-4">{order.company}</td>
                                <td className="py-3 px-4">${order.amount}</td>
                                <td className="py-3 px-4 text-center text-[#009FDC] hover:text-blue-700 cursor-pointer">
                                    <FontAwesomeIcon
                                        icon={faPaperclip}
                                        className="text-xl"
                                    />
                                </td>
                                <td className="py-3 px-4 flex justify-center text-center">
                                    <Link
                                        href={`/payment-orders/${order.id}/create-payment-order`}
                                        className="flex items-center justify-center w-8 h-8 border border-[#9B9DA2] rounded-full text-[#9B9DA2] hover:text-gray-800 hover:border-gray-800 cursor-pointer transition duration-200"
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
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
        </div>
    );
};

export default CreatePaymentOrdersTable;
