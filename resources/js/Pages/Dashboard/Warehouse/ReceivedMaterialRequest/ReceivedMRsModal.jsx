import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";

const ReceivedMRsModal = ({ isOpen, onClose, onSave, requestData }) => {
    const [formData, setFormData] = useState({
        requestNumber: "",
        items: "",
        costCenter: "",
        subCostCenter: "",
        department: "",
        priority: "",
        status: "",
        description: "",
    });

    useEffect(() => {
        if (requestData) {
            setFormData({
                requestNumber: requestData.id || "",
                items:
                    requestData.items
                        ?.map((item) => item.product?.name)
                        .join(", ") || "",
                costCenter: requestData.cost_center || "",
                subCostCenter: requestData.sub_cost_center || "",
                department: requestData.department || "",
                priority: requestData.items?.[0]?.urgency_status?.name || "",
                status: "",
                description: requestData.description || "",
            });
        }
    }, [requestData]);

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        let newErrors = {};
        if (!formData.requestNumber)
            newErrors.requestNumber = "Request Number is required";
        if (!formData.items) newErrors.items = "Items field is required";
        if (!formData.costCenter)
            newErrors.costCenter = "Cost Center is required";
        if (!formData.status) newErrors.status = "Status is required";
        if (formData.status === "pending" && !formData.description)
            newErrors.description =
                "Description is required when status is pending";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            onSave(formData);
            onClose();
        } catch (error) {
            setErrors(error.response?.data.errors || {});
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
                                name="requestNumber"
                                value={formData.requestNumber}
                                onChange={handleChange}
                                disabled
                            />
                            {errors.requestNumber && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.requestNumber}
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
                            <InputFloating
                                label="Cost Center"
                                name="costCenter"
                                value={formData.costCenter}
                                onChange={handleChange}
                            />
                            {errors.costCenter && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.costCenter}
                                </p>
                            )}
                        </div>
                        <InputFloating
                            label="Sub Cost Center"
                            name="subCostCenter"
                            value={formData.subCostCenter}
                            onChange={handleChange}
                        />
                        <InputFloating
                            label="Department"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                        />
                        <InputFloating
                            label="Priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            disabled
                        />
                    </div>
                    <div
                        className={`grid ${
                            formData.status === "pending"
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
                                    { id: "pending", label: "Pending" },
                                    { id: "issued", label: "Issue Material" },
                                ]}
                            />
                            {errors.status && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.status}
                                </p>
                            )}
                        </div>
                        {formData.status === "pending" && (
                            <div>
                                <InputFloating
                                    label="Description"
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
};

export default ReceivedMRsModal;
