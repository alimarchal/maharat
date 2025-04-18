import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";

const InventoryModal = ({
    isOpen,
    onClose,
    inventoryData,
    fetchInventories,
}) => {
    const [formData, setFormData] = useState({
        warehouse_id: "",
        product_id: "",
        quantity: "",
        reorder_level: "",
        description: "",
    });

    const [errors, setErrors] = useState({});
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (inventoryData) {
                setFormData({
                    warehouse_id: inventoryData.warehouse_id || "",
                    product_id: inventoryData.product_id || "",
                    quantity: inventoryData.quantity || "",
                    reorder_level: inventoryData.reorder_level || "",
                    description: inventoryData.description || "",
                });
            } else {
                setFormData({
                    warehouse_id: "",
                    product_id: "",
                    quantity: "",
                    reorder_level: "",
                    description: "",
                });
            }
            setErrors({});
        }
    }, [isOpen, inventoryData]);

    useEffect(() => {
        if (isOpen) {
            const fetchWarehouses = async () => {
                try {
                    const response = await axios.get("/api/v1/warehouses");
                    setWarehouses(response.data.data);
                } catch (error) {
                    console.error("Error fetching warehouses:", error);
                }
            };

            const fetchProducts = async () => {
                try {
                    const response = await axios.get("/api/v1/products");
                    setProducts(response.data.data);
                } catch (error) {
                    console.error("Error fetching products:", error);
                }
            };

            fetchWarehouses();
            fetchProducts();
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.warehouse_id)
            newErrors.warehouse_id = "Warehouse is required.";
        if (!formData.product_id) newErrors.product_id = "Product is required.";
        if (!formData.quantity) newErrors.quantity = "Quantity is required.";
        if (!formData.reorder_level)
            newErrors.reorder_level = "Reorder Level is required.";
        if (!formData.description)
            newErrors.description = "Description is required.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            let apiUrl = "/api/v1/inventories";
            console.log("Form data to be submitted:", formData);

            if (inventoryData && inventoryData.id) {
                console.log(`Updating inventory ID: ${inventoryData.id}`);
                console.log("Full update payload:", formData);
                console.log("API endpoint:", `${apiUrl}/${inventoryData.id}`);
                const response = await axios.post(`${apiUrl}/${inventoryData.id}`, formData);
                console.log("Update response:", response.data);
            } else {
                console.log("Creating new inventory");
                console.log("Full create payload:", formData);
                const response = await axios.post(apiUrl, formData);
                console.log("Create response:", response.data);
            }

            console.log("Refreshing inventory data");
            await fetchInventories();
            onClose();
        } catch (error) {
            console.error("Error saving inventory:", error);
            console.error("Response details:", error.response?.data);
            setErrors(
                error.response?.data?.errors || {
                    general: "Error saving inventory. Please try again.",
                }
            );
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-4xl">
                <div className="flex justify-between border-b pb-2 mb-8">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        {inventoryData ? "Edit Inventory" : "Add Inventory"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.general && (
                        <p className="text-red-500 text-base text-center mb-4">
                            {errors.general}
                        </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <SelectFloating
                                label="Warehouse"
                                name="warehouse_id"
                                value={formData.warehouse_id}
                                onChange={handleChange}
                                options={warehouses.map((wh) => ({
                                    id: wh.id,
                                    label: wh.name,
                                }))}
                            />
                            {errors.warehouse_id && (
                                <p className="text-red-500 text-sm">
                                    {errors.warehouse_id}
                                </p>
                            )}
                        </div>
                        <div>
                            <SelectFloating
                                label="Product"
                                name="product_id"
                                value={formData.product_id}
                                onChange={handleChange}
                                options={products.map((prod) => ({
                                    id: prod.id,
                                    label: prod.name,
                                }))}
                            />
                            {errors.product_id && (
                                <p className="text-red-500 text-sm">
                                    {errors.product_id}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <InputFloating
                                label="Quantity"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                            />
                            {errors.quantity && (
                                <p className="text-red-500 text-sm">
                                    {errors.quantity}
                                </p>
                            )}
                        </div>
                        <div>
                            <InputFloating
                                label="Reorder Level"
                                name="reorder_level"
                                value={formData.reorder_level}
                                onChange={handleChange}
                            />
                            {errors.reorder_level && (
                                <p className="text-red-500 text-sm">
                                    {errors.reorder_level}
                                </p>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <InputFloating
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                            {errors.description && (
                                <p className="text-red-500 text-sm">
                                    {errors.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="my-4 flex justify-center w-full">
                        <button
                            type="submit"
                            className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventoryModal;
