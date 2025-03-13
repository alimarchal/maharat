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
        vat_no: "",
        cr_no: "",
        account_name: "",
        account_no: "",
        license_number: "",
        iban_number: "",
        bank_name: "",
        branch: "",
        swift_code: "",
    });

    const [errors, setErrors] = useState({});
    const [companyId, setCompanyId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchCompanyData();
    }, []);

    const fetchCompanyData = async () => {
        try {
            const response = await axios.get("/api/v1/companies");
            const company = response.data.data?.[0];

            if (company) {
                setFormData({
                    name: company.name ?? "",
                    email: company.email ?? "",
                    contact_number: company.contact_number ?? "",
                    country: company.country ?? "",
                    city: company.city ?? "",
                    postal_code: company.postal_code ?? "",
                    short_address: company.short_address ?? "",
                    website: company.website ?? "",
                    logo: company.logo_path ?? null,
                    vat_no: company.vat_no ?? "",
                    cr_no: company.cr_no ?? "",
                    account_name: company.account_name ?? "",
                    account_no: company.account_no ?? "",
                    license_number: company.license_number ?? "",
                    iban_number: company.iban_number ?? "",
                    bank_name: company.bank_name ?? "",
                    branch: company.branch ?? "",
                    swift_code: company.sabb_swift_code ?? "",
                });
                setCompanyId(company.id);
            }
        } catch (error) {
            console.error("Error fetching company data:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prevData) => ({
                ...prevData,
                logo: file,
            }));
        }
    };

    const validate = () => {
        const tempErrors = {};
        if (!formData.name) tempErrors.name = "Organization name is required";
        if (!formData.email) tempErrors.email = "Email is required";
        if (!formData.contact_number)
            tempErrors.contact_number = "Contact number is required";
        if (!formData.country) tempErrors.country = "Country is required";
        if (!formData.city) tempErrors.city = "City is required";
        if (!formData.postal_code)
            tempErrors.postal_code = "Postal code is required";
        if (!formData.short_address)
            tempErrors.short_address = "Short address is required";
        if (!formData.vat_no) tempErrors.vat_no = "VAT number is required";
        if (!formData.cr_no) tempErrors.cr_no = "CR number is required";
        if (!formData.account_name)
            tempErrors.account_name = "Account name is required";
        if (!formData.account_no)
            tempErrors.account_no = "Account number is required";
        if (!formData.license_number)
            tempErrors.license_number = "License number is required";
        if (!formData.iban_number)
            tempErrors.iban_number = "IBAN number is required";
        if (!formData.bank_name) tempErrors.bank_name = "Bank name is required";
        if (!formData.swift_code)
            tempErrors.swift_code = "Swift Code is required";
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const prepareFormData = () => {
        const formDataToSend = new FormData();

        Object.keys(formData).forEach((key) => {
            if (key === "logo" && formData[key] instanceof File) {
                formDataToSend.append(key, formData[key]);
            } else if (formData[key] !== null && formData[key] !== undefined) {
                formDataToSend.append(key, formData[key]);
            }
        });

        return formDataToSend;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setIsSubmitting(true);

        try {
            const formDataToSend = prepareFormData();
            let response;

            if (companyId) {
                response = await axios.put(
                    `/api/v1/companies/${companyId}`,
                    formDataToSend
                );
            } else {
                response = await axios.post(
                    "/api/v1/companies",
                    formDataToSend
                );
                setCompanyId(response.data.data.id);
            }

            fetchCompanyData();
        } catch (error) {
            console.error("Error saving data:", error);
        } finally {
            setIsSubmitting(false);
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
                                className="w-24 h-24 object-contain"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        label="Maharat Email"
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
                <div>
                    <InputFloating
                        label="Contact Number"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleChange}
                    />
                    {errors.contact_number && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.contact_number}
                        </p>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                <div>
                    <InputFloating
                        label="Address"
                        name="short_address"
                        value={formData.short_address}
                        onChange={handleChange}
                    />
                    {errors.short_address && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.short_address}
                        </p>
                    )}
                </div>
                <InputFloating
                    label="Company Website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
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
                    label="Postal Code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <InputFloating
                        label="Bank Name"
                        name="bank_name"
                        value={formData.bank_name}
                        onChange={handleChange}
                    />
                    {errors.bank_name && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.bank_name}
                        </p>
                    )}
                </div>
                <div>
                    <InputFloating
                        label="Branch"
                        name="branch"
                        value={formData.branch}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <InputFloating
                        label="Swift Code"
                        name="swift_code"
                        value={formData.swift_code}
                        onChange={handleChange}
                    />
                    {errors.swift_code && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.swift_code}
                        </p>
                    )}
                </div>
                <div>
                    <InputFloating
                        label="Account Name"
                        name="account_name"
                        value={formData.account_name}
                        onChange={handleChange}
                    />
                    {errors.account_name && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.account_name}
                        </p>
                    )}
                </div>
                <div>
                    <InputFloating
                        label="Account Number"
                        name="account_no"
                        value={formData.account_no}
                        onChange={handleChange}
                    />
                    {errors.account_no && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.account_no}
                        </p>
                    )}
                </div>
                <div>
                    <InputFloating
                        label="IBAN Number"
                        name="iban_number"
                        value={formData.iban_number}
                        onChange={handleChange}
                    />
                    {errors.iban_number && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.iban_number}
                        </p>
                    )}
                </div>
                <div>
                    <InputFloating
                        label="License Number"
                        name="license_number"
                        value={formData.license_number}
                        onChange={handleChange}
                    />
                    {errors.license_number && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.license_number}
                        </p>
                    )}
                </div>
                <div>
                    <InputFloating
                        label="VAT Number"
                        name="vat_no"
                        value={formData.vat_no}
                        onChange={handleChange}
                    />
                    {errors.vat_no && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.vat_no}
                        </p>
                    )}
                </div>
                <div>
                    <InputFloating
                        label="CR Number"
                        name="cr_no"
                        value={formData.cr_no}
                        onChange={handleChange}
                    />
                    {errors.cr_no && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.cr_no}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex justify-end my-6 space-x-4">
                <button
                    className={`px-8 py-2 text-xl font-medium border border-[#009FDC] text-[#009FDC] rounded-full transition duration-300 ${
                        companyId
                            ? "hover:bg-[#009FDC] hover:text-white"
                            : "opacity-50 cursor-not-allowed"
                    }`}
                    onClick={handleSave}
                    disabled={!companyId || isSubmitting}
                >
                    {isSubmitting ? "Updating..." : "Edit"}
                </button>
                <button
                    className={`px-8 py-2 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 ${
                        companyId
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-[#007BB5]"
                    }`}
                    onClick={handleSave}
                    disabled={companyId || isSubmitting}
                >
                    {isSubmitting ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
};

export default CompanyProfile;
