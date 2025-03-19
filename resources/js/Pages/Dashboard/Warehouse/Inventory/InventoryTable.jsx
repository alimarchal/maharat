import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InventoryModal from "./InventoryModal";

const InventoryTable = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inventories, setInventories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedInventory, setSelectedInventory] = useState(null);

    const fetchInventories = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `/api/v1/inventories?include=warehouse,product`
            );
            setInventories(response.data.data);
            setError(null);
        } catch (error) {
            console.error("Error fetching inventories:", error);
            setError("Failed to load inventories. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventories();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this Inventory?")) {
            try {
                await axios.delete(`/api/v1/inventories/${id}`);
                fetchInventories();
            } catch (error) {
                console.error("Error deleting inventory:", error);
            }
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedInventory(null);
    };

    return (
        <div className="w-full">
            <h2 className="text-3xl font-bold text-[#2C323C] mb-8">
                Inventory Tracking
            </h2>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            ID
                        </th>
                        <th className="py-3 px-4">Warehouse</th>
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">Quantity</th>
                        <th className="py-3 px-4">Reorder Level</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
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
                    ) : inventories.length > 0 ? (
                        inventories.map((inventory) => (
                            <tr key={inventory.id}>
                                <td className="py-3 px-4">{inventory.id}</td>
                                <td className="py-3 px-4">
                                    {inventory.warehouse?.name || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {inventory.product?.name || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {parseInt(inventory.quantity)}
                                </td>
                                <td className="py-3 px-4">
                                    {parseInt(inventory.reorder_level)}
                                </td>
                                <td className="py-3 px-4">
                                    {inventory.description}
                                </td>
                                <td className="py-3 px-4 flex space-x-3">
                                    {/* <button
                                        onClick={() => {
                                            setSelectedInventory(inventory);
                                            setIsModalOpen(true);
                                        }}
                                        className="text-[#9B9DA2] hover:text-gray-500"
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button> */}

                                    <button
                                        className="text-[#9B9DA2] hover:text-gray-500"
                                        onClick={() =>
                                            handleDelete(inventory.id)
                                        }
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="7"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Inventories found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

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
                    Inventory
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
            <InventoryModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                inventoryData={selectedInventory}
                fetchInventories={fetchInventories}
            />
        </div>
    );
};

export default InventoryTable;
