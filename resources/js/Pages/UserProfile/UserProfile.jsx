import React, { useState, useEffect } from "react";
import { FaCamera } from "react-icons/fa";
import SelectFloating from "../../Components/SelectFloating";
import InputFloating from "../../Components/InputFloating";
import axios from "axios";
import { router, usePage } from "@inertiajs/react";

const UserProfile = () => {
    const user = usePage().props.auth.user;

    const [formData, setFormData] = useState({
        employee_id: "",
        username: "",
        firstname: "",
        lastname: "",
        email: "",
        landline: "",
        mobile: "",
        photo: "",
        designation_id: "",
        department_id: "",
        language: "",
        employee_type: "",
        description: "",
        parent_id: "",
    });

    const [designations, setDesignations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [reportingManager, setReportingManager] = useState([]);
    const [errors, setErrors] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [
                    designationsResponse,
                    departmentsResponse,
                    managerResponse,
                ] = await Promise.all([
                    axios.get("/api/v1/designations"),
                    axios.get("/api/v1/departments"),
                    axios.get("/api/v1/users"),
                ]);
                setDesignations(designationsResponse.data.data);
                setDepartments(departmentsResponse.data.data);
                setReportingManager(managerResponse.data.data);

                if (user) {
                    setFormData({
                        employee_id: user.employee_id,
                        username: user.username,
                        firstname: user.firstname,
                        lastname: user.lastname,
                        email: user.email,
                        landline: user.landline,
                        mobile: user.mobile,
                        photo: user.profile_photo_path,
                        designation_id: user.designation_id,
                        department_id: user.department_id,
                        language: user.language,
                        employee_type: user.employee_type,
                        description: user.description,
                        parent_id: user.parent_id,
                    });

                    if (user.profile_photo_path) {
                        setPhotoPreview(`/storage/${user.profile_photo_path}`);
                    }

                    setIsEditing(true);
                }
            } catch (error) {
                console.error(
                    "Error:",
                    error.response ? error.response.data : error.message
                );
            }
        };

        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: "",
        }));
    };

    const validateForm = () => {
        let newErrors = {};

        if (!formData.employee_id)
            newErrors.employee_id = "Employee ID is required.";
        if (!formData.username) newErrors.username = "Username is required.";
        if (!formData.firstname)
            newErrors.firstname = "First name is required.";
        if (!formData.lastname) newErrors.lastname = "Last name is required.";
        if (!formData.email) newErrors.email = "Email is required.";
        if (!formData.mobile) newErrors.mobile = "Mobile number is required.";
        if (!formData.landline)
            newErrors.landline = "Landline (extension) is required.";
        if (!formData.designation_id)
            newErrors.designation_id = "Designation is required.";
        if (!formData.department_id)
            newErrors.department_id = "Department is required.";

        const employeeIdRegex = /^MAH-\d{6}$/;
        if (
            formData.employee_id &&
            !employeeIdRegex.test(formData.employee_id)
        ) {
            newErrors.employee_id =
                "Employee ID must start with 'MAH-' followed by 6 digits (e.g., MAH-123456).";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email =
                "Email must be in a valid format (e.g., example@domain.com).";
        }

        const mobileRegex = /^05\d{8}$/;
        if (formData.mobile && !mobileRegex.test(formData.mobile)) {
            newErrors.mobile =
                "Mobile number must start with '05' and be 10 digits long.";
        }

        const landlineRegex = /^011\d{7}$/;
        if (formData.landline && !landlineRegex.test(formData.landline)) {
            newErrors.landline =
                "Landline must start with '011' followed by 7 digits (e.g., 0111234567).";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.match("image.*")) {
                alert("Please select an image file");
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                alert("File size should be less than 2MB");
                return;
            }
            const previewUrl = URL.createObjectURL(file);
            setPhotoPreview(previewUrl);

            setPhoto(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const formDataToSend = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    formDataToSend.append(key, value);
                }
            });
            formDataToSend.append(
                "name",
                `${formData.firstname} ${formData.lastname}`
            );
            if (photo) {
                formDataToSend.append("profile_photo_path", photo);
            }
            if (formData.designation_id) {
                formDataToSend.append("role_id", formData.designation_id);
            }
            const formObject = {};
            formDataToSend.forEach((value, key) => {
                formObject[key] = value;
            });

            if (user) {
                const apiUrl = `/api/v1/users/${user.id}`;
                formDataToSend.append("_method", "PATCH");

                await axios.post(apiUrl, formDataToSend);
            } else {
                const apiUrl = "/api/v1/users";
                formDataToSend.append("_method", "POST");

                await axios.post(apiUrl, formDataToSend);
            }
            alert(
                isEditing
                    ? "User updated successfully!"
                    : "User added successfully!"
            );
            router.visit("/dashboard");
        } catch (error) {
            console.error("Server Response Error:", error.response.data);
        }
    };

    return (
        <div className="w-full">
            <h2 className="text-3xl font-bold text-[#2C323C]">User Profile</h2>
            <p className="text-xl text-[#7D8086]">
                Make changes in user profile
            </p>

            <form onSubmit={handleSubmit}>
                <div className="flex flex-col items-center mb-8">
                    <div className="relative">
                        <div className="w-36 h-36 border-2 border-green-500 rounded-full flex items-center justify-center bg-white overflow-hidden">
                            {photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt="User Profile Preview"
                                    className="w-full h-full object-contain"
                                />
                            ) : formData.photo ? (
                                <img
                                    src={`/storage/${formData.photo}`}
                                    alt="User Profile"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        e.target.src = "/images/MCTC Logo.png";
                                    }}
                                />
                            ) : (
                                <div className="text-gray-600 text-base">
                                    No Image
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            id="logoUpload"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <label
                            htmlFor="logoUpload"
                            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 bg-white w-8 h-8 flex items-center justify-center rounded-full shadow-md cursor-pointer hover:bg-gray-200 border border-gray-200"
                        >
                            <FaCamera className="text-gray-500" />
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <InputFloating
                            label="Maharat Employee ID"
                            name="employee_id"
                            value={formData.employee_id}
                            onChange={handleChange}
                        />
                        {errors.employee_id && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.employee_id}
                            </p>
                        )}
                    </div>
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
                    <div>
                        <InputFloating
                            label="First Name"
                            name="firstname"
                            value={formData.firstname}
                            onChange={handleChange}
                        />
                        {errors.firstname && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.firstname}
                            </p>
                        )}
                    </div>
                    <div>
                        <InputFloating
                            label="Last Name"
                            name="lastname"
                            value={formData.lastname}
                            onChange={handleChange}
                        />
                        {errors.lastname && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.lastname}
                            </p>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                    <div>
                        <InputFloating
                            label="Extension Number"
                            name="landline"
                            value={formData.landline}
                            onChange={handleChange}
                        />
                        {errors.username && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.username}
                            </p>
                        )}
                    </div>
                    <div>
                        <InputFloating
                            label="Mobile Number"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                        />
                        {errors.mobile && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.mobile}
                            </p>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <SelectFloating
                            label="Designation"
                            name="designation_id"
                            value={formData.designation_id}
                            onChange={handleChange}
                            options={designations.map((designation) => ({
                                id: designation.id,
                                label: designation.designation,
                            }))}
                        />
                        {errors.designation_id && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.designation_id}
                            </p>
                        )}
                    </div>
                    <div>
                        <SelectFloating
                            label="Department"
                            name="department_id"
                            value={formData.department_id}
                            onChange={handleChange}
                            options={departments.map((department) => ({
                                id: department.id,
                                label: department.name,
                            }))}
                        />
                        {errors.department_id && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.department_id}
                            </p>
                        )}
                    </div>
                    <div>
                        <SelectFloating
                            label="Reporting Manager"
                            name="parent_id"
                            value={formData.parent_id}
                            onChange={handleChange}
                            options={reportingManager.map((manager) => ({
                                id: manager.id,
                                label: manager.name,
                            }))}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <SelectFloating
                            label="Language"
                            name="language"
                            value={formData.language}
                            onChange={handleChange}
                            options={[
                                { id: "english", label: "English" },
                                { id: "arabic", label: "Arabic" },
                            ]}
                        />
                    </div>
                    <div>
                        <SelectFloating
                            label="Employee Type"
                            name="employee_type"
                            value={formData.employee_type}
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
                    <div className="relative w-full mb-2">
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

                <div className="flex justify-end">
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

export default UserProfile;
