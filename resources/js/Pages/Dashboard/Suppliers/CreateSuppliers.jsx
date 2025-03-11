import React, { useState, useEffect } from "react";
import InputFloating from "../../../Components/InputFloating";
import SelectFloating from "../../../Components/SelectFloating";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";

const CreateSupplier = () => {
    const { supplierId } = usePage().props;

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        email: "",
        phone: "",
        website: "",
        tax_number: "",
        payment_terms: "",
        is_approved: false,
        currency_id: "",
        status_id: "",
        contacts: [
            {
                contact_name: "",
                designation: "",
                email: "",
                phone: "",
                is_primary: true,
            },
        ],
        addresses: [
            {
                address_type: "billing",
                street_address: "",
                city: "",
                state: "",
                country: "",
                postal_code: "",
            },
        ],
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (supplierId) {
            const fetchSupplierData = async () => {
                try {
                    const response = await axios.get(
                        `/api/v1/suppliers/${supplierId}?include=contacts,addresses,currency,status`
                    );

                    setFormData({
                        ...response.data.data,
                        contacts:
                            response.data.data.contacts || formData.contacts,
                        addresses:
                            response.data.data.addresses || formData.addresses,
                        currency:
                            response.data.data.currency || formData.currency,
                        status: response.data.data.status || formData.status,
                    });
                } catch (error) {
                    console.error("Error fetching supplier data:", error);
                }
            };

            fetchSupplierData();
        }
    }, [supplierId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: "" });
    };

    const handleNestedChange = (e, section, key) => {
        const { value } = e.target;
        setFormData({
            ...formData,
            [section]: [{ ...formData[section][0], [key]: value }],
        });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Supplier Name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.phone.trim()) newErrors.phone = "Phone is required";
        if (!formData.tax_number.trim())
            newErrors.tax_number = "Tax Number is required";
        if (!formData.currency_id)
            newErrors.currency_id = "Currency is required";
        if (!formData.status_id) newErrors.status_id = "Status is required";
        if (!formData.payment_terms)
            newErrors.payment_terms = "Payment Terms is required";
        if (!formData.contacts[0].contact_name.trim())
            newErrors.contact_name = "Contact Name is required";
        if (!formData.contacts[0].email.trim())
            newErrors.contact_email = "Contact Email is required";
        if (!formData.addresses[0].street_address.trim())
            newErrors.street_address = "Street Address is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            if (supplierId) {
                await axios.put(`/api/v1/suppliers/${supplierId}`, formData);
            } else {
                await axios.post("/api/v1/suppliers", formData);
            }
            router.visit("/suppliers");
        } catch (error) {
            setErrors(
                error.response?.data?.errors || {
                    general: "An error occurred while saving the supplier",
                }
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <h2 className="text-3xl font-bold text-[#2C323C]">
                {supplierId ? "Edit Supplier" : "Create New Supplier"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputFloating
                            label="Supplier Name"
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
                    <InputFloating
                        label="Supplier Code"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                    />
                    <div>
                        <InputFloating
                            label="Email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm">
                                {errors.email}
                            </p>
                        )}
                    </div>
                    <div>
                        <InputFloating
                            label="Phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                        {errors.phone && (
                            <p className="text-red-500 text-sm">
                                {errors.phone}
                            </p>
                        )}
                    </div>
                    <InputFloating
                        label="Website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                    />
                    <div>
                        <InputFloating
                            label="Tax Number"
                            name="tax_number"
                            value={formData.tax_number}
                            onChange={handleChange}
                        />
                        {errors.tax_number && (
                            <p className="text-red-500 text-sm">
                                {errors.tax_number}
                            </p>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <SelectFloating
                            label="Currency"
                            name="currency_id"
                            value={formData.currency_id}
                            onChange={handleChange}
                            options={[
                                { id: 1, label: "USD" },
                                { id: 2, label: "SAR" },
                            ]}
                        />
                        {errors.currency_id && (
                            <p className="text-red-500 text-sm">
                                {errors.currency_id}
                            </p>
                        )}
                    </div>
                    <div>
                        <SelectFloating
                            label="Status"
                            name="status_id"
                            value={formData.status_id}
                            onChange={handleChange}
                            options={[
                                { id: 1, label: "Active" },
                                { id: 2, label: "Inactive" },
                            ]}
                        />
                        {errors.status_id && (
                            <p className="text-red-500 text-sm">
                                {errors.status_id}
                            </p>
                        )}
                    </div>
                    <div>
                        <SelectFloating
                            label="Payment Terms"
                            name="payment_terms"
                            value={formData.payment_terms}
                            onChange={handleChange}
                            options={[
                                { id: 1, label: "Cash" },
                                { id: 2, label: "Credit" },
                            ]}
                        />
                        {errors.payment_terms && (
                            <p className="text-red-500 text-sm">
                                {errors.payment_terms}
                            </p>
                        )}
                    </div>
                </div>
                <h3 className="text-xl font-semibold mt-6">Contact Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputFloating
                            label="Contact Name"
                            name="contact_name"
                            value={formData.contacts[0]?.contact_name}
                            onChange={(e) =>
                                handleNestedChange(
                                    e,
                                    "contacts",
                                    "contact_name"
                                )
                            }
                        />
                        {errors.contact_name && (
                            <p className="text-red-500 text-sm">
                                {errors.contact_name}
                            </p>
                        )}
                    </div>
                    <InputFloating
                        label="Designation"
                        name="designation"
                        value={formData.contacts[0]?.designation}
                        onChange={(e) =>
                            handleNestedChange(e, "contacts", "designation")
                        }
                    />
                    <div>
                        <InputFloating
                            label="Contact Email"
                            name="contact_email"
                            value={formData.contacts[0]?.email}
                            onChange={(e) =>
                                handleNestedChange(e, "contacts", "email")
                            }
                        />
                        {errors.contact_email && (
                            <p className="text-red-500 text-sm">
                                {errors.contact_email}
                            </p>
                        )}
                    </div>
                    <InputFloating
                        label="Contact Phone"
                        name="contact_phone"
                        value={formData.contacts[0]?.phone}
                        onChange={(e) =>
                            handleNestedChange(e, "contacts", "phone")
                        }
                    />
                </div>
                <h3 className="text-xl font-semibold mt-6">Address Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputFloating
                            label="Street Address"
                            name="street_address"
                            value={formData.addresses[0]?.street_address}
                            onChange={(e) =>
                                handleNestedChange(
                                    e,
                                    "addresses",
                                    "street_address"
                                )
                            }
                        />
                        {errors.street_address && (
                            <p className="text-red-500 text-sm">
                                {errors.street_address}
                            </p>
                        )}
                    </div>
                    <InputFloating
                        label="City"
                        name="city"
                        value={formData.addresses[0]?.city}
                        onChange={(e) =>
                            handleNestedChange(e, "addresses", "city")
                        }
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-[#009FDC] text-white text-lg font-medium px-6 py-3 rounded-lg hover:bg-[#007CB8] disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading
                            ? supplierId
                                ? "Updating..."
                                : "Creating..."
                            : supplierId
                            ? "Update Supplier"
                            : "Create Supplier"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateSupplier;
