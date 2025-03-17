import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEdit,
    faTrash,
    faCheck,
    faPlus,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

export default function InventoryTracking() {
    const [inventories, setInventories] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);

    const fetchInventories = async () => {
        setLoading(true);
        setProgress(0);

        try {
            const response = await axios.get(
                `/api/v1/inventories?page=${currentPage}`
            );
            setInventories(response.data.data);
            setLastPage(response.data.meta.last_page);
            setError("");
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } catch (error) {
            console.error("API Error:", error);
            setError("Failed to load inventories");
            setInventories([]);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const response = await axios.get("/api/v1/warehouses");
            setWarehouses(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Failed to fetch warehouses:", error);
            setWarehouses([]);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get("/api/v1/products");
            setProducts(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Failed to fetch products:", error);
            setProducts([]);
        }
    };

    useEffect(() => {
        fetchInventories();
        fetchWarehouses();
        fetchProducts();
    }, [currentPage]);

    const handleSave = async (id) => {
        try {
            let response;
            if (id.toString().length > 10) {
                // New item (temporary ID)
                response = await axios.post("/api/v1/inventories", editData);
            } else {
                // Existing item
                response = await axios.put(
                    `/api/v1/inventories/${id}`,
                    editData
                );
            }

            if (response.data.success) {
                fetchInventories();
                setEditingId(null);
            } else {
                setError("Failed to save changes");
            }
        } catch (error) {
            console.error("Save error:", error);
            setError("Failed to save changes");
        }
    };

    const handleEdit = (inventory) => {
        setEditingId(inventory.id);
        setEditData(inventory);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            if (id.toString().length > 10) {
                // Temporary ID (newly added record)
                setInventories((prevInventories) =>
                    prevInventories.filter((inv) => inv.id !== id)
                );
            } else {
                // Permanent ID (existing record)
                await axios.delete(`/api/v1/inventories/${id}`);
                fetchInventories(); // Refresh the list
            }
        } catch (error) {
            console.error("Delete error:", error);
            setError("Failed to delete record");
        }
    };

    const addItem = () => {
        const newInventory = {
            id: Date.now(),
            warehouse_id: "",
            product_id: "",
            quantity: 0,
            reorder_level: 0,
            description: "",
        };
        setInventories([...inventories, newInventory]);
        setEditingId(newInventory.id);
        setEditData(newInventory);
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-[32px] font-bold text-[#2C323C]">
                    Inventory Tracking
                </h2>
            </div>

            <div className="w-full overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center">
                                ID
                            </th>
                            <th className="py-3 px-4 text-center">Warehouse</th>
                            <th className="py-3 px-4 text-center">Product</th>
                            <th className="py-3 px-4 text-center">Quantity</th>
                            <th className="py-3 px-4 text-center">
                                Reorder Level
                            </th>
                            <th className="py-3 px-4 text-center">
                                Description
                            </th>
                            <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
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
                            inventories.map((inventory, index) => (
                                <tr key={inventory.id}>
                                    <td className="px-6 py-4 text-center">
                                        {inventory.id}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {editingId === inventory.id ? (
                                            <select
                                                value={
                                                    editData.warehouse_id || ""
                                                }
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        warehouse_id:
                                                            e.target.value,
                                                    })
                                                }
                                                className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center"
                                            >
                                                <option value="">
                                                    Select Warehouse
                                                </option>
                                                {warehouses.map((warehouse) => (
                                                    <option
                                                        key={warehouse.id}
                                                        value={warehouse.id}
                                                    >
                                                        {warehouse.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            warehouses.find(
                                                (w) =>
                                                    w.id ===
                                                    inventory.warehouse_id
                                            )?.name || "N/A"
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {editingId === inventory.id ? (
                                            <select
                                                value={
                                                    editData.product_id || ""
                                                }
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        product_id:
                                                            e.target.value,
                                                    })
                                                }
                                                className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center"
                                            >
                                                <option value="">
                                                    Select Product
                                                </option>
                                                {products.map((product) => (
                                                    <option
                                                        key={product.id}
                                                        value={product.id}
                                                    >
                                                        {product.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            products.find(
                                                (p) =>
                                                    p.id ===
                                                    inventory.product_id
                                            )?.name || "N/A"
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {editingId === inventory.id ? (
                                            <input
                                                type="number"
                                                value={editData.quantity || 0}
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        quantity:
                                                            e.target.value,
                                                    })
                                                }
                                                className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center [&::-webkit-inner-spin-button]:hidden"
                                            />
                                        ) : (
                                            inventory.quantity
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {editingId === inventory.id ? (
                                            <input
                                                type="number"
                                                value={
                                                    editData.reorder_level || 0
                                                }
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        reorder_level:
                                                            e.target.value,
                                                    })
                                                }
                                                className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center [&::-webkit-inner-spin-button]:hidden"
                                            />
                                        ) : (
                                            inventory.reorder_level
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {editingId === inventory.id ? (
                                            <input
                                                type="text"
                                                value={
                                                    editData.description || ""
                                                }
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        description:
                                                            e.target.value,
                                                    })
                                                }
                                                className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center"
                                            />
                                        ) : (
                                            inventory.description
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex justify-center space-x-3">
                                            {editingId === inventory.id ? (
                                                <button
                                                    onClick={() =>
                                                        handleSave(inventory.id)
                                                    }
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faCheck}
                                                        className="h-5 w-5"
                                                    />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        handleEdit(inventory)
                                                    }
                                                    className="text-gray-600 hover:text-gray-600"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faEdit}
                                                        className="h-5 w-5"
                                                    />
                                                </button>
                                            )}
                                            <button
                                                onClick={() =>
                                                    handleDelete(inventory.id)
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
                                <td colSpan="7" className="text-center">
                                    No inventories available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Add Inventory Button */}
                {!loading &&
                    currentPage === lastPage &&
                    inventories.length > 0 && (
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
                                onClick={addItem}
                            >
                                <FontAwesomeIcon
                                    icon={faPlus}
                                    className="mr-2"
                                />{" "}
                                Add Inventory
                            </button>
                            <div
                                className="absolute top-1/2 right-0 w-[45%] h-[3px] max-sm:w-[35%] flex-grow"
                                style={{
                                    background:
                                        "linear-gradient(to left, #9B9DA2, #9B9DA200)",
                                }}
                            ></div>
                        </div>
                    )}

                {/* Pagination */}
                {!loading && !error && inventories.length > 0 && (
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
                            onClick={() => setCurrentPage(currentPage + 1)}
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
        </div>
    );
}
