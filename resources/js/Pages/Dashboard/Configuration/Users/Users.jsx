import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCsv, faCamera } from "@fortawesome/free-solid-svg-icons";
import SelectFloating from "../../../../Components/SelectFloating";
import InputFloating from "../../../../Components/InputFloating";
import axios from "axios";
import { router, usePage } from '@inertiajs/react';

const Users = () => {
    const { props } = usePage();
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id'); // Get the ID from the URL
    console.log("🔍 User ID from URL:", id);
    const hierarchy_level = urlParams.get('hierarchy_level') ? parseInt(urlParams.get('hierarchy_level')) : undefined;
    const parent_id = urlParams.get('parent_id') ? parseInt(urlParams.get('parent_id')) : null;

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
        parent_id: parent_id ?? null,
        hierarchy_level: hierarchy_level !== undefined ? hierarchy_level : 0,
    });

    const [designations, setDesignations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [reportingManager, setReportingManager] = useState("");
    const [errors, setErrors] = useState({});
    const [isEditing, setIsEditing] = useState(false); // Track if we're editing an existing user
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    // Fetch designations, departments, and reporting manager on component mount
    // Replace the existing useEffect in Users.jsx with this fixed version
useEffect(() => {
    const fetchData = async () => {
        try {
            const [designationsResponse, departmentsResponse] = await Promise.all([
                axios.get('/api/v1/designations'),
                axios.get('/api/v1/departments'),
            ]);

            setDesignations(designationsResponse.data.data);
            setDepartments(departmentsResponse.data.data);

            let userData = null;
            
            // If we're editing an existing user
            if (id) {
                const userResponse = await axios.get(`/api/v1/users/${id}`);
                userData = userResponse.data.data;

                console.log("Fetched User Data:", userData); // Debug log

                setFormData({
                    employee_id: userData.employee_id,
                    username: userData.username,
                    firstname: userData.firstname,
                    lastname: userData.lastname,
                    email: userData.email,
                    landline: userData.landline,
                    mobile: userData.mobile,
                    photo: userData.photo,
                    designation_id: userData.designation_id,
                    department_id: userData.department_id,
                    language: userData.language,
                    employee_type: userData.employee_type,
                    description: userData.description,
                    parent_id: userData.parent_id,
                    hierarchy_level: userData.hierarchy_level,
                });

                setIsEditing(true);
                
                // If user has a parent_id, fetch the reporting manager's info
                if (userData?.parent_id) {
                    const reportingManagerResponse = await axios.get(`/api/v1/users/${userData.parent_id}`);
                    console.log("Reporting Manager Response:", reportingManagerResponse.data); // Debug log
                    setReportingManager(reportingManagerResponse.data.data.name);
                }
            } 
            // If we're creating a new user with specified hierarchy and parent
            else if (hierarchy_level !== undefined || parent_id !== null) {
                // Set the initial form data based on URL parameters
                setFormData(prevData => ({
                    ...prevData,
                    parent_id: parent_id,
                    hierarchy_level: hierarchy_level
                }));
                
                // If parent_id is provided, fetch the reporting manager's name
                if (parent_id) {
                    const reportingManagerResponse = await axios.get(`/api/v1/users/${parent_id}`);
                    console.log("Reporting Manager Response:", reportingManagerResponse.data);
                    setReportingManager(reportingManagerResponse.data.data.name);
                } 
                // If hierarchy_level is 1 and no parent_id, fetch the top-level manager (hierarchy_level = 0)
                else if (hierarchy_level === 1) {
                    console.log("Fetching top-level manager for hierarchy level 1");
                    const topLevelManagerResponse = await axios.get('/api/v1/users', {
                        params: {
                            hierarchy_level: 0
                        }
                    });
                    
                    console.log("Top-Level Manager Response:", topLevelManagerResponse.data);
                    
                    if (Array.isArray(topLevelManagerResponse.data.data) && 
                        topLevelManagerResponse.data.data.length > 0) {
                        
                        const topLevelManager = topLevelManagerResponse.data.data[0];
                        setReportingManager(topLevelManager.name);
                        
                        setFormData(prevData => ({
                            ...prevData,
                            parent_id: topLevelManager.id
                        }));
                    } else {
                        console.warn("No top-level manager found with hierarchy_level = 0");
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            console.error("Error details:", error.response ? error.response.data : error.message);
        }
    };

    fetchData();
}, [id, hierarchy_level, parent_id]);      

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });

        // Clear the error for the field being updated
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: "",
        }));
    };

    const validateForm = () => {
        let newErrors = {};

        // Required fields
        if (!formData.employee_id) newErrors.employee_id = "Employee ID is required.";
        if (!formData.username) newErrors.username = "Username is required.";
        if (!formData.firstname) newErrors.firstname = "First name is required.";
        if (!formData.lastname) newErrors.lastname = "Last name is required.";
        if (!formData.email) newErrors.email = "Email is required.";
        if (!formData.mobile) newErrors.mobile = "Mobile number is required.";
        if (!formData.landline) newErrors.landline = "Landline (extension) is required.";
        if (!formData.designation_id) newErrors.designation_id = "Designation is required.";
        if (!formData.department_id) newErrors.department_id = "Department is required.";

        // Employee ID validation (must start with "MAH-" followed by 6 digits)
        const employeeIdRegex = /^MAH-\d{6}$/;
        if (formData.employee_id && !employeeIdRegex.test(formData.employee_id)) {
            newErrors.employee_id = "Employee ID must start with 'MAH-' followed by 6 digits (e.g., MAH-123456).";
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = "Email must be in a valid format (e.g., example@domain.com).";
        }

        // Mobile number validation (must start with '05' and be 10 digits long)
        const mobileRegex = /^05\d{8}$/;
        if (formData.mobile && !mobileRegex.test(formData.mobile)) {
            newErrors.mobile = "Mobile number must start with '05' and be 10 digits long.";
        }

        // Landline (extension) validation (must start with '011' followed by 7 digits)
        const landlineRegex = /^011\d{7}$/;
        if (formData.landline && !landlineRegex.test(formData.landline)) {
            newErrors.landline = "Landline must start with '011' followed by 7 digits (e.g., 0111234567).";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
            setFormData((prevData) => ({
                ...prevData,
                profile_photo_path: file,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
    
        try {
            const formDataToSend = new FormData();
    
            // Debugging log before sending
            console.log("FORM DATA BEFORE SUBMIT:", formData);
    
            // IMPORTANT: Send both versions of these fields to ensure compatibility
            // with both validation rules AND database column names
            formDataToSend.append("firstname", formData.firstname || '');
            formDataToSend.append("lastname", formData.lastname || '');
            formDataToSend.append("first_name", formData.firstname || '');
            formDataToSend.append("last_name", formData.lastname || '');
            
            // Make sure the name field is constructed properly
            formDataToSend.append("name", `${formData.firstname} ${formData.lastname}`);
            
            // Other fields
            formDataToSend.append("email", formData.email || '');
            formDataToSend.append("landline", formData.landline || '');
            formDataToSend.append("mobile", formData.mobile || '');
            formDataToSend.append("designation_id", formData.designation_id || '');
            formDataToSend.append("department_id", formData.department_id || '');
            formDataToSend.append("language", formData.language || '');
            formDataToSend.append("employee_id", formData.employee_id || '');
            formDataToSend.append("username", formData.username || '');
            formDataToSend.append("hierarchy_level", formData.hierarchy_level || 0);
    
            // Handle parent_id correctly (null if not set)
            if (formData.parent_id !== undefined && formData.parent_id !== null) {
                formDataToSend.append("parent_id", formData.parent_id);
            }
    
            // Optional fields
            if (formData.employee_type) formDataToSend.append("employee_type", formData.employee_type);
            if (formData.description) formDataToSend.append("description", formData.description);
    
            // Append photo if available
            if (photo) {
                formDataToSend.append("profile_photo_path", photo);
            }
    
            let response;
    
            // Debug logging - view exactly what's being sent
            const formObject = {};
            formDataToSend.forEach((value, key) => {
                formObject[key] = value;
            });
            console.log("FORM DATA BEING SENT:", formObject);
    
            // If we have an ID, we're updating an existing user
            if (id) {
                // For update operations
                const apiUrl = `/api/v1/users/${id}`;
                console.log("Making PATCH request to:", apiUrl);
                
                // Add a _method field to properly handle PATCH with FormData
                formDataToSend.append("_method", "PATCH");
                
                // Use POST with _method=PATCH for better compatibility
                response = await axios.post(apiUrl, formDataToSend, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        "Accept": "application/json"
                    }
                });
                
                // Fetch updated user data for verification
                const refreshResponse = await axios.get(apiUrl);
                console.log("🔄 Fresh user data after update:", refreshResponse.data);
            } else {
                // For create operations - we add only what's needed for a new user
                const apiUrl = "/api/v1/users";  // No ID in URL for creation
                console.log("Making POST request to:", apiUrl);
                
                // Add required fields for new user creation
                // We need a password for new users
                formDataToSend.append("password", "Password123"); // Default password
                
                // Use a simple POST for creation
                response = await axios.post(apiUrl, formDataToSend, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        "Accept": "application/json"
                    }
                });
                
                console.log("New user created:", response.data);
            }
    
            console.log("Response Status:", response.status);
            console.log("Response Data:", response.data);
    
            alert(isEditing ? "User updated successfully!" : "User added successfully!");
            router.visit("/chart");
        } catch (error) {
            console.error("Error saving user:", error);
    
            if (error.response && error.response.data) {
                console.error("Server Response Error:", error.response.data);
    
                if (error.response.data.errors) {
                    const errorMessages = Object.values(error.response.data.errors)
                        .flat()
                        .join('\n');
                    alert(`Validation errors:\n${errorMessages}`);
                } else if (error.response.data.message) {
                    alert(`Error: ${error.response.data.message}`);
                } else if (error.response.data.error) {
                    alert(`Error: ${error.response.data.error}`);
                }
            } else {
                alert("An error occurred while saving the user. Please try again.");
            }
        }
    };

    return (
        <div className="w-full">
            <div className="grid grid-cols-2 gap-4 items-start relative">
                <div className="relative">
                    <h1 className="text-3xl font-bold text-[#2C323C]">
                        User Management
                    </h1>
                    <p className="text-[#7D8086] text-xl mt-2 mb-8">
                        Manage users and their account permissions here.
                    </p>

                    <div className="flex items-center gap-4 relative">
                        <h2 className="text-2xl font-medium text-[#6E66AC] whitespace-nowrap">
                            {isEditing ? "Edit User" : "Add a User"}
                        </h2>
                        <div
                            className="h-[3px] absolute left-0"
                            style={{
                                background: "linear-gradient(to right, #9B9DA200, #9B9DA2)",
                                width: "calc(100% + 16rem)",
                                marginLeft: "calc(100% - 26rem)"
                            }}
                        ></div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <label className="border-2 border-gray-300 bg-white rounded-full w-40 h-40 flex items-center justify-center cursor-pointer relative shadow-md overflow-hidden mb-4">
                        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white">
                            {photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt="Profile"
                                    className="w-[100%] h-[100%] object-cover rounded-full"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center w-full h-full">
                                    <FontAwesomeIcon icon={faCamera} className="text-gray-500 text-4xl mb-2" />
                                    <span className="text-gray-700 text-sm">
                                        Add Profile Picture
                                    </span>
                                </div>
                            )}
                        </div>
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

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col">
                    <InputFloating
                        label="Maharat Employee ID"
                        name="employee_id"
                        value={formData.employee_id}
                        onChange={handleChange}
                    />
                    {errors.employee_id && (
                        <p className="text-red-500 text-sm mt-1">{errors.employee_id}</p>
                    )}
                </div>
                <div className="flex flex-col">
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col">
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
                        <div className="flex flex-col">
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
                            label="Select Designation"
                            name="designation_id"
                            value={formData.designation_id}
                            onChange={handleChange}
                            options={designations.map(designation => ({
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
                            label="Select Department"
                            name="department_id"
                            value={formData.department_id}
                            onChange={handleChange}
                            options={departments.map(department => ({
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
                        <InputFloating
                            label="Reporting Manager"
                            name="parent_id"
                            value={reportingManager}
                            onChange={handleChange}
                            disabled
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <InputFloating
                        label="Language"
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                    />
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

export default Users;