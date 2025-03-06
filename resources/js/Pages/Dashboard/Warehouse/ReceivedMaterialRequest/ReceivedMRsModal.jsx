import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";

const ReceivedMRsModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        requestNumber: "",
        items: "",
        costCenter: "",
        subCostCenter: "",
        department: "",
        priority: "",
        status: "",
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                        Add Material Request
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputFloating
                            label="Request Number"
                            name="requestNumber"
                            value={formData.requestNumber}
                            onChange={handleChange}
                        />
                        <InputFloating
                            label="Items"
                            name="items"
                            value={formData.items}
                            onChange={handleChange}
                        />
                        <InputFloating
                            label="Cost Center"
                            name="costCenter"
                            value={formData.costCenter}
                            onChange={handleChange}
                        />
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
                        <SelectFloating
                            label="Priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            options={[
                                { id: "high", label: "High" },
                                { id: "medium", label: "Medium" },
                                { id: "low", label: "Low" },
                            ]}
                        />
                    </div>
                    <div>
                        <SelectFloating
                            label="Status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            options={[
                                { id: "pending", label: "Pending" },
                                { id: "approved", label: "Approved" },
                                { id: "rejected", label: "Rejected" },
                            ]}
                        />
                    </div>
                    <div className="my-4 flex justify-center w-full">
                        <button
                            type="submit"
                            className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReceivedMRsModal;
