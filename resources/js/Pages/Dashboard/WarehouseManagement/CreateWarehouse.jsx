import React, { useState, useEffect } from "react";
import InputFloating from "../../../Components/InputFloating";
import SelectFloating from "../../../Components/SelectFloating";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";

const CreateWarehouse = () => {
    const { warehouseId } = usePage().props;

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        address: "",
        latitude: "",
        longitude: "",
        manager_id: "",
        assistant_id: "",
    });

    const [managers, setManagers] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Fetch Managers
    useEffect(() => {
        axios
            .get("/api/v1/users")
            .then((response) => {
                setManagers(response.data.data);
            })
            .catch((error) => console.error("Error fetching managers:", error));
    }, []);

    // Fetch warehouse details if editing
    useEffect(() => {
        if (warehouseId) {
            axios
                .get(`/api/v1/warehouses/${warehouseId}`)
                .then((response) => {
                    const data = response.data.data;
                    setFormData({
                        name: data.name || "",
                        code: data.code || "",
                        address: data.address || "",
                        latitude: data.latitude || "",
                        longitude: data.longitude || "",
                        manager_id: data.manager_id || "",
                        assistant_id: data.assistant_id || "",
                    });
                })
                .catch((error) =>
                    console.error("Error fetching warehouse details:", error)
                );
        }
    }, [warehouseId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.code.trim()) newErrors.code = "Code is required";
        if (!formData.address.trim()) newErrors.address = "Address is required";
        if (!formData.manager_id) newErrors.manager_id = "Manager is required";
        if (!formData.assistant_id)
            newErrors.assistant_id = "Assistant is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            let warehouseResponse;
            if (warehouseId) {
                warehouseResponse = await axios.put(
                    `/api/v1/warehouses/${warehouseId}`,
                    {
                        name: formData.name,
                        code: formData.code,
                        address: formData.address,
                        latitude: formData.latitude,
                        longitude: formData.longitude,
                    }
                );
            } else {
                warehouseResponse = await axios.post("/api/v1/warehouses", {
                    name: formData.name,
                    code: formData.code,
                    address: formData.address,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                });
            }

            const warehouseIdCreated =
                warehouseId || warehouseResponse.data.data.id;

            await axios.post("/api/v1/warehouse-managers", {
                warehouse_id: warehouseIdCreated,
                manager_id: formData.manager_id,
                type: "Manager",
            });

            await axios.post("/api/v1/warehouse-managers", {
                warehouse_id: warehouseIdCreated,
                manager_id: formData.assistant_id,
                type: "Assistant",
            });

            setFormData({
                name: "",
                code: "",
                address: "",
                latitude: "",
                longitude: "",
                manager_id: "",
                assistant_id: "",
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
                            label="Warehouse Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <div>
                        <InputFloating
                            label="Warehouse Code"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        {errors.code && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.code}
                            </p>
                        )}
                    </div>
                    <div>
                        <InputFloating
                            label="Warehouse Address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        {errors.address && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.address}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputFloating
                            label="Latitude"
                            name="latitude"
                            value={formData.latitude}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        <InputFloating
                            label="Longitude"
                            name="longitude"
                            value={formData.longitude}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <SelectFloating
                            label="Warehouse Manager"
                            name="manager_id"
                            value={formData.manager_id}
                            onChange={handleChange}
                            options={managers.map((manager) => ({
                                id: manager.id,
                                label: manager.name,
                            }))}
                            disabled={loading}
                        />
                        {errors.manager_id && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.manager_id}
                            </p>
                        )}
                    </div>
                    <div>
                        <SelectFloating
                            label="Warehouse Assistant"
                            name="assistant_id"
                            value={formData.assistant_id}
                            onChange={handleChange}
                            options={managers.map((manager) => ({
                                id: manager.id,
                                label: manager.name,
                            }))}
                            disabled={loading}
                        />
                        {errors.assistant_id && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.assistant_id}
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
