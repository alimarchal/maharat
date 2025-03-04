import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip } from "@fortawesome/free-solid-svg-icons";

const CreateReceivable = () => {
    const [formData, setFormData] = useState({
        customer: "SECCO",
        status: "Partially Paid",
        issueDate: "4 Jan 2025",
        dueDate: "14 Jan 2025",
        paymentTerms: "Net 60",
        amount: "12,000.00",
        paid: "3,000.00",
        balance: "9,000.00",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="w-full px-4 md:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#2C323C] mb-6 md:mb-10">
                Account Receivables Details
            </h2>

            <div className="flex items-center gap-4 w-full">
                <p className="text-[#6E66AC] text-lg md:text-2xl">
                    MC-INV-2024001
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
                                Customer
                            </th>
                            <th className="py-3 px-4">Contact</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Issue Date</th>
                            <th className="py-3 px-4">Due Date</th>
                            <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                                Invoice Link
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-sm md:text-base font-medium divide-y divide-[#D7D8D9]">
                        <tr>
                            <td className="py-3 px-4">
                                <select
                                    name="customer"
                                    value={formData.customer}
                                    onChange={handleChange}
                                    className="w-full xl:w-2/3 border-none bg-transparent rounded p-2 cursor-pointer"
                                >
                                    <option>SECCO</option>
                                    <option>SARAMCO</option>
                                    <option>BAHRI</option>
                                </select>
                            </td>
                            <td className="py-3 px-4">Abdul Jabbar</td>
                            <td className="py-3 px-4">
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full xl:w-4/5 border-none bg-transparent rounded p-2 cursor-pointer"
                                >
                                    <option>Unpaid</option>
                                    <option>Paid</option>
                                    <option>Partially Paid</option>
                                </select>
                            </td>
                            <td className="py-3 px-4">{formData.issueDate}</td>
                            <td className="py-3 px-4">{formData.dueDate}</td>
                            <td className="py-3 px-4 text-center">
                                <FontAwesomeIcon
                                    icon={faPaperclip}
                                    className="text-lg md:text-xl text-[#009FDC] hover:text-blue-700 cursor-pointer"
                                />
                            </td>
                        </tr>
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
                        <tr>
                            <td className="py-3 px-4">
                                <select
                                    name="paymentTerms"
                                    value={formData.paymentTerms}
                                    onChange={handleChange}
                                    className="w-full lg:w-1/3 xl:w-1/2 border-none bg-transparent rounded p-2 cursor-pointer"
                                >
                                    <option>Net 30</option>
                                    <option>Net 60</option>
                                </select>
                            </td>
                            <td className="py-3 px-4">{formData.amount}</td>
                            <td className="py-3 px-4">{formData.paid}</td>
                            <td className="py-3 px-4">{formData.balance}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="my-8 flex justify-center md:justify-end w-full">
                <button className="px-8 py-3 text-lg md:text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full md:w-auto">
                    Save
                </button>
            </div>
        </div>
    );
};

export default CreateReceivable;
