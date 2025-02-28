import React, { useState, useEffect } from "react";
import SelectFloating from "../../../Components/SelectFloating";
import axios from "axios";

const ReviewTask = () => {
    const [formData, setFormData] = useState({
        description: "",
        action: "",
        employee: "",
    });
    const [employees, setEmployees] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get("/api/v1/users");
                setEmployees(response.data.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        let newErrors = {};
        if (!formData.description)
            newErrors.description = "Description is required";
        if (!formData.action) newErrors.action = "Action is required";
        if (formData.action === "refer" && !formData.employee)
            newErrors.employee = "Employee is required";

        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            try {
                const response = await axios.post(
                    "/api/v1/review-task",
                    formData
                );
                console.log("Task submitted successfully:", response.data);
            } catch (error) {
                console.error("Error submitting task:", error);
            }
        }
    };

    return (
        <div className="flex flex-col items-center w-full">
            <div className="w-full">
                <div className="flex flex-col items-center">
                    <img
                        src="/images/review-task.png"
                        alt="Document Preview"
                        className="w-full lg:max-w-xl border rounded-2xl shadow"
                    />
                </div>

                <div className="my-6 grid grid-cols-1 lg:grid-cols-2 items-start gap-4 w-full">
                    <div className="relative w-full">
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="peer border border-gray-300 p-5 rounded-2xl w-full h-36 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
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
                        {errors.description && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 w-full">
                        <div className="w-full">
                            <SelectFloating
                                label="Action"
                                name="action"
                                value={formData.action}
                                onChange={handleChange}
                                options={[
                                    { id: "approve", label: "Approve" },
                                    { id: "reject", label: "Reject" },
                                    { id: "refer", label: "Refer" },
                                ]}
                            />
                            {errors.action && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.action}
                                </p>
                            )}
                        </div>
                        {formData.action === "refer" && (
                            <div className="w-full">
                                <SelectFloating
                                    label="Employee"
                                    name="employee"
                                    value={formData.employee}
                                    onChange={handleChange}
                                    options={employees.map((emp) => ({
                                        id: emp.id,
                                        label: emp.name,
                                    }))}
                                />
                                {errors.employee && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.employee}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="my-6 flex justify-center md:justify-end w-full">
                    <button
                        onClick={handleSubmit}
                        className="px-8 py-3 text-lg font-medium bg-[#009FDC] text-white rounded-full hover:bg-blue-500 w-full md:w-auto"
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewTask;
