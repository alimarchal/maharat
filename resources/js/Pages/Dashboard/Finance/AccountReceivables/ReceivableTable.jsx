import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";

const ReceivableTable = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [receivables, setReceivables] = useState([
        {
            id: "01",
            invoice_no: "MC-INV-2024001",
            customer: "SECCO",
            contact: "QT-2024001",
            status: "Unpaid",
            amount: "1300.00",
            balance: "1300.00",
        },
        {
            id: "02",
            invoice_no: "MC-INV-6788001",
            customer: "SARAMCO",
            contact: "QT-6788001",
            status: "Paid",
            amount: "1500.00",
            balance: "1500.00",
        },
        {
            id: "03",
            invoice_no: "MC-INV-3249801",
            customer: "BAHRI",
            contact: "QT-3249801",
            status: "Overdue",
            amount: "1700.00",
            balance: "1700.00",
        },
        {
            id: "04",
            invoice_no: "MC-INV-2024001",
            customer: "MARITIME",
            contact: "QT-2024001",
            status: "Partially Paid",
            amount: "1800.00",
            balance: "1800.00",
        },
    ]);

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    Account Receivables
                </h2>
                <Link
                    href="/account-receivables/create"
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                >
                    Add new Account Receivables
                </Link>
            </div>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Invoice #
                        </th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Balance</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Details
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
                    ) : receivables.length > 0 ? (
                        receivables.map((data) => (
                            <tr key={data.id}>
                                <td className="py-3 px-4">{data.invoice_no}</td>
                                <td className="py-3 px-4">{data.customer}</td>
                                <td className="py-3 px-4">{data.contact}</td>
                                <td className="py-3 px-4">{data.status}</td>
                                <td className="py-3 px-4">{data.amount}</td>
                                <td className="py-3 px-4">{data.balance}</td>
                                <td className="py-3 px-4 flex justify-center text-center">
                                    <Link
                                        href={`/account-receivables/view/${data.id}`}
                                        className="flex items-center justify-center w-8 h-8 border border-[#9B9DA2] rounded-full text-[#9B9DA2] hover:text-gray-800 hover:border-gray-800 cursor-pointer transition duration-200"
                                    >
                                        <FontAwesomeIcon icon={faEllipsisH} />
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
                                No Receivables found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ReceivableTable;
