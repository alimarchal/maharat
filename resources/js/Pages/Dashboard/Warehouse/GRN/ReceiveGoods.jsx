import React from "react";
import { Link } from "@inertiajs/react";

export default function ReceiveGoods() {
    return (
        <div className="w-full">
            <div className="w-full overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-[32px] font-bold text-[#2C323C]">
                        Receive Goods
                    </h2>
                    <Link
                        href="/goods-receiving-notes/receive-goods/add-goods"
                        className="bg-[#009FDC] text-white px-7 py-3 rounded-full text-xl font-medium"
                    >
                        Add Items to Inventory
                    </Link>
                </div>

                <div className="w-full overflow-hidden">
                    <table className="w-full mb-12">
                        <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                    Supplier
                                </th>
                                <th className="py-3 px-4">PC #</th>
                                <th className="py-3 px-4">Quotation #</th>
                                <th className="py-3 px-4">Quantity Quoted</th>
                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                                    Due Delivery Date
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    RECCO
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    MC-PO-2024/001
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    QT-2024/001
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    NQ
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    14 Jan 2025
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <table className="w-full mb-6">
                        <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                    Receiver
                                </th>
                                <th className="py-3 px-4">UPC</th>
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4">
                                    Quantity Delivered
                                </th>
                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                                    Delivery Date
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    Available
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    2 3460 99999 $
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    Corporate Hardware
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    NQ
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    14 Jan 2025
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
