import React, { useState, useEffect } from "react";
import SelectFloating from "../../../Components/SelectFloating";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";

const CreateManager = () => {
    const { managerId } = usePage().props;

    const [formData, setFormData] = useState({
        warehouse_id: "",
        manager_id: "",
    });

    const [warehouses, setWarehouses] = useState([]);
    const [managers, setManagers] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axios
            .get("/api/v1/warehouses")
            .then((response) => {
                setWarehouses(response.data.data);
            })
            .catch((error) =>
                console.error("Error fetching warehouses:", error)
            );

        axios
            .get("/api/v1/users")
            .then((response) => {
                setManagers(response.data.data);
            })
            .catch((error) => console.error("Error fetching managers:", error));

        if (managerId) {
            axios
                .get(`/api/v1/warehouse-managers/${managerId}`)
                .then((response) => {
                    setFormData({
                        warehouse_id: response.data.data.warehouse_id || "",
                        manager_id: response.data.data.manager_id || "",
                    });
                })
                .catch((error) =>
                    console.error("Error fetching manager details:", error)
                );
        }
    }, [managerId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.warehouse_id)
            newErrors.warehouse_id = "Warehouse is required";
        if (!formData.manager_id) newErrors.manager_id = "Manager is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            if (managerId) {
                await axios.put(`/api/v1/warehouse-managers/${managerId}`, formData);
            } else {
                await axios.post("/api/v1/warehouse-managers", formData);
            }
            router.visit("/manager");
        } catch (error) {
            setErrors(
                error.response?.data?.errors || {
                    general: "An error occurred while saving the manager",
                }
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h2 className="text-3xl font-bold text-[#2C323C]">
                {managerId ? "Edit Manager" : "Assign Manager"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <SelectFloating
                            label="Warehouse"
                            name="warehouse_id"
                            value={formData.warehouse_id}
                            onChange={handleChange}
                            options={warehouses.map((warehouse) => ({
                                id: warehouse.id,
                                label: warehouse.name,
                            }))}
                        />
                        {errors.warehouse_id && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.warehouse_id}
                            </p>
                        )}
                    </div>
                    <div>
                        <SelectFloating
                            label="Manager"
                            name="manager_id"
                            value={formData.manager_id}
                            onChange={handleChange}
                            options={managers.map((manager) => ({
                                id: manager.id,
                                label: manager.name,
                            }))}
                        />
                        {errors.manager_id && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.manager_id}
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
                            ? managerId
                                ? "Updating..."
                                : "Assigning..."
                            : managerId
                            ? "Update Manager"
                            : "Assign Manager"}
                    </button>
                </div>
            </form>
        </>
    );
};

export default CreateManager;
