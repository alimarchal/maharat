import React from 'react';
import { Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faChevronRight } from "@fortawesome/free-solid-svg-icons";

export default function ReceiveGoods({ auth }) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <div className="min-h-screen p-6">
                {/* Back Button and Breadcrumbs */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => router.visit("/grn")}
                        className="flex items-center text-black text-2xl font-medium hover:text-gray-800 p-2"
                    >
                        <FontAwesomeIcon icon={faArrowLeftLong} className="mr-2 text-2xl" />
                        Back
                    </button>
                </div>
                <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2 mb-6">
                    <Link href="/dashboard" className="hover:text-[#009FDC] text-xl">Home</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <Link href="/warehouse" className="hover:text-[#009FDC] text-xl">Warehouse</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <Link href="/grn" className="hover:text-[#009FDC] text-xl">GRNs</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <span className="text-[#009FDC] text-xl">Receive Goods</span>
                </div>

                <div className="w-full overflow-hidden">
                <div className="flex flex-col items-start mb-6">
                    <h2 className="text-[32px] font-bold text-[#2C323C]">Receive Goods</h2>
                    <p className="text-purple-600 text-2xl">GRN#</p>
                </div>


                    <div className="w-full overflow-hidden">
                        <table className="w-full mb-12">
                            <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">Supplier</th>
                                    <th className="py-3 px-4">PC #</th>
                                    <th className="py-3 px-4">Quotation #</th>
                                    <th className="py-3 px-4">Quantity Quoted</th>
                                    <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">Due Delivery Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap">RECCO</td>
                                    <td className="px-6 py-4 whitespace-nowrap">MC-PO-2024/001</td>
                                    <td className="px-6 py-4 whitespace-nowrap">QT-2024/001</td>
                                    <td className="px-6 py-4 whitespace-nowrap">NQ</td>
                                    <td className="px-6 py-4 whitespace-nowrap">14 Jan 2025</td>
                                </tr>
                            </tbody>
                        </table>

                        <table className="w-full mb-6">
                            <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">Receiver</th>
                                    <th className="py-3 px-4">UPC</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4">Quantity Delivered</th>
                                    <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">Delivery Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap">Available</td>
                                    <td className="px-6 py-4 whitespace-nowrap">2 3460 99999 $</td>
                                    <td className="px-6 py-4 whitespace-nowrap">Corporate Hardware</td>
                                    <td className="px-6 py-4 whitespace-nowrap">NQ</td>
                                    <td className="px-6 py-4 whitespace-nowrap">14 Jan 2025</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="flex justify-end space-x-4 mt-16 pb-6"> 
                            <button
                                onClick={() => router.visit("/add-goods")}
                                className="bg-[#009FDC] text-white px-7 py-3 rounded-full text-xl font-medium"
                            >
                                Add Items to Inventory
                            </button>
                            <button
                                onClick={() => router.visit("/save")}
                                className="bg-[#009FDC] text-white px-7 py-3 rounded-full text-xl font-medium"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}