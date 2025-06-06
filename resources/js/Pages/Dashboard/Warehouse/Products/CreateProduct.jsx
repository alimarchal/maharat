import React, { useState, useEffect } from "react";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";

const CreateProduct = () => {
    const { productId } = usePage().props;

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
    const [requestItems, setRequestItems] = useState([]);

    const fetchRequestItems = async () => {
        try {
            const response = await axios.get("/api/v1/request-item");
            setRequestItems(response.data.data || {});
        } catch (err) {
            console.error("Error fetching items:", err);
            setRequestItems({});
        }
    };

    useEffect(() => {
        fetchRequestItems();
    }, []);

    const pendingCount = Array.isArray(requestItems?.data)
        ? requestItems.data.filter((item) => {
              return item.is_added === false;
          }).length
        : 0;

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

            if (productId) {
                await axios.put(`/api/v1/products/${productId}`, payload);
            } else {
                await axios.post("/api/v1/products", payload);
            }
            if (
                formData.request_item &&
                Array.isArray(requestItems.data) &&
                requestItems.data.some(
                    (item) => item.id == formData.request_item
                )
            ) {
                try {
                    await axios.put(
                        `/api/v1/request-item/${formData.request_item}`,
                        {
                            is_added: true,
                        }
                    );
                    await fetchRequestItems();
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
                        showRequestItemField
                            ? "grid-cols-1 md:grid-cols-3"
                            : "grid-cols-1 md:grid-cols-2"
                    }`}
                >
                    {showRequestItemField && (
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

            {pendingCount > 0 && (
                <div className="my-10">
                    <h2 className="text-3xl font-bold text-[#2C323C] mb-4">
                        Pending Requested Items
                    </h2>
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
                                    <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                                        Quantity
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
                                    requestItems.data
                                        .filter((product) => !product.is_added)
                                        .map((product) => (
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
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
};

export default CreateProduct;
