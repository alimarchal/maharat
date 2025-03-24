import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "../../../../Components/InputFloating";

const AddGoodsModal = ({ isOpen, onClose, goodsData, fetchGoods }) => {
    const [formData, setFormData] = useState({
        itemId: "",
        category: "",
        brand: "",
        quantity: "",
        description: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (goodsData) {
            setFormData({
                itemId: goodsData.itemId || "",
                category: goodsData.category || "",
                brand: goodsData.brand || "",
                quantity: goodsData.quantity || "",
                description: goodsData.description || "",
            });
        } else {
            setFormData({
                itemId: "",
                category: "",
                brand: "",
                quantity: "",
                description: "",
            });
        }
    }, [goodsData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.itemId) newErrors.itemId = "Item ID is required.";
        if (!formData.category) newErrors.category = "Category is required.";
        if (!formData.brand) newErrors.brand = "Brand is required.";
        if (!formData.quantity) newErrors.quantity = "Quantity is required.";
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
            if (goodsData && goodsData.id) {
                await axios.put(`/api/v1/goods/${goodsData.id}`, formData);
            } else {
                await axios.post("/api/v1/goods", formData);
            }

            fetchGoods();
            onClose(); // Close modal after successful API call
        } catch (error) {
            setErrors(error.response?.data.errors || {});
            console.error("Error saving goods:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-4xl">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        {goodsData ? "Edit Item" : "Add Item"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <InputFloating
                                label="Items"
                                name="itemId"
                                value={formData.itemId}
                                onChange={handleChange}
                            />
                            {errors.itemId && (
                                <p className="text-red-500 text-sm">
                                    {errors.itemId}
                                </p>
                            )}
                        </div>
                        <div>
                            <InputFloating
                                label="Category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                            />
                            {errors.category && (
                                <p className="text-red-500 text-sm">
                                    {errors.category}
                                </p>
                            )}
                        </div>
                        <div>
                            <InputFloating
                                label="Brand"
                                name="brand"
                                value={formData.brand}
                                onChange={handleChange}
                            />
                            {errors.brand && (
                                <p className="text-red-500 text-sm">
                                    {errors.brand}
                                </p>
                            )}
                        </div>
                        <div>
                            <InputFloating
                                label="Quantity"
                                name="quantity"
                                type="number"
                                value={formData.quantity}
                                onChange={handleChange}
                            />
                            {errors.quantity && (
                                <p className="text-red-500 text-sm">
                                    {errors.quantity}
                                </p>
                            )}
                        </div>

                        <div className="col-span-1 md:col-span-2">
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

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="submit"
                            className="px-6 py-2 bg-[#009FDC] text-white rounded-lg hover:bg-[#0077B6] transition"
                            disabled={loading}
                        >
                            {loading
                                ? "Saving..."
                                : goodsData
                                ? "Update Item"
                                : "Add Item"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddGoodsModal;
