import React, { useState, useEffect } from "react";
import InputFloating from "../../../Components/InputFloating";
import SelectFloating from "../../../Components/SelectFloating";
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
    });

    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axios
            .get("/api/v1/product-categories")
            .then((response) => {
                setCategories(response.data.data);
            })
            .catch((error) =>
                console.error("Error fetching categories:", error)
            );

        axios
            .get("/api/v1/units")
            .then((response) => {
                setUnits(response.data.data);
            })
            .catch((error) => console.error("Error fetching units:", error));

        if (productId) {
            axios
                .get(`/api/v1/products/${productId}`)
                .then((response) => {
                    setFormData({
                        name: response.data.data.name,
                        category_id: response.data.data.category_id,
                        unit_id: response.data.data.unit_id,
                        upc: response.data.data.upc,
                        description: response.data.data.description,
                    });
                })
                .catch((error) =>
                    console.error("Error fetching product:", error)
                );
        }
    }, [productId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
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
            let response;
            if (productId) {
                response = await axios.put(
                    `/api/v1/products/${productId}`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                    }
                );
            } else {
                response = await axios.post("/api/v1/products", formData, {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                });
            }
            setFormData({
                name: "",
                category_id: "",
                unit_id: "",
                upc: "",
                description: "",
            });
            router.visit("/products");
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
                {productId ? "Edit Product" : "Make a New Product"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputFloating
                            label="Name"
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
                            label="UPC"
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
                        className="bg-[#009FDC] text-white px-6 py-3 rounded-lg hover:bg-[#007CB8] disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading
                            ? productId
                                ? "Updating..."
                                : "Creating..."
                            : productId
                            ? "Update Product"
                            : "Create Product"}
                    </button>
                </div>
            </form>
        </>
    );
};

export default CreateProduct;
