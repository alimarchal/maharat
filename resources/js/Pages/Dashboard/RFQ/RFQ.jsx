import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faEye, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

const RFQ = () => {
    const [selectedFilter, setSelectedFilter] = useState("All");

    // Sample data for RFQs
    const rfqs = [
        {
            id: "",
            item: "",
            priority: "",
            status: "",
            date: "",
            time: "",
        },
        // Add more RFQs as needed
    ];

    const statusColors = {
        Pending: "",
        Approved: "",
        Rejected: "",
    };

    const priorityColors = {
        High: "",
        Medium: "",
        Low: "",
    };

    return (
        <AuthenticatedLayout>
        <div className="min-h-screen p-6">
            {/* Back Button and Breadcrumbs */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => router.visit("/dashboard")}
                    className="flex items-center text-black text-2xl font-medium hover:text-gray-800 p-2"
                >
                    <FontAwesomeIcon icon={faArrowLeftLong} className="mr-2 text-2xl" />
                    Back
                </button>
            </div>
            <div className="flex items-center space-x-2 text-xl">
                    <Link
                        href="/dashboard"
                        className="text-black hover:text-blue-500"
                    >
                        Home
                    </Link>
                    <span className="text-gray-400">/</span>
                    <Link
                        href="/purchase"
                        className="text-black hover:text-blue-500"
                    >
                        Purchase
                    </Link>
                    <span className="text-gray-400">/</span>
                    <span className="text-blue-500">RFQs</span>
                </div>

            {/* RFQs Logs Heading and Make New RFQ Button */}
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">RFQs Logs</h2>
                <Link
                    href="/new-rfq"
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                >
                    Make New RFQ
                </Link>
            </div>

            {/* RFQs Table */}
            <div className="w-full overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">Doc ID</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Supplier</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Date & Time</th>
                            <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">More</th>
                        </tr>
                    </thead>

                    <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                        {rfqs.map((rfq, index) => (
                            <tr key={index}>
                                <td className="py-3 px-4">{rfq.id}</td>
                                <td className="py-3 px-4">{rfq.item}</td>
                                <td className={`py-3 px-4 ${priorityColors[rfq.priority]}`}>
                                    {rfq.priority}
                                </td>
                                <td className={`py-3 px-4 font-semibold ${statusColors[rfq.status]}`}>
                                    {rfq.status}
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex flex-col">
                                        {rfq.date}
                                        <span className="text-gray-400">{rfq.time}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 flex space-x-3">
                                    <button className="text-[#9B9DA2] hover:text-gray-500">
                                        <FontAwesomeIcon icon={faEye} />
                                    </button>
                                    <button className="text-[#9B9DA2] hover:text-gray-500">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button className="text-[#9B9DA2] hover:text-gray-500">
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                    <button className="px-3 py-1 bg-[#009FDC] text-white rounded-full hover:bg-[#0077B6] transition">
                        1
                    </button>
                    <button className="px-3 py-1 border border-[#B9BBBD] bg-white rounded-full hover:bg-gray-100 transition">
                        2
                    </button>
                    <button className="px-3 py-1 border border-[#B9BBBD] bg-white rounded-full hover:bg-gray-100 transition">
                        3
                    </button>
                    <span className="px-3 py-1 text-[#B9BBBD]">...</span>
                    <button className="px-3 py-1 bg-[#009FDC] text-white rounded-full hover:bg-[#0077B6] transition">
                        Next
                    </button>
                </div>
            </div>
        </div>
        </AuthenticatedLayout>
    );
};

export default RFQ;