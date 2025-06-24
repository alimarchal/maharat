import React, { useState, useEffect } from "react";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faTimes } from "@fortawesome/free-solid-svg-icons";
import { useRequestItems } from "@/Components/RequestItemsContext";

const CreateProduct = () => {
    const { productId } = usePage().props;
    const { requestItems, pendingCount, updateRequestItemStatus } =
        useRequestItems();

    const [formData, setFormData] = useState({
        name: "",
        category_id: "",
        unit_id: "",
        upc: "",
        description: "",
        request_item: "",
    });

    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);

    const showRequestItemField =
        Array.isArray(requestItems?.data) &&
        requestItems.data.some((item) => !item.is_added);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [categoriesRes, unitsRes] = await Promise.all([
                    axios.get("/api/v1/product-categories", {
                        params: { per_page: 1000, sort: "name" },
                    }),
                    axios.get("/api/v1/units"),
                ]);

                setCategories(categoriesRes.data.data || []);
                setUnits(unitsRes.data.data || []);
            } catch (error) {
                console.error("Error fetching categories or units:", error);
            }

            if (productId) {
                try {
                    const res = await axios.get(
                        `/api/v1/products/${productId}`
                    );
                    const data = res.data.data;
                    setFormData({
                        name: data.name,
                        category_id: data.category_id,
                        unit_id: data.unit_id,
                        upc: data.upc,
                        description: data.description,
                        request_item: "",
                    });
                } catch (error) {
                    console.error("Error fetching product:", error);
                }
            }
        };
        fetchInitialData();
    }, [productId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Item Name is required";
        if (!formData.category_id)
            newErrors.category_id = "Category is required";
        if (!formData.unit_id) newErrors.unit_id = "Unit is required";
        if (!formData.upc.trim()) newErrors.upc = "UPC is required";
        if (!formData.description.trim())
            newErrors.description = "Description is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                category_id: formData.category_id,
                unit_id: formData.unit_id,
                upc: formData.upc,
                description: formData.description,
            };

            let createdProduct;
            if (productId) {
                const response = await axios.put(`/api/v1/products/${productId}`, payload);
                createdProduct = response.data.data;
            } else {
                const response = await axios.post("/api/v1/products", payload);
                createdProduct = response.data.data;
            }

            // Update the request item status if one was selected
            if (
                formData.request_item &&
                Array.isArray(requestItems.data) &&
                requestItems.data.some(
                    (item) => item.id == formData.request_item
                )
            ) {
                try {
                    // Update the request item status to approved and link the product
                    await axios.put(`/api/v1/request-item/${formData.request_item}/status`, {
                        status: "Approved",
                        approved_by: 1, // Assuming admin user ID is 1, you might want to get this dynamically
                        product_id: createdProduct.id,
                        is_added: true
                    });
                    
                    // Update the local state
                    updateRequestItemStatus(formData.request_item, "Approved", createdProduct.id);
                    
                    setFormData((prev) => ({ ...prev, request_item: "" }));
                } catch (err) {
                    setErrors((prev) => ({
                        ...prev,
                        request_item: "Failed to update request item status",
                    }));
                }
            }
            router.visit("/items");
        } catch (error) {
            setErrors(
                error.response?.data?.errors || {
                    general: "An error occurred while saving the product",
                }
            );
        } finally {
            setLoading(false);
        }
    };

    const handleViewItem = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const handleReject = async (item) => {
        if (!confirm('Are you sure you want to reject this item request?')) {
            return;
        }

        setRejectingId(item.id);
        try {
            const payload = {
                status: "Rejected",
                approved_by: 1,
                rejection_reason: "Rejected by user"
            };

            await axios.put(`/api/v1/request-item/${item.id}/status`, payload);
            
            // Update the local state
            updateRequestItemStatus(item.id, "Rejected");
        } catch (error) {
            console.error("Error rejecting item:", error);
            alert('Failed to reject item request. Please try again.');
        } finally {
            setRejectingId(null);
        }
    };

    const handleAddItem = (item) => {
        // Auto-fill the form with the selected item's data
        setFormData({
            name: item.name,
            category_id: item.category_id || "",
            unit_id: item.unit_id || "",
            upc: "", // UPC will need to be filled manually
            description: item.description || "",
            request_item: item.id.toString(),
        });
        
        // Scroll to the form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getPendingItems = () => {
        if (!Array.isArray(requestItems?.data)) return [];
        return requestItems.data.filter(item => item.status === "Pending");
    };

    return (
        <>
            <h2 className="text-3xl font-bold text-[#2C323C]">
                {productId ? "Edit Item" : "Make a New Item"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <SelectFloating
                            label="Category"
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleChange}
                            options={categories.map((cat) => ({
                                id: cat.id,
                                label: cat.name,
                            }))}
                        />
                        {errors.category_id && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.category_id}
                            </p>
                        )}
                    </div>
                    <div>
                        <InputFloating
                            label="Item Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.name}
                            </p>
                        )}
                    </div>
                </div>
                <div
                    className={`grid gap-4 ${
                        showRequestItemField && !productId
                            ? "grid-cols-1 md:grid-cols-3"
                            : "grid-cols-1 md:grid-cols-2"
                    }`}
                >
                    {showRequestItemField && !productId && (
                        <div>
                            <SelectFloating
                                label="Requested Item"
                                name="request_item"
                                value={formData.request_item}
                                onChange={handleChange}
                                options={requestItems.data
                                    .filter((item) => !item.is_added)
                                    .map((item) => ({
                                        id: item.id,
                                        label: item.name,
                                    }))}
                            />
                            {errors.request_item && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.request_item}
                                </p>
                            )}
                        </div>
                    )}
                    <div>
                        <SelectFloating
                            label="Unit"
                            name="unit_id"
                            value={formData.unit_id}
                            onChange={handleChange}
                            options={units.map((unit) => ({
                                id: unit.id,
                                label: unit.name,
                            }))}
                        />
                        {errors.unit_id && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.unit_id}
                            </p>
                        )}
                    </div>
                    <div>
                        <InputFloating
                            label="Item Code"
                            name="upc"
                            value={formData.upc}
                            onChange={handleChange}
                        />
                        {errors.upc && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.upc}
                            </p>
                        )}
                    </div>
                </div>
                <div>
                    <div className="relative w-full">
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="peer border border-gray-300 p-5 rounded-2xl w-full h-24 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                        ></textarea>
                        <label
                            className={`absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                            peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
                            peer-focus:-top-2 peer-focus:left-2 peer-focus:text-base peer-focus:text-[#009FDC] peer-focus:px-1
                            ${
                                formData.description
                                    ? "-top-2 left-2 text-base text-[#009FDC] px-1"
                                    : "top-4 text-base text-gray-400"
                            }`}
                        >
                            Description
                        </label>
                    </div>
                    {errors.description && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.description}
                        </p>
                    )}
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-[#009FDC] text-white text-lg font-medium px-6 py-3 rounded-lg hover:bg-[#007CB8] disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading
                            ? productId
                                ? "Updating..."
                                : "Creating..."
                            : productId
                            ? "Update Item"
                            : "Create Item"}
                    </button>
                </div>
            </form>

            {pendingCount > 0 && !productId && (
                <div className="my-10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-3xl font-bold text-[#2C323C]">
                            Pending Item Requests
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-center">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                        User Name
                                    </th>
                                    <th className="py-3 px-4">Item Name</th>
                                    <th className="py-3 px-4">Description</th>
                                    <th className="py-3 px-4">Quantity</th>
                                    <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#D7D8D9] text-base font-medium text-center text-[#2C323C]">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="text-start py-8"
                                        >
                                            <div className="w-10 h-10 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin mx-auto" />
                                        </td>
                                    </tr>
                                ) : (
                                    getPendingItems().map((product) => (
                                            <tr key={product.id}>
                                                <td className="py-3 px-4">
                                                    {product.user?.name}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {product.name}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {product.description}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {product.quantity}
                                                </td>
                                                <td className="py-3 px-4 flex justify-center text-center space-x-3">
                                                    <button
                                                        className="text-[#9B9DA2] hover:text-gray-500"
                                                        title="View Item"
                                                        onClick={() =>
                                                            handleViewItem(
                                                                product
                                                            )
                                                        }
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faEye}
                                                        />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAddItem(product)}
                                                        className="px-4 py-2 rounded-lg text-sm font-medium bg-[#009FDC] text-white hover:bg-[#007CB8] transition-colors"
                                                    >
                                                        Add Item
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(product)}
                                                        disabled={rejectingId === product.id}
                                                        className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {rejectingId === product.id ? 'Rejecting...' : 'Reject'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {isModalOpen && selectedItem && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-8 rounded-2xl w-[90%] max-w-3xl">
                        <div className="flex justify-between border-b pb-2 mb-4">
                            <h2 className="text-3xl font-bold text-[#2C323C]">
                                Item Details
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-red-500 hover:text-red-800"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 space-y-4 border-b pb-2">
                            <p className="flex justify-start items-center gap-4">
                                <strong>Item Name:</strong> {selectedItem.name}
                            </p>
                            <p className="flex justify-start items-center gap-4">
                                <strong>User:</strong> {selectedItem.user?.name}
                            </p>
                            <p className="flex justify-start items-center gap-4">
                                <strong>Quantity:</strong>
                                {selectedItem.quantity}
                            </p>
                            <p className="flex justify-start items-center gap-4">
                                <strong>Description:</strong>
                                {selectedItem.description}
                            </p>
                        </div>

                        {selectedItem.photo && (
                            <div className="flex justify-center text-center my-4 md:my-8">
                                <img
                                    src={`/storage/${selectedItem.photo}`}
                                    alt={selectedItem.name}
                                    className="max-w-full max-h-96 w-auto h-auto object-contain"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default CreateProduct;
