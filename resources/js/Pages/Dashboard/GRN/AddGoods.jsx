import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faChevronRight, faTrash } from "@fortawesome/free-solid-svg-icons";

export default function AddItemsToInventory({ auth }) {
    const [items, setItems] = useState([
        { id: 1, itemId: 'dld3x4b2', category: 'Lenine', brand: 'Dull', quantity: '12', description: 'Dell Lenine' },
        { id: 2, itemId: 'DQ24467', category: 'Photo', brand: 'Apple', quantity: '04', description: 'Apple Lenine' },
        { id: 3, itemId: 'Share', category: 'Share', brand: 'Mine', quantity: '08', description: 'Photos' }
    ]);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const addItem = () => {
        const newItem = {
            id: items.length + 1,
            itemId: '',
            category: '',
            brand: '',
            quantity: '',
            description: ''
        };
        setItems([...items, newItem]);
    };

    const deleteItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleInputChange = (id, field, value) => {
        setItems(items.map(item => 
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <div className="min-h-screen p-6">
                {/* Back Button and Breadcrumbs */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => router.visit("/receive-goods")}
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
                    <Link href="/receive-goods" className="hover:text-[#009FDC] text-xl">Receive Goods</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <span className="text-[#009FDC] text-xl">Add Items to Inventory</span>
                </div>

                <div className="w-full overflow-hidden">
                    <div className="flex flex-col items-start mb-6">
                        <h2 className="text-[32px] font-bold text-[#2C323C]">Add Items to Inventory</h2>
                    </div>

                    <div className="w-full overflow-hidden">
                        <table className="w-full mb-12">
                            <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-center">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">Item ID</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4">Brand</th>
                                    <th className="py-3 px-4">Quantity</th>
                                    <th className="py-3 px-4">Description</th>
                                    <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                            {items.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((item) => (
                                <tr key={item.id} className="text-center">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="text"
                                            value={item.itemId}
                                            onChange={(e) => handleInputChange(item.id, 'itemId', e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 text-center"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="text"
                                            value={item.category}
                                            onChange={(e) => handleInputChange(item.id, 'category', e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 text-center"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="text"
                                            value={item.brand}
                                            onChange={(e) => handleInputChange(item.id, 'brand', e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 text-center"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="text"
                                            value={item.quantity}
                                            onChange={(e) => handleInputChange(item.id, 'quantity', e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 text-center"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => handleInputChange(item.id, 'description', e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 text-center"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => deleteItem(item.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                        </table>

                        {/* Add Item Button (Proper Formatting) */}
                        <div className="mt-4 flex justify-center">
                            <button
                                type="button"
                                onClick={addItem}
                                className="text-blue-600 flex items-center"
                            >
                                + Add Item
                            </button>
                        </div>
                    </div>

                    {/* Pagination */}
                    {items.length > rowsPerPage && (
                        <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                className={`px-3 py-1 bg-[#009FDC] text-white rounded-full ${
                                    currentPage <= 1 ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                                disabled={currentPage <= 1}
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.ceil(items.length / rowsPerPage) }, (_, index) => index + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 ${
                                        currentPage === page
                                            ? "bg-[#009FDC] text-white"
                                            : "border border-[#B9BBBD] bg-white text-black"
                                    } rounded-full`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                className={`px-3 py-1 bg-[#009FDC] text-white rounded-full ${
                                    currentPage >= Math.ceil(items.length / rowsPerPage) ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                                disabled={currentPage >= Math.ceil(items.length / rowsPerPage)}
                            >
                                Next
                            </button>
                        </div>
                    )}

                    {/* Save Button at the Bottom */}
                    <div className="flex justify-end mt-16 pb-6">
                        <button
                            onClick={() => router.visit("/save")}
                            className="bg-[#009FDC] text-white px-7 py-3 rounded-full text-xl font-medium"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
