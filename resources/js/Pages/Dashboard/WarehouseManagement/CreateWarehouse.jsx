import React, { useState, useEffect } from "react";
import InputFloating from "../../../Components/InputFloating";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";

const CreateWarehouse = () => {
    const { warehouseId } = usePage().props;
    const user_id = usePage().props.auth.user.id;

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        address: "",
        latitude: "",
        longitude: "",
        manager_id: user_id || "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (warehouseId) {
            axios
                .get(`/api/v1/warehouses/${warehouseId}`)
                .then((response) => {
                    setFormData({
                        name: response.data.data.name || "",
                        code: response.data.data.code || "",
                        address: response.data.data.address || "",
                        latitude: response.data.data.latitude || "",
                        longitude: response.data.data.longitude || "",
                        manager_id: response.data.data.manager_id || user_id,
                    });
                })
                .catch((error) =>
                    console.error("Error fetching warehouse details:", error)
                );
        }
    }, [warehouseId, user_id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.code.trim()) newErrors.code = "Code is required";
        if (!formData.address.trim()) newErrors.address = "Address is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            let response;
            if (warehouseId) {
                response = await axios.put(
                    `/api/v1/warehouses/${warehouseId}`,
                    formData
                );
            } else {
                response = await axios.post("/api/v1/warehouses", formData);
            }
            setFormData({
                name: "",
                code: "",
                address: "",
                latitude: "",
                longitude: "",
                manager_id: user_id,
            });
            router.visit("/warehouse-management");
        } catch (error) {
            setErrors(
                error.response?.data?.errors || {
                    general: "An error occurred while saving the warehouse",
                }
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h2 className="text-3xl font-bold text-[#2C323C]">
                {warehouseId ? "Edit Warehouse" : "Create New Warehouse"}
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
                        <InputFloating
                            label="Code"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                        />
                        {errors.code && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.code}
                            </p>
                        )}
                    </div>
                    <div>
                        <InputFloating
                            label="Address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                        />
                        {errors.address && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.address}
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
                            ? warehouseId
                                ? "Updating..."
                                : "Creating..."
                            : warehouseId
                            ? "Update Warehouse"
                            : "Create Warehouse"}
                    </button>
                </div>
            </form>
        </>
    );
};

export default CreateWarehouse;
