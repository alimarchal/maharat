import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCamera } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "@/Components/InputFloating";

const NewItemModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        name: "",
        quantity: "",
        image: null,
        description: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "image") {
            setFormData({ ...formData, image: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.name) newErrors.name = "Item Name is required.";
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
            const payload = new FormData();
            payload.append("name", formData.name);
            payload.append("quantity", formData.quantity);
            payload.append("photo", formData.image);
            payload.append("description", formData.description);

            const response = await axios.post("/api/v1/request-item", payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setFormData({
                name: "",
                quantity: "",
                image: null,
                description: "",
            });

            onClose();
        } catch (error) {
            setErrors(error.response?.data.errors || {});
            console.error("Error saving new item:", error);
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
                        Request for a New Item
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
                                label="Item Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                            {errors.name && (
                                <p className="text-red-500 text-sm">
                                    {errors.name}
                                </p>
                            )}
                        </div>
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
                            <label className="border p-5 rounded-2xl bg-white w-full flex items-center justify-start cursor-pointer relative">
                                <FontAwesomeIcon
                                    icon={faCamera}
                                    className="text-gray-400 mr-2"
                                />
                                {formData.image ? (
                                    <span className="text-sm sm:text-base overflow-hidden text-ellipsis max-w-[80%]">
                                        {formData.image.name}
                                    </span>
                                ) : (
                                    <span className="text-sm sm:text-base text-gray-400">
                                        Add a Photo
                                    </span>
                                )}
                                <input
                                    type="file"
                                    name="image"
                                    accept="image/*"
                                    onChange={handleChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <div>
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

export default NewItemModal;
