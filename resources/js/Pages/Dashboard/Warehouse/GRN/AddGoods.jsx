import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";
import AddGoodsModal from "./AddGoodsModal";

export default function AddItemsToInventory() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [selectedGoods, setSelectedGoods] = useState(null);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const [items, setItems] = useState([
        {
            id: 1,
            itemId: "dld3x4b2",
            category: "Lenine",
            brand: "Dull",
            quantity: "12",
            description: "Dell Lenine",
        },
        {
            id: 2,
            itemId: "DQ24467",
            category: "Photo",
            brand: "Apple",
            quantity: "04",
            description: "Apple Lenine",
        },
        {
            id: 3,
            itemId: "Share",
            category: "Share",
            brand: "Mine",
            quantity: "08",
            description: "Photos",
        },
    ]);

    const deleteItem = (id) => {
        setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    };

    return (
        <div className="w-full">
            <div className="w-full overflow-hidden">
                <div className="flex flex-col items-start mb-6">
                    <h2 className="text-[32px] font-bold text-[#2C323C]">
                        Add Items to Inventory
                    </h2>
                </div>

                <div className="w-full overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                    Item ID
                                </th>
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4">Brand</th>
                                <th className="py-3 px-4">Quantity</th>
                                <th className="py-3 px-4">Description</th>
                                <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="text-center py-12"
                                    >
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
                            ) : items.length > 0 ? (
                                items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3 px-4">
                                            {item.itemId}
                                        </td>
                                        <td className="py-3 px-4">
                                            {item.category}
                                        </td>
                                        <td className="py-3 px-4">
                                            {item.brand}
                                        </td>
                                        <td className="py-3 px-4">
                                            {item.quantity}
                                        </td>
                                        <td className="py-3 px-4">
                                            {item.description}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center space-x-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedGoods(item);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="text-[#9B9DA2] hover:text-gray-500"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faEdit}
                                                        className="h-5 w-5"
                                                    />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        deleteItem(item.id)
                                                    }
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faTrash}
                                                        className="h-5 w-5"
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="text-center text-[#2C323C] font-medium py-4"
                                    >
                                        No Goods found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {!loading && !error && items.length > 0 && lastPage > 1 && (
                        <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                            {Array.from(
                                { length: lastPage },
                                (_, index) => index + 1
                            ).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 ${
                                        currentPage === page
                                            ? "bg-[#009FDC] text-white"
                                            : "border border-[#B9BBBD] bg-white"
                                    } rounded-full hover:bg-[#0077B6] transition`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(prev + 1, lastPage)
                                    )
                                }
                                className={`px-3 py-1 bg-[#009FDC] text-white rounded-full hover:bg-[#0077B6] transition ${
                                    currentPage >= lastPage
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }`}
                                disabled={currentPage >= lastPage}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex justify-center items-center relative w-full my-8">
                    <div
                        className="absolute top-1/2 left-0 w-[45%] h-[3px] max-sm:w-[35%] flex-grow"
                        style={{
                            background:
                                "linear-gradient(to right, #9B9DA2, #9B9DA200)",
                        }}
                    ></div>
                    <button
                        type="button"
                        className="p-2 text-base sm:text-lg flex items-center bg-white rounded-full border border-[#B9BBBD] text-[#9B9DA2] transition-all duration-300 hover:border-[#009FDC] hover:bg-[#009FDC] hover:text-white hover:scale-105"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add
                        Goods
                    </button>
                    <div
                        className="absolute top-1/2 right-0 w-[45%] h-[3px] max-sm:w-[35%] flex-grow"
                        style={{
                            background:
                                "linear-gradient(to left, #9B9DA2, #9B9DA200)",
                        }}
                    ></div>
                </div>

                {/* Render the modal */}
                <AddGoodsModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedGoods(null);
                    }}
                    goodsData={selectedGoods}
                />
            </div>
        </div>
    );
}
