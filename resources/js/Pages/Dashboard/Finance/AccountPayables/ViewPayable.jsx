import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faEye } from "@fortawesome/free-solid-svg-icons";

const ViewPayable = () => {
    const suppliers = [
        {
            id: "INV-2024001",
            name: "SECCO",
            contact: "Abdul Jabbar",
            status: "Partially Paid",
            issueDate: "4 Jan 2025",
            dueDate: "14 Jan 2025",
        },
    ];

    const payments = [
        {
            terms: "Net 60",
            amount: "12,000.00",
            paid: "3,000.00",
            balance: "9,000.00",
        },
    ];

    return (
        <div className="w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-[#2C323C] mb-6">
                Account Payables Details
            </h2>

            <div className="flex items-center gap-4 w-full">
                <p className="text-[#6E66AC] text-lg md:text-2xl">
                    {suppliers[0]?.id}
                </p>
                <div
                    className="h-[3px] flex-grow"
                    style={{
                        background:
                            "linear-gradient(to right, #9B9DA200, #9B9DA2)",
                    }}
                ></div>
            </div>

            <div className="mt-6 mb-12 overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-base md:text-lg font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                Supplier
                            </th>
                            <th className="py-3 px-4">Contact</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Issue Date</th>
                            <th className="py-3 px-4">Due Date</th>
                            <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                                View & Download Invoice
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-sm md:text-base font-medium divide-y divide-[#D7D8D9]">
                        {suppliers.map((supplier, index) => (
                            <tr key={index}>
                                <td className="py-3 px-4">{supplier.name}</td>
                                <td className="py-3 px-4">
                                    {supplier.contact}
                                </td>
                                <td className="py-3 px-4">{supplier.status}</td>
                                <td className="py-3 px-4">
                                    {supplier.issueDate}
                                </td>
                                <td className="py-3 px-4">
                                    {supplier.dueDate}
                                </td>
                                <td className="py-3 px-4 text-center flex justify-center gap-4">
                                    <FontAwesomeIcon
                                        icon={faEye}
                                        className="text-lg md:text-xl text-[#9B9DA2] cursor-pointer hover:text-black"
                                    />
                                    <FontAwesomeIcon
                                        icon={faDownload}
                                        className="text-lg md:text-xl text-[#009FDC] cursor-pointer hover:text-blue-700"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-12 mb-16 overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-base md:text-lg font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                Payment Terms
                            </th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Paid</th>
                            <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                                Balance
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-sm md:text-base font-medium divide-y divide-[#D7D8D9]">
                        {payments.map((payment, index) => (
                            <tr key={index}>
                                <td className="py-3 px-4">{payment.terms}</td>
                                <td className="py-3 px-4">{payment.amount}</td>
                                <td className="py-3 px-4">{payment.paid}</td>
                                <td className="py-3 px-4">{payment.balance}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ViewPayable;
