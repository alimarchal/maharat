import React, { useState, useEffect } from "react";
import { FaCamera } from "react-icons/fa";
import InputFloating from "../../Components/InputFloating";
import axios from "axios";

const CompanyProfile = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        contact_number: "",
        country: "",
        city: "",
        postal_code: "",
        short_address: "",
        website: "",
        logo: null,
        fiscal_year_start: "2025-01-01",
        fiscal_year_end: "2025-12-31",
    });

    const [errors, setErrors] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [companyId, setCompanyId] = useState(null);

    useEffect(() => {
        fetchCompanyData();
    }, []);

    const fetchCompanyData = async () => {
        try {
            const response = await axios.get("/api/v1/companies");
            console.log("Fetched Data:", response.data);

            if (response.data) {
                setFormData({
                    name: response.data.name || "",
                    email: response.data.email || "",
                    contact_number: response.data.contact_number || "",
                    country: response.data.country || "",
                    city: response.data.city || "",
                    postal_code: response.data.postal_code || "",
                    short_address: response.data.short_address || "",
                    website: response.data.website || "",
                    logo: response.data.logo || null,
                });
                setCompanyId(response.data.id);
                setIsEditing(true);
            }
        } catch (error) {
            console.error("Error fetching company data:", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, logo: e.target.files[0] });
    };

    const validate = () => {
        let tempErrors = {};
        if (!formData.name) tempErrors.name = "Organization name is required";
        if (!formData.email) tempErrors.email = "Email is required";
        if (!formData.country) tempErrors.country = "Country is required";
        if (!formData.city) tempErrors.city = "City is required";
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach((key) => {
                formDataToSend.append(key, formData[key]);
            });

            let response;
            if (companyId) {
                response = await axios.put(
                    `/api/v1/companies/${companyId}`,
                    formDataToSend,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                    }
                );
            } else {
                response = await axios.post(
                    "/api/v1/companies",
                    formDataToSend,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                    }
                );
                setCompanyId(response.data.id);
            }

            setIsEditing(true);
            fetchCompanyData();
        } catch (error) {
            console.error("Error saving data:", error);
        }
    };

    return (
        <div className="w-full mx-auto">
            <h2 className="text-3xl font-bold text-[#2C323C]">
                Company Profile
            </h2>
            <p className="text-xl text-[#7D8086]">
                Make changes in Maharat profile
            </p>

            <div className="flex flex-col items-center mb-8">
                <div className="relative">
                    <div className="w-36 h-36 border-2 border-green-500 rounded-full flex items-center justify-center bg-white">
                        {formData.logo ? (
                            <img
                                src={
                                    typeof formData.logo === "string"
                                        ? formData.logo
                                        : URL.createObjectURL(formData.logo)
                                }
                                alt="Company Logo"
                                className="w-full h-full object-cover rounded-full"
                            />
                        ) : (
                            <img
                                src="/images/MCTC Logo.png"
                                alt="Company Logo"
                                className="w-24 h-24 object-contain"
                            />
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

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <InputFloating
                        label="Organization Name"
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
                    <InputFloating
                        label="Maharat Mail"
                        name="email"
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
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                />
                <div>
                    <InputFloating
                        label="Country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                    />
                    {errors.country && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.country}
                        </p>
                    )}
                </div>
                <div>
                    <InputFloating
                        label="City"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                    />
                    {errors.city && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.city}
                        </p>
                    )}
                </div>
                <InputFloating
                    label="Zip Code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                />
                <InputFloating
                    label="Address"
                    name="short_address"
                    value={formData.short_address}
                    onChange={handleChange}
                />
                <InputFloating
                    label="Company Website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                />
            </div>

            <div className="flex justify-end my-6 space-x-4">
                <button
                    className={`px-8 py-2 text-xl font-medium border border-[#009FDC] text-[#009FDC] rounded-full transition duration-300 ${
                        isEditing
                            ? "hover:bg-[#009FDC] hover:text-white"
                            : "opacity-50 cursor-not-allowed"
                    }`}
                    onClick={() => setIsEditing(false)}
                    disabled={!isEditing}
                >
                    Edit
                </button>
                <button
                    className={`px-8 py-2 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 ${
                        isEditing
                            ? "hover:bg-[#007BB5]"
                            : "opacity-50 cursor-not-allowed"
                    }`}
                    onClick={handleSave}
                    disabled={!isEditing}
                >
                    Save
                </button>
            </div>
        </div>
    );
};

export default CompanyProfile;
