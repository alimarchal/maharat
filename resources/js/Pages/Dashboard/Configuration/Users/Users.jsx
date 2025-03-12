import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCsv, faCamera } from "@fortawesome/free-solid-svg-icons";
import SelectFloating from "../../../../Components/SelectFloating";
import InputFloating from "../../../../Components/InputFloating";
import axios from "axios";
import { router, usePage } from '@inertiajs/react';

const Users = () => {
    // Get props from Inertia page
    const { props } = usePage();
    const urlParams = new URLSearchParams(window.location.search);
    
    // Extract hierarchy data from URL parameters
    const hierarchy_level = urlParams.get('hierarchy_level') ? parseInt(urlParams.get('hierarchy_level')) : undefined;
    const parent_id = urlParams.get('parent_id') ? parseInt(urlParams.get('parent_id')) : null;

    // Log the received information
    console.log("URL Parameters:", {
        raw_url_params: window.location.search,
        hierarchy_level: hierarchy_level,
        parent_id: parent_id
    });

    const [formData, setFormData] = useState({
        employee_id: "",
        username: "",
        first_name: "",
        last_name: "",
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

    // Fetch designations, departments, and reporting manager on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [designationsResponse, departmentsResponse, reportingManagerResponse] = await Promise.all([
                    axios.get('/api/v1/designations'),
                    axios.get('/api/v1/departments'),
                    parent_id ? axios.get(`/api/v1/users/${parent_id}`) : Promise.resolve(null),
                ]);

                setDesignations(designationsResponse.data.data);
                setDepartments(departmentsResponse.data.data);

                if (reportingManagerResponse) {
                    setReportingManager(reportingManagerResponse.data.data.name);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, [parent_id]);

    // Update formData when props change
    useEffect(() => {
        console.log("useEffect triggered with URL params:", { parent_id, hierarchy_level });
        
        if (parent_id !== undefined || hierarchy_level !== undefined) {
            console.log("Updating form data with new hierarchy information:", {
                parent_id: parent_id,
                hierarchy_level: hierarchy_level
            });
            
            setFormData(prevData => ({
                ...prevData,
                parent_id: parent_id || prevData.parent_id,
                hierarchy_level: hierarchy_level !== undefined ? hierarchy_level : prevData.hierarchy_level
            }));
        }
    }, [parent_id, hierarchy_level]);

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
        if (!formData.mobile) newErrors.mobile = "Mobile number is required.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const [photo, setPhoto] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const name = `${formData.first_name} ${formData.last_name}`.trim();
            const userData = {
                employee_id: formData.employee_id,
                username: formData.username,
                name: name,
                email: formData.email,
                landline: formData.landline,
                mobile: formData.mobile,
                designation_id: formData.designation_id,
                department_id: formData.department_id,
                language: formData.language,
                employee_type: formData.employee_type,
                description: formData.description,
                parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
                hierarchy_level: formData.hierarchy_level,
                password: "defaultPassword", // Add a default password or make it optional in the backend
            };

            console.log("Submitting user data:", userData);
            
            const response = await axios.post("/api/v1/users", userData);
            console.log("API Response:", response.data);
            
            alert("User added successfully!");
            setFormData({
                employee_id: "",
                username: "",
                first_name: "",
                last_name: "",
                email: "",
                landline: "",
                mobile: "",
                designation_id: "",
                department_id: "",
                language: "",
                employee_type: "",
                description: "",
                parent_id: "",
                hierarchy_level: 0,
            });
            setErrors({});
            router.visit("/chart");
        } catch (error) {
            console.log("API Error Details:", error.response?.data);
            console.error("Error saving user", error);
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
                            Add a User
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
                            {photo ? (
                                <img
                                    src={photo}
                                    alt="Profile"
                                    className="w-full h-full object-contain rounded-full"
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
                    <InputFloating
                        label="Maharat Employee ID"
                        name="employee_id"
                        value={formData.employee_id}
                        onChange={handleChange}
                    />
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <InputFloating
                        label="First Name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                    />
                    <InputFloating
                        label="Last Name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                    />
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
                    <InputFloating
                        label="Extension Number"
                        name="landline"
                        value={formData.landline}
                        onChange={handleChange}
                    />
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