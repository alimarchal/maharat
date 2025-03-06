import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink } from "@fortawesome/free-solid-svg-icons";
import SelectFloating from "../../../../Components/SelectFloating";
import InputFloating from "../../../../Components/InputFloating";

const ApproveBudgetForm = () => {
    const [formData, setFormData] = useState({
        year: "",
        department: "",
        costCenter: "",
        previousBudget: "",
        requestedAmount: "",
        urgency: "",
        attachment: null,
        description: "",
        name: "",
        action: "",
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: "" });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, attachment: e.target.files[0] });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.department)
            newErrors.department = "Department is required";
        if (!formData.costCenter)
            newErrors.costCenter = "Cost Center is required";
        if (!formData.previousBudget)
            newErrors.previousBudget = "Previous Budget is required";
        if (!formData.requestedAmount)
            newErrors.requestedAmount = "Requested Amount is required";
        if (!formData.urgency) newErrors.urgency = "Urgency is required";
        if (!formData.description)
            newErrors.description = "Description is required";
        if (!formData.name) newErrors.name = "Name of Head is required";
        if (!formData.action) newErrors.action = "Action is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            console.log("Form submitted successfully", formData);
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        Approve Budget Request
                    </h2>
                    <p className="text-[#7D8086] text-lg">
                        Request by department head for the budget to approval
                    </p>
                </div>
                <div className="w-1/2">
                    <SelectFloating
                        label="Year"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        options={[
                            { id: 1, label: "2023" },
                            { id: 2, label: "2024" },
                            { id: 3, label: "2025" },
                        ]}
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 w-full my-6">
                <p className="text-[#6E66AC] text-lg md:text-2xl">
                    Request Details
                </p>
                <div
                    className="h-[3px] flex-grow"
                    style={{
                        background:
                            "linear-gradient(to right, #9B9DA200, #9B9DA2)",
                    }}
                ></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <SelectFloating
                            label="Department Name"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            options={[
                                { id: 1, label: "Finance" },
                                { id: 2, label: "HR" },
                            ]}
                        />
                        {errors.department && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.department}
                            </p>
                        )}
                    </div>
                    <div>
                        <SelectFloating
                            label="Cost Center"
                            name="costCenter"
                            value={formData.costCenter}
                            onChange={handleChange}
                            options={[
                                { id: 1, label: "Operations" },
                                { id: 2, label: "Marketing" },
                            ]}
                        />
                        {errors.costCenter && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.costCenter}
                            </p>
                        )}
                    </div>
                    <div>
                        <SelectFloating
                            label="Previous Budget Amount"
                            name="previousBudget"
                            value={formData.previousBudget}
                            onChange={handleChange}
                            options={[
                                { id: 1, label: "$10,000" },
                                { id: 2, label: "$20,000" },
                            ]}
                        />
                        {errors.previousBudget && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.previousBudget}
                            </p>
                        )}
                    </div>
                    <div>
                        <SelectFloating
                            label="Requested Amount"
                            name="requestedAmount"
                            value={formData.requestedAmount}
                            onChange={handleChange}
                            options={[
                                { id: 1, label: "$15,000" },
                                { id: 2, label: "$25,000" },
                            ]}
                        />
                        {errors.requestedAmount && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.requestedAmount}
                            </p>
                        )}
                    </div>
                    <div>
                        <SelectFloating
                            label="Urgency"
                            name="urgency"
                            value={formData.urgency}
                            onChange={handleChange}
                            options={[
                                { id: 1, label: "High" },
                                { id: 2, label: "Medium" },
                            ]}
                        />
                        {errors.urgency && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.urgency}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="border p-5 rounded-2xl bg-white w-full flex items-center justify-center cursor-pointer relative">
                            <FontAwesomeIcon
                                icon={faLink}
                                className="text-[#009FDC] mr-2"
                            />
                            {formData.attachment ? (
                                <span className="text-gray-700 text-sm overflow-hidden text-ellipsis max-w-[80%]">
                                    {formData.attachment.name}
                                </span>
                            ) : (
                                <span className="text-sm">Attachment</span>
                            )}
                            <input
                                type="file"
                                name="attachment"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>
                <div className="w-full">
                    <div className="relative w-full">
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="peer border border-gray-300 p-5 rounded-2xl w-full h-24 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                        ></textarea>
                        <label
                            className={`absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                                    ${
                                        formData.description
                                            ? "-top-2 left-2 text-base text-[#009FDC] px-1"
                                            : "top-4 text-base text-gray-400"
                                    }
                                    peer-focus:-top-2 peer-focus:left-2 peer-focus:text-base peer-focus:text-[#009FDC] peer-focus:px-1`}
                        >
                            Reasons for increase
                        </label>
                    </div>
                    {errors.description && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.description}
                        </p>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputFloating
                            label="Name of the Department Head"
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
                            label="Action"
                            name="action"
                            value={formData.action}
                            onChange={handleChange}
                            options={[
                                { id: "approve", label: "Approve" },
                                { id: "reject", label: "Reject" },
                            ]}
                        />
                        {errors.action && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.action}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-[#009FDC] text-white text-lg font-medium px-6 py-3 rounded-full hover:bg-[#007CB8]"
                    >
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ApproveBudgetForm;
