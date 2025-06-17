import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";

function ReceivedMRsModal({ isOpen, onClose, onSave, requestData }) {
    const [formData, setFormData] = useState({
        material_request_id: "",
        items: "",
        cost_center_id: "",
        sub_cost_center_id: "",
        department_id: "",
        priority: "",
        status: "",
        description: "",
        rejection_reason: "",
    });

    const [costCenters, setCostCenters] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        axios
            .get("/api/v1/cost-centers")
            .then((res) => setCostCenters(res.data.data))
            .catch((err) => console.error("Error fetching cost centers:", err));

        axios
            .get("/api/v1/departments")
            .then((res) => setDepartments(res.data.data))
            .catch((err) => console.error("Error fetching departments:", err));
    }, []);

    useEffect(() => {
        if (isOpen && requestData) {
            setFormData({
                material_request_id: requestData.id || "",
                items:
                    requestData.items
                        ?.map((item) => item.product?.name)
                        .join(", ") || "",
                cost_center_id: requestData.cost_center_id || "",
                sub_cost_center_id: requestData.sub_cost_center_id || "",
                department_id: requestData.department_id || "",
                priority: "",
                status: "",
                description: "",
                rejection_reason: "",
            });
            setErrors({});
        }
    }, [isOpen, requestData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.material_request_id)
            newErrors.material_request_id = "Request Number is required";
        if (!formData.items) newErrors.items = "Items field is required";
        if (!formData.cost_center_id)
            newErrors.cost_center_id = "Cost Center is required";
        if (!formData.priority) newErrors.priority = "Priority is required";
        if (!formData.status) newErrors.status = "Status is required";
        if ((formData.status === "Pending" || formData.status === "Rejected") && !formData.description)
            newErrors.description = "Description is required when status is Pending or Rejected";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            if (formData.status === "Rejected") {
                await axios.put(`/api/v1/material-requests/${formData.material_request_id}`, {
                    status: "Rejected",
                    rejection_reason: formData.description
                });
            }

            onSave(formData);
            onClose();
        } catch (error) {
            setErrors(error.response?.data?.errors || {});
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] lg:w-1/2">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        Issue Material to {requestData?.requester?.name}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <InputFloating
                                label="Request Number"
                                name="material_request_id"
                                value={formData.material_request_id}
                                onChange={handleChange}
                                disabled
                            />
                            {errors.material_request_id && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.material_request_id}
                                </p>
                            )}
                        </div>
                        <div>
                            <InputFloating
                                label="Items"
                                name="items"
                                value={formData.items}
                                onChange={handleChange}
                                disabled
                            />
                            {errors.items && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.items}
                                </p>
                            )}
                        </div>
                        <div>
                            <SelectFloating
                                label="Cost Center"
                                name="cost_center_id"
                                value={formData.cost_center_id}
                                onChange={handleChange}
                                options={costCenters.map((c) => ({
                                    id: c.id,
                                    label: c.name,
                                }))}
                            />
                            {errors.cost_center_id && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.cost_center_id}
                                </p>
                            )}
                        </div>
                        <div>
                            <SelectFloating
                                label="Sub Cost Center"
                                name="sub_cost_center_id"
                                value={formData.sub_cost_center_id}
                                onChange={handleChange}
                                options={costCenters.map((c) => ({
                                    id: c.id,
                                    label: c.name,
                                }))}
                            />
                        </div>
                        <div>
                            <SelectFloating
                                label="Department"
                                name="department_id"
                                value={formData.department_id}
                                onChange={handleChange}
                                options={departments.map((dep) => ({
                                    id: dep.id,
                                    label: dep.name,
                                }))}
                            />
                        </div>
                        <div>
                            <SelectFloating
                                label="Priority"
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                options={[
                                    { id: "High", label: "High" },
                                    { id: "Medium", label: "Medium" },
                                    { id: "Low", label: "Low" },
                                ]}
                            />
                            {errors.priority && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.priority}
                                </p>
                            )}
                        </div>
                    </div>
                    <div
                        className={`grid ${
                            formData.status === "Pending" || formData.status === "Rejected"
                                ? "grid-cols-1 md:grid-cols-2"
                                : "grid-cols-1"
                        } gap-6`}
                    >
                        <div>
                            <SelectFloating
                                label="Status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                options={[
                                    { id: "Pending", label: "Pending" },
                                    { id: "Rejected", label: "Rejected" },
                                    { id: "Issue Material", label: "Issue Material" },
                                ]}
                            />
                            {errors.status && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.status}
                                </p>
                            )}
                        </div>
                        {(formData.status === "Pending" || formData.status === "Rejected") && (
                            <div>
                                <InputFloating
                                    label={formData.status === "Rejected" ? "Rejection Reason" : "Description"}
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                                {errors.description && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.description}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="my-4 flex justify-center w-full">
                        <button
                            type="submit"
                            className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ReceivedMRsModal;
