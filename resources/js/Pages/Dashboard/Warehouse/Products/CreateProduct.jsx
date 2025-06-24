import React, { useState, useEffect } from "react";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faTimes, faEdit } from "@fortawesome/free-solid-svg-icons";
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
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [statusUpdateModal, setStatusUpdateModal] = useState(false);
    const [selectedItemForStatus, setSelectedItemForStatus] = useState(null);
    const [statusForm, setStatusForm] = useState({
        status: "Pending",
        rejection_reason: ""
    });

    const filters = ["All", "Pending", "Approved", "Rejected"];

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

    const handleFilterChange = (filter) => {
        setSelectedFilter(filter);
    };

    const handleEditStatus = (item) => {
        setSelectedItemForStatus(item);
        setStatusForm({
            status: "Rejected",
            rejection_reason: ""
        });
        setStatusUpdateModal(true);
    };

    const closeStatusModal = () => {
        setStatusUpdateModal(false);
        setSelectedItemForStatus(null);
        setStatusForm({
            status: "Rejected",
            rejection_reason: ""
        });
    };

    const handleStatusUpdate = async () => {
        try {
            const payload = {
                status: "Rejected",
                approved_by: 1,
                rejection_reason: statusForm.rejection_reason
            };

            await axios.put(`/api/v1/request-item/${selectedItemForStatus.id}/status`, payload);
            
            // Update the local state
            updateRequestItemStatus(selectedItemForStatus.id, "Rejected");
            
            closeStatusModal();
        } catch (error) {
            console.error("Error updating status:", error);
            setErrors((prev) => ({
                ...prev,
                status: "Failed to update status",
            }));
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

    const getFilteredItems = () => {
        if (!Array.isArray(requestItems?.data)) return [];
        
        switch (selectedFilter) {
            case "Pending":
                return requestItems.data.filter(item => item.status === "Pending");
            case "Approved":
                return requestItems.data.filter(item => item.status === "Approved");
            case "Rejected":
                return requestItems.data.filter(item => item.status === "Rejected");
            default:
                return requestItems.data;
        }
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
                            Requested Items
                    </h2>
                        <div className="p-1 space-x-2 border border-[#B9BBBD] bg-white rounded-full">
                            {filters.map((filter) => (
                                <button
                                    key={filter}
                                    className={`px-6 py-2 rounded-full text-xl transition ${
                                        selectedFilter === filter
                                            ? "bg-[#009FDC] text-white"
                                            : "text-[#9B9DA2]"
                                    }`}
                                    onClick={() => handleFilterChange(filter)}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-center">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                        ID
                                    </th>
                                    <th className="py-3 px-4">User Name</th>
                                    <th className="py-3 px-4">Item Name</th>
                                    <th className="py-3 px-4">Description</th>
                                    <th className="py-3 px-4">Quantity</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#D7D8D9] text-base font-medium text-center text-[#2C323C]">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="text-start py-8"
                                        >
                                            <div className="w-10 h-10 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin mx-auto" />
                                        </td>
                                    </tr>
                                ) : (
                                    getFilteredItems().map((product) => (
                                            <tr key={product.id}>
                                                <td className="py-3 px-4">
                                                    {product.id}
                                                </td>
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
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${
                                                        product.status === "Approved"
                                                            ? "bg-green-100 text-green-800"
                                                            : product.status === "Rejected"
                                                            ? "bg-red-100 text-red-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                    }`}
                                                >
                                                    {product.status || "Pending"}
                                                </span>
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
                                                {product.status === "Pending" ? (
                                                    <>
                                                        <button
                                                            className="text-[#009FDC] hover:text-[#007CB8]"
                                                            title="Edit Status"
                                                            onClick={() => handleEditStatus(product)}
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faEdit}
                                                            />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAddItem(product)}
                                                            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#009FDC] text-white hover:bg-[#007CB8] transition-colors"
                                                        >
                                                            Add Item
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-6"></div>
                                                        <div className="w-20"></div>
                                                    </>
                                                )}
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

            {/* Status Update Modal */}
            {statusUpdateModal && selectedItemForStatus && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-8 rounded-2xl w-[90%] max-w-md">
                        <div className="flex justify-between border-b pb-2 mb-4">
                            <h2 className="text-2xl font-bold text-[#2C323C]">
                                Update Status
                            </h2>
                            <button
                                onClick={closeStatusModal}
                                className="text-red-500 hover:text-red-800"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={statusForm.status}
                                    disabled
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#009FDC] bg-gray-100"
                                    >
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rejection Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={statusForm.rejection_reason}
                                    onChange={(e) => setStatusForm(prev => ({ ...prev, rejection_reason: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#009FDC]"
                                    rows="3"
                                    placeholder="Enter rejection reason..."
                                    required
                                />
                                </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    onClick={closeStatusModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStatusUpdate}
                                    disabled={!statusForm.rejection_reason.trim()}
                                    className="px-4 py-2 bg-[#009FDC] text-white rounded-lg hover:bg-[#007CB8] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Reject Item
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CreateProduct;
