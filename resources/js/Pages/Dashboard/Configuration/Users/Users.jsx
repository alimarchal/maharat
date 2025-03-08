import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCsv, faCamera } from "@fortawesome/free-solid-svg-icons";
import SelectFloating from "../../../../Components/SelectFloating";
import InputFloating from "../../../../Components/InputFloating";
import axios from "axios";

const Users = () => {
    const [formData, setFormData] = useState({
        id: "",
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        extensionNumber: "",
        mobileNumber: "",
        photo: "",
        department: "",
        language: "",
        employeeType: "",
        description: "",
        enableOtp: false,
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.username) newErrors.username = "Username is required.";
        if (!formData.email) newErrors.email = "Email is required.";
        if (!formData.mobileNumber)
            newErrors.mobileNumber = "Mobile number is required.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, photo: file.name });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await axios.post("/api/v1/users", formData);
            alert("User added successfully!");
            setFormData({
                id: "",
                username: "",
                firstName: "",
                lastName: "",
                email: "",
                extensionNumber: "",
                mobileNumber: "",
                department: "",
                language: "",
                employeeType: "",
                description: "",
                enableOtp: false,
            });
            setErrors({});
        } catch (error) {
            console.error("Error saving user", error);
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#2C323C]">
                    User Management
                </h1>
                <div className="flex space-x-4">
                    <button className="border border-[#009FDC] text-[#009FDC] bg-white px-4 py-2 rounded-full text-base font-medium">
                        <FontAwesomeIcon icon={faFileCsv} />
                        <span> Download CSV Template </span>
                    </button>
                    <button className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-base font-medium">
                        <FontAwesomeIcon icon={faFileCsv} />
                        <span> Upload CSV File </span>
                    </button>
                </div>
            </div>

            <p className="text-[#7D8086] text-xl mb-6">
                Manage users and their account permissions here.
            </p>

            <div className="flex items-center w-full gap-4 mb-6">
                <h2 className="text-2xl font-medium text-[#6E66AC] whitespace-nowrap">
                    Add a User
                </h2>
                <div
                    className="h-[3px] flex-grow"
                    style={{
                        background:
                            "linear-gradient(to right, #9B9DA200, #9B9DA2)",
                    }}
                ></div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <InputFloating
                        label="ID"
                        name="id"
                        value={formData.id}
                        onChange={handleChange}
                    />
                    <div>
                        <label className="border p-5 rounded-2xl bg-white w-full flex items-center justify-center cursor-pointer relative">
                            <FontAwesomeIcon
                                icon={faCamera}
                                className="text-gray-500 mr-2"
                            />
                            {formData.photo ? (
                                <span className="text-gray-700 text-sm sm:text-base overflow-hidden text-ellipsis max-w-[80%]">
                                    {formData.photo}
                                </span>
                            ) : (
                                <span className="text-sm sm:text-base">
                                    Add a Profile Picture
                                </span>
                            )}
                            <input
                                type="file"
                                name="photo"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <InputFloating
                            label="Username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                        />
                        {errors.username && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.username}
                            </p>
                        )}
                    </div>
                    <InputFloating
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                    />
                    <InputFloating
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <InputFloating
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.email}
                            </p>
                        )}
                    </div>
                    <InputFloating
                        label="Extension Number"
                        name="extensionNumber"
                        value={formData.extensionNumber}
                        onChange={handleChange}
                    />
                    <div>
                        <InputFloating
                            label="Mobile Number"
                            name="mobileNumber"
                            value={formData.mobileNumber}
                            onChange={handleChange}
                        />
                        {errors.mobileNumber && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.mobileNumber}
                            </p>
                        )}
                    </div>
                    <div>
                        <SelectFloating
                            label="Department"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            options={[
                                { id: "hr", label: "HR" },
                                { id: "finance", label: "Finance" },
                                { id: "it", label: "IT" },
                                { id: "marketing", label: "Marketing" },
                                { id: "sales", label: "Sales" },
                            ]}
                        />
                    </div>
                    <InputFloating
                        label="Language"
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                    />
                    <div>
                        <SelectFloating
                            label="Employee Type"
                            name="employeeType"
                            value={formData.employeeType}
                            onChange={handleChange}
                            options={[
                                { id: "full-time", label: "Full-Time" },
                                { id: "part-time", label: "Part-Time" },
                                { id: "contract", label: "Contract" },
                                { id: "intern", label: "Intern" },
                            ]}
                        />
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
                            Description
                        </label>
                    </div>
                </div>

                <div className="flex items-center my-4">
                    <input
                        type="checkbox"
                        name="enableOtp"
                        checked={formData.enableOtp}
                        onChange={handleChange}
                        className="h-6 w-6 text-[#009FDC] focus:ring-[#009FDC] border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-lg text-gray-900">
                        Enable OTP
                    </label>
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="submit"
                        className="bg-[#009FDC] text-white px-6 py-2 rounded-full text-xl font-medium"
                    >
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Users;
