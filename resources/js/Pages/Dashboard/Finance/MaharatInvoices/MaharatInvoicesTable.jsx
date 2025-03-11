import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEye,
    faEdit,
    faTrash,
    faFilePdf,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";

const MaharatInvoicesTable = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedFilter, setSelectedFilter] = useState("All");
    const filters = ["All", "Draft", "Paid", "Unpaid", "Partially Paid"];

    const staticInvoices = [
        {
            id: 1,
            rfq_id: "MC-INV-001",
            customer_name: "Customer A",
            created_by: "Ahsan",
            amount: "$1,500",
            status_name: "Draft",
            created_at: "2025-03-06T10:30:00Z",
        },
        {
            id: 2,
            rfq_id: "MC-INV-002",
            customer_name: "Customer B",
            created_by: "Ali",
            amount: "$2,000",
            status_name: "Paid",
            created_at: "2025-03-05T15:45:00Z",
        },
        {
            id: 3,
            rfq_id: "MC-INV-003",
            customer_name: "Customer C",
            created_by: "Akhtar",
            amount: "$3,750",
            status_name: "Unpaid",
            created_at: "2025-03-04T08:15:00Z",
        },
    ];

    // useEffect(() => {
    //     const fetchInvoices = async () => {
    //         setLoading(true);
    //         try {
    //             const response = await fetch("/api/v1/maharat-invoices");
    //             const data = await response.json();
    //             if (response.ok) {
    //                 setOrders(data);
    //             }
    //         } catch (err) {
    //             setError("Error loading Invoices.");
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     fetchInvoices();
    // }, []);

    return (
        <div className="w-full">
            <div className="flex justify-between items-center text-center mb-6">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    Maharat Invoices
                </h2>

                <div className="flex justify-between items-center gap-4">
                    <div className="p-1 space-x-2 border border-[#B9BBBD] bg-white rounded-full">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                className={`px-6 py-2 rounded-full text-xl transition ${
                                    selectedFilter === filter
                                        ? "bg-[#009FDC] text-white"
                                        : "text-[#9B9DA2]"
                                }`}
                                onClick={() => setSelectedFilter(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                    <Link
                        href={`/customers`}
                        className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                    >
                        Add Customers
                    </Link>
                    <Link
                        href={`/maharat-invoices/create`}
                        className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                    >
                        Create new Invoice
                    </Link>
                </div>
            </div>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Invoice ID
                        </th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Created By</th>
                        <th className="py-3 px-4">Total Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-left text-base font-medium divide-y divide-[#D7D8D9]">
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
                    ) : staticInvoices.length > 0 ? (
                        staticInvoices
                            .filter(
                                (invoice) =>
                                    selectedFilter === "All" ||
                                    invoice.status_name === selectedFilter
                            )
                            .map((invoice) => (
                                <tr key={invoice.id}>
                                    <td className="py-3 px-4">
                                        {invoice.rfq_id}
                                    </td>
                                    <td className="py-3 px-4">
                                        {invoice.customer_name}
                                    </td>
                                    <td className="py-3 px-4">
                                        {invoice.created_by}
                                    </td>
                                    <td className="py-3 px-4">
                                        {invoice.amount}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${
                                                invoice.status_name === "Paid"
                                                    ? "bg-green-100 text-green-800"
                                                    : invoice.status_name ===
                                                      "Unpaid"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                            }`}
                                        >
                                            {invoice.status_name}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        {new Date(
                                            invoice.created_at
                                        ).toLocaleString()}
                                    </td>
                                    <td className="py-3 px-4 flex justify-start space-x-3">
                                        <button className="text-gray-600 hover:text-gray-800">
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button className="text-gray-600 hover:text-gray-800">
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button className="text-red-600 hover:text-red-900">
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                        <button className="text-blue-600 hover:text-blue-900">
                                            <FontAwesomeIcon icon={faFilePdf} />
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
                                No Maharat Invoices found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default MaharatInvoicesTable;
