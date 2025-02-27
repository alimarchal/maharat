import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import InputFloating from "../../../Components/InputFloating";
import SelectFloating from "../../../Components/SelectFloating";
import axios from "axios";

const ProcessFlowModal = ({ isOpen, onClose, processId }) => {
    const [formData, setFormData] = useState({
        process_id: processId,
        user_id: "",
        order: "",
        name: "",
        description: "",
        status: "",
        is_active: true,
        timeout_days: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const statusOptions = [
        { id: "Pending", label: "Pending" },
        { id: "In Progress", label: "In Progress" },
        { id: "Approved", label: "Approved" },
        { id: "Rejected", label: "Rejected" },
        { id: "Skipped", label: "Skipped" },
    ];

    const validate = () => {
        let newErrors = {};
        if (!formData.order) newErrors.order = "Order is required";
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.description.trim())
            newErrors.description = "Description is required";
        if (!formData.status.trim()) newErrors.status = "Status is required";
        if (!formData.timeout_days)
            newErrors.timeout_days = "Timeout days is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            await axios.post("/api/v1/process-flow", formData);
            onClose();
        } catch (error) {
            console.error("Error creating process flow:", error);
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg">
                <div className="flex justify-between items-center border-b pb-3">
                    <h2 className="text-2xl font-bold">Process Flow Details</h2>
                    <button onClick={onClose}>
                        <FontAwesomeIcon
                            icon={faTimes}
                            className="text-gray-500 hover:text-gray-700"
                        />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <InputFloating
                        label="Order"
                        name="order"
                        value={formData.order}
                        onChange={handleChange}
                    />
                    {errors.order && (
                        <p className="text-red-500 text-sm">{errors.order}</p>
                    )}
                    <InputFloating
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                    />
                    {errors.name && (
                        <p className="text-red-500 text-sm">{errors.name}</p>
                    )}
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
                    <SelectFloating
                        label="Status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        options={statusOptions}
                    />
                    <InputFloating
                        label="Timeout (Days)"
                        name="timeout_days"
                        type="number"
                        value={formData.timeout_days}
                        onChange={handleChange}
                    />
                    {errors.timeout_days && (
                        <p className="text-red-500 text-sm">
                            {errors.timeout_days}
                        </p>
                    )}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProcessFlowModal;
