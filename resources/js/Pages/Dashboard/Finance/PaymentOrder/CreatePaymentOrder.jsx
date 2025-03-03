import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip, faEye } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import SelectFloating from "../../../../Components/SelectFloating";

const CreatePaymentOrder = () => {
    const [formData, setFormData] = useState({
        description: "",
        action: "",
        priority: "",
    });
    const [errors, setErrors] = useState({});

    const paymentOrders = [
        {
            id: 1,
            po_number: "MC-PMNT-6788001",
            company: "InfoTech",
            date: "4 Jan 2025",
            amount: "1300.00",
        },
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        let newErrors = {};
        if (!formData.description)
            newErrors.description = "Description is required";
        if (!formData.action) newErrors.action = "Action is required";
        if (!formData.priority) newErrors.priority = "Priority is required";

        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            try {
                // const response = await axios.post(
                //     "/api/v1/payment-order",
                //     formData
                // );
                console.log("Task submitted successfully:", response.data);
            } catch (error) {
                console.error("Error submitting task:", error);
            }
        }
    };

    return (
        <div className="w-full">
            <h2 className="text-3xl font-bold text-[#2C323C] mb-8 md:mb-12">
                Create New Payment Order
            </h2>

            <div className="flex items-center w-full gap-4">
                <p className="text-[#6E66AC] text-2xl">MC-PO-1235678</p>
                <div
                    className="h-[3px] flex-grow"
                    style={{
                        background:
                            "linear-gradient(to right, #9B9DA200, #9B9DA2)",
                    }}
                ></div>
            </div>

            <div className="mt-4 mb-16 overflow-hidden">
                <table className="w-full border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                Payment Order #
                            </th>
                            <th className="py-3 px-4">Company</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4 text-center">
                                Attached Quotation
                            </th>
                            <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                                View
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                        {paymentOrders.map((order) => (
                            <tr key={order.id}>
                                <td className="py-3 px-4">{order.po_number}</td>
                                <td className="py-3 px-4">{order.company}</td>
                                <td className="py-3 px-4">{order.date}</td>
                                <td className="py-3 px-4">${order.amount}</td>
                                <td className="py-3 px-4 text-center text-[#009FDC] hover:text-blue-800 cursor-pointer">
                                    <FontAwesomeIcon icon={faPaperclip} />
                                </td>
                                <td className="py-3 px-4 text-center text-[#9B9DA2] hover:text-gray-800 cursor-pointer">
                                    <FontAwesomeIcon icon={faEye} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 items-start gap-4 w-full">
                <div className="relative w-full">
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="peer border border-gray-300 p-5 rounded-2xl w-full h-36 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                    ></textarea>
                    <label
                        className={`absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                            peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
                            peer-focus:-top-2 peer-focus:left-2 peer-focus:text-base peer-focus:text-[#009FDC] peer-focus:px-1
                            ${
                                formData.description
                                    ? "-top-2 left-2 text-base text-[#009FDC] px-1"
                                    : "top-4 text-base text-gray-400"
                            }`}
                    >
                        Description
                    </label>
                    {errors.description && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.description}
                        </p>
                    )}
                </div>
                <div className="w-full">
                    <SelectFloating
                        label="Action"
                        name="action"
                        value={formData.action}
                        onChange={handleChange}
                        options={[
                            { id: "approve", label: "Approve" },
                            { id: "reject", label: "Reject" },
                            { id: "refer", label: "Refer" },
                        ]}
                    />
                    {errors.action && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.action}
                        </p>
                    )}
                </div>
                <div className="w-full">
                    <SelectFloating
                        label="Priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        options={[
                            { id: "urgent", label: "Urgent" },
                            { id: "high", label: "High" },
                            { id: "standard", label: "Standard" },
                            { id: "low", label: "Low" },
                        ]}
                    />
                    {errors.priority && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.priority}
                        </p>
                    )}
                </div>
            </div>

            <div className="my-4 flex justify-center md:justify-end w-full">
                <button
                    onClick={handleSubmit}
                    className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full md:w-auto"
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default CreatePaymentOrder;
