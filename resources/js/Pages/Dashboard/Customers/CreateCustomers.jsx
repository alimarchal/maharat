import React, { useState, useEffect } from "react";
import InputFloating from "../../../Components/InputFloating";
import SelectFloating from "../../../Components/SelectFloating";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";

const CreateCustomer = () => {
    const { customerId } = usePage().props;

    const [formData, setFormData] = useState({
        name: "",
        commercial_registration_number: "",
        tax_group_registration_number: "",
        contact_number: "",
        type: "both",
        address: "",
        country_code: "SA",
        account_name: "",
        iban: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (customerId) {
            axios
                .get(`/api/v1/customers/${customerId}`)
                .then((response) => {
                    setFormData(response.data.data);
                })
                .catch((error) =>
                    console.error("Error fetching customer:", error)
                );
        }
    }, [customerId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: "" });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Customer Name is required";
        if (!formData.contact_number.trim())
            newErrors.contact_number = "Contact Number is required";
        if (!formData.address.trim()) newErrors.address = "Address is required";
        if (!formData.country_code.trim())
            newErrors.country_code = "Country Code is required";
        if (!formData.iban.trim()) newErrors.iban = "IBAN is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            if (customerId) {
                await axios.put(`/api/v1/customers/${customerId}`, formData);
            } else {
                await axios.post("/api/v1/customers", formData);
            }
            router.visit("/customers");
        } catch (error) {
            setErrors(
                error.response?.data?.errors || {
                    general: "An error occurred while saving the customer",
                }
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <h2 className="text-3xl font-bold text-[#2C323C]">
                {customerId ? "Edit Customer" : "Create New Customer"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputFloating
                            label="Customer Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <div>
                        <InputFloating
                            label="Commercial Registration Number"
                            name="commercial_registration_number"
                            value={formData.commercial_registration_number}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <InputFloating
                            label="Tax Group Registration Number"
                            name="tax_group_registration_number"
                            value={formData.tax_group_registration_number}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <InputFloating
                            label="Contact Number"
                            name="contact_number"
                            value={formData.contact_number}
                            onChange={handleChange}
                        />
                        {errors.contact_number && (
                            <p className="text-red-500 text-sm">
                                {errors.contact_number}
                            </p>
                        )}
                    </div>
                    <div>
                        <SelectFloating
                            label="Type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            options={[
                                { id: "both", label: "Both" },
                                { id: "individual", label: "Individual" },
                                { id: "corporate", label: "Corporate" },
                            ]}
                        />
                    </div>
                    <div>
                        <InputFloating
                            label="Address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                        />
                        {errors.address && (
                            <p className="text-red-500 text-sm">
                                {errors.address}
                            </p>
                        )}
                    </div>
                    <div>
                        <SelectFloating
                            label="Country"
                            name="country_code"
                            value={formData.country_code}
                            onChange={handleChange}
                            options={[{ id: "SA", label: "Saudi Arabia" }]}
                        />
                        {errors.country_code && (
                            <p className="text-red-500 text-sm">
                                {errors.country_code}
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
                    </div>
                    <div>
                        <InputFloating
                            label="IBAN"
                            name="iban"
                            value={formData.iban}
                            onChange={handleChange}
                        />
                        {errors.iban && (
                            <p className="text-red-500 text-sm">
                                {errors.iban}
                            </p>
                        )}
                    </div>
                </div>
                {errors.general && (
                    <p className="text-red-500 text-sm">{errors.general}</p>
                )}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-[#009FDC] text-white text-lg font-medium px-6 py-3 rounded-lg hover:bg-[#007CB8] disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading
                            ? customerId
                                ? "Updating..."
                                : "Creating..."
                            : customerId
                            ? "Update Customer"
                            : "Create Customer"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateCustomer;
