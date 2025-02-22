import React, { useState, useEffect } from "react";
import InputFloating from "../../../Components/InputFloating";
import { router } from "@inertiajs/react";
import axios from "axios";

const CreateCategory = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get("id");

    const [formData, setFormData] = useState({
        name: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (categoryId) {
            axios
                .get(`/api/v1/product-categories/${categoryId}`)
                .then((response) => {
                    setFormData({
                        name: response.data.data.name,
                    });
                })
                .catch((error) => {
                    console.error("Error fetching category:", error);
                });
        }
    }, [categoryId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            let response;
            if (categoryId) {
                response = await axios.put(
                    `/api/v1/product-categories/${categoryId}`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                    }
                );
            } else {
                response = await axios.post(
                    "/api/v1/product-categories",
                    formData,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                    }
                );
            }
            setFormData({ name: "" });
            router.visit("/category");
        } catch (error) {
            setErrors(
                error.response?.data?.errors || {
                    general: "An error occurred while saving the category",
                }
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h2 className="text-3xl font-bold text-[#2C323C]">
                {categoryId ? "Edit Category" : "Make a New Category"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                <h3 className="text-2xl font-medium text-[#6E66AC]">
                    {categoryId
                        ? "Edit Existing Category"
                        : "Requested New Category"}
                </h3>
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
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-[#009FDC] text-white px-6 py-3 rounded-lg hover:bg-[#007CB8] disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading
                            ? categoryId
                                ? "Updating..."
                                : "Creating..."
                            : categoryId
                            ? "Update Category"
                            : "Create Category"}
                    </button>
                </div>
            </form>
        </>
    );
};

export default CreateCategory;
