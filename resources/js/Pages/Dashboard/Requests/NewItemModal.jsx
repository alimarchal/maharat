import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCamera } from "@fortawesome/free-solid-svg-icons";
import InputFloating from "@/Components/InputFloating";
import { usePage } from "@inertiajs/react";
import { useRequestItems } from "@/Components/RequestItemsContext";
import { toast } from "react-hot-toast";

const NewItemModal = ({ isOpen, onClose }) => {
    const user_id = usePage().props.auth?.user?.id;
    const { addNewRequestItem } = useRequestItems();

    const [formData, setFormData] = useState({
        user_id: user_id,
        name: "",
        quantity: "",
        image: null,
        description: "",
        is_added: false,
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "image") {
            setFormData({ ...formData, image: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
        // Clear API error when user starts typing
        if (apiError) setApiError("");
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
        setApiError(""); // Clear any previous API errors
        
        try {
            const payload = new FormData();
            payload.append("user_id", formData.user_id);
            payload.append("name", formData.name);
            payload.append("quantity", formData.quantity);
            if (formData.image) {
            payload.append("photo", formData.image);
            }
            payload.append("description", formData.description);
            payload.append("is_added", formData.is_added ? "1" : "0");

            await addNewRequestItem(payload);

            setFormData({
                name: "",
                quantity: "",
                image: null,
                description: "",
            });

            toast.success('New item request submitted successfully!');
            onClose();
        } catch (error) {
            console.error("Error saving new item:", error);
            
            // Handle different types of errors
            if (error.response) {
                // Server responded with error status
                const status = error.response.status;
                const data = error.response.data;
                
                if (status === 422) {
                    // Validation errors
                    setErrors(data.errors || {});
                    toast.error('Please fix the validation errors above.');
                } else if (status === 500) {
                    // Server error
                    setApiError('Server error occurred. Please try again later or contact support.');
                    toast.error('Server error occurred. Please try again later.');
                } else if (status === 401) {
                    // Unauthorized
                    setApiError('You are not authorized to perform this action.');
                    toast.error('You are not authorized to perform this action.');
                } else if (status === 403) {
                    // Forbidden
                    setApiError('You do not have permission to perform this action.');
                    toast.error('You do not have permission to perform this action.');
                } else {
                    // Other server errors
                    setApiError(data.message || `Server error (${status}). Please try again.`);
                    toast.error(data.message || `Server error (${status}). Please try again.`);
                }
            } else if (error.request) {
                // Network error
                setApiError('Network error. Please check your internet connection and try again.');
                toast.error('Network error. Please check your internet connection.');
            } else {
                // Other errors
                setApiError('An unexpected error occurred. Please try again.');
                toast.error('An unexpected error occurred. Please try again.');
            }
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
                
                {apiError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <p className="font-bold">Error</p>
                        <p>{apiError}</p>
                    </div>
                )}
                
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
                                        Add a Photo (Optional)
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
                            className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full disabled:opacity-50"
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
