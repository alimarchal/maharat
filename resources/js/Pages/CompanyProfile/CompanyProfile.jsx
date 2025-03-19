import React, { useState, useEffect } from "react";
import { FaCamera } from "react-icons/fa";
import InputFloating from "../../Components/InputFloating";
import axios from "axios";

const CompanyProfile = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        contact_number: "",
        address: "",
        website: "",
        country: "",
        city: "",
        postal_code: "",
        bank: "",
        branch: "",
        swift: "",
        account_name: "",
        account_no: "",
        iban: "",
        license_no: "",
        var: "",
        cr_no: "",
        logo_path: null,
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
                    address: company.address ?? "",
                    website: company.website ?? "",
                    country: company.country ?? "",
                    city: company.city ?? "",
                    postal_code: company.postal_code ?? "",
                    bank: company.bank ?? "",
                    branch: company.branch ?? "",
                    swift: company.swift ?? "",
                    account_name: company.account_name ?? "",
                    account_no: company.account_no ?? "",
                    iban: company.iban ?? "",
                    license_no: company.license_no ?? "",
                    var: company.var ?? "",
                    cr_no: company.cr_no ?? "",
                    logo_path: company.logo_path ?? null,
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
                logo_path: file,
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
        if (!formData.address) tempErrors.address = "Address is required";
        if (!formData.var) tempErrors.var = "VAT number is required";
        if (!formData.cr_no) tempErrors.cr_no = "CR number is required";
        if (!formData.account_name)
            tempErrors.account_name = "Account name is required";
        if (!formData.account_no)
            tempErrors.account_no = "Account number is required";
        if (!formData.license_no)
            tempErrors.license_no = "License number is required";
        if (!formData.iban) tempErrors.iban = "IBAN number is required";
        if (!formData.bank) tempErrors.bank = "Bank name is required";
        if (!formData.swift) tempErrors.swift = "Swift Code is required";
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);

        try {
            const payload = { ...formData };

            let response;
            if (companyId) {
                response = await axios.put(
                    `/api/v1/companies/${companyId}`,
                    payload
                );
            } else {
                response = await axios.post("/api/v1/companies", payload);
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

            <form onSubmit={handleSubmit}>
                <div className="flex flex-col items-center mb-8">
                    <div className="relative">
                        <div className="w-36 h-36 border-2 border-green-500 rounded-full flex items-center justify-center bg-white">
                            {formData.logo_path ? (
                                <img
                                    src={
                                        typeof formData.logo_path === "string"
                                            ? formData.logo_path
                                            : URL.createObjectURL(
                                                  formData.logo_path
                                              )
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
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                        />
                        {errors.address && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.address}
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
                    <div>
                        <InputFloating
                            label="Postal Code"
                            name="postal_code"
                            value={formData.postal_code}
                            onChange={handleChange}
                        />
                        {errors.postal_code && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.postal_code}
                            </p>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <InputFloating
                            label="Bank Name"
                            name="bank"
                            value={formData.bank}
                            onChange={handleChange}
                        />
                        {errors.bank && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.bank}
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
                            name="swift"
                            value={formData.swift}
                            onChange={handleChange}
                        />
                        {errors.swift && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.swift}
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
                            name="iban"
                            value={formData.iban}
                            onChange={handleChange}
                        />
                        {errors.iban && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.iban}
                            </p>
                        )}
                    </div>
                    <div>
                        <InputFloating
                            label="License Number"
                            name="license_no"
                            value={formData.license_no}
                            onChange={handleChange}
                        />
                        {errors.license_no && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.license_no}
                            </p>
                        )}
                    </div>
                    <div>
                        <InputFloating
                            label="VAT Number"
                            name="var"
                            value={formData.var}
                            onChange={handleChange}
                        />
                        {errors.var && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.var}
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
                        type="button"
                        className={`px-8 py-2 text-xl font-medium border border-[#009FDC] text-[#009FDC] rounded-full transition duration-300 ${
                            !companyId || isSubmitting
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-[#009FDC] hover:text-white"
                        }`}
                        disabled={!companyId || isSubmitting}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? "Updating..." : "Edit"}
                    </button>
                    <button
                        type="submit"
                        className={`px-8 py-2 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 ${
                            companyId || isSubmitting
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-[#007BB5]"
                        }`}
                        disabled={companyId || isSubmitting}
                    >
                        {isSubmitting ? "Saving..." : "Save"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanyProfile;
